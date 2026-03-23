"""
Index ALL legislative PDFs into legislacion_documents for RAG chatbot.

Processes every PDF in packages/web/public/documents/legislacion/ directory.
Each PDF is parsed page-by-page, chunked with overlap, embedded with Vertex AI,
and upserted into legislacion_documents table for cosine similarity search.

Usage:
    cd packages/backend
    python scripts/index_legislacion_pdfs.py                    # Index all PDFs
    python scripts/index_legislacion_pdfs.py --doc Precios      # Index one PDF
    python scripts/index_legislacion_pdfs.py --force            # Re-index all (overwrite)
    python scripts/index_legislacion_pdfs.py --dry-run          # Parse only, no DB writes
    python scripts/index_legislacion_pdfs.py --chunk-size 1500  # Custom chunk size

Requires: pdfplumber, google-cloud-aiplatform, asyncpg
"""

import argparse
import asyncio
import glob
import os
import sys
import time

# Add backend root to path so app modules can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pdfplumber
from loguru import logger

from app.database.connection import db_manager
from app.modules.chatbot.services.embedding_service import embedding_service

# Defaults
PDF_FOLDER = os.path.join(
    os.path.dirname(__file__), '..', '..', 'web', 'public',
    'documents', 'legislacion'
)
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 100
EMBEDDING_MODEL = 'text-embedding-005'
MIN_CHUNK_LENGTH = 50
BATCH_LOG_INTERVAL = 10


def normalize_doc_name(filename: str) -> str:
    """Convert filename to document name for DB storage.

    Examples:
        Precios.pdf -> Precios
        Ley_de_Tasas_Fiscales.pdf -> Ley_de_Tasas_Fiscales
        CODIGOS-DE-INGRESOS-2025.pdf -> CODIGOS-DE-INGRESOS-2025
    """
    return os.path.splitext(filename)[0]


def parse_pdf(pdf_path: str, chunk_size: int, chunk_overlap: int) -> list[dict]:
    """Parse PDF page by page, chunk with sliding window overlap."""
    chunks = []
    filename = os.path.basename(pdf_path)
    doc_name = normalize_doc_name(filename)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            logger.info(f"  Opened {filename}: {total_pages} pages")

            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ''
                if not text.strip():
                    continue

                step = max(1, chunk_size - chunk_overlap)
                for i in range(0, len(text), step):
                    chunk = text[i:i + chunk_size]
                    if len(chunk.strip()) < MIN_CHUNK_LENGTH:
                        continue
                    chunk_idx = i // step
                    chunks.append({
                        'doc_name': doc_name,
                        'page_number': page_num,
                        'chunk_id': f'{doc_name.lower()}_p{page_num}_c{chunk_idx}',
                        'content': chunk.strip(),
                    })
    except Exception as e:
        logger.error(f"  Failed to parse {filename}: {e}")
        return []

    return chunks


async def get_existing_chunks(conn, doc_name: str) -> set[str]:
    """Get chunk_ids already indexed for a document."""
    rows = await conn.fetch(
        "SELECT chunk_id FROM legislacion_documents WHERE document_name = $1",
        doc_name,
    )
    return {row['chunk_id'] for row in rows}


async def index_chunks(
    conn, chunks: list[dict], force: bool = False, dry_run: bool = False
) -> dict:
    """Embed and upsert chunks into legislacion_documents."""
    stats = {'inserted': 0, 'updated': 0, 'skipped': 0, 'failed': 0}

    if not chunks:
        return stats

    doc_name = chunks[0]['doc_name']

    # Check existing chunks (skip if not --force)
    existing = set()
    if not force and not dry_run:
        existing = await get_existing_chunks(conn, doc_name)
        if existing:
            logger.info(f"  {len(existing)} chunks already indexed for {doc_name}")

    for chunk in chunks:
        # Skip if already indexed and not forcing
        if chunk['chunk_id'] in existing and not force:
            stats['skipped'] += 1
            continue

        if dry_run:
            stats['inserted'] += 1
            continue

        # Generate embedding
        embedding = await embedding_service.generate_embedding(
            chunk['content'],
            task_type='RETRIEVAL_DOCUMENT',
            title=f"{chunk['doc_name']} - Página {chunk['page_number']}",
        )
        if not embedding:
            logger.warning(f"  FAIL {chunk['chunk_id']}: embedding generation failed")
            stats['failed'] += 1
            continue

        embedding_str = '[' + ','.join(str(x) for x in embedding) + ']'

        is_update = chunk['chunk_id'] in existing
        await conn.execute(
            """
            INSERT INTO legislacion_documents
                (document_name, page_number, chunk_id, content,
                 embedding, embedding_model, embedding_generated_at)
            VALUES ($1, $2, $3, $4, $5::vector, $6, NOW())
            ON CONFLICT (document_name, chunk_id) DO UPDATE SET
                content = EXCLUDED.content,
                embedding = EXCLUDED.embedding,
                embedding_model = EXCLUDED.embedding_model,
                embedding_generated_at = NOW(),
                updated_at = NOW()
            """,
            chunk['doc_name'],
            chunk['page_number'],
            chunk['chunk_id'],
            chunk['content'],
            embedding_str,
            EMBEDDING_MODEL,
        )

        if is_update:
            stats['updated'] += 1
        else:
            stats['inserted'] += 1

        total_done = stats['inserted'] + stats['updated'] + stats['skipped']
        if total_done % BATCH_LOG_INTERVAL == 0:
            logger.info(
                f"  Progress: {total_done}/{len(chunks)} "
                f"(+{stats['inserted']} new, ~{stats['updated']} updated, "
                f"={stats['skipped']} skipped)"
            )

    return stats


async def main():
    parser = argparse.ArgumentParser(
        description='Index legislative PDFs for RAG chatbot'
    )
    parser.add_argument(
        '--doc', type=str, default=None,
        help='Index a specific document (filename without .pdf extension)'
    )
    parser.add_argument(
        '--force', action='store_true',
        help='Re-index all chunks even if already indexed'
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Parse PDFs only, no DB writes or embedding generation'
    )
    parser.add_argument(
        '--chunk-size', type=int, default=DEFAULT_CHUNK_SIZE,
        help=f'Chunk size in characters (default: {DEFAULT_CHUNK_SIZE})'
    )
    parser.add_argument(
        '--chunk-overlap', type=int, default=DEFAULT_CHUNK_OVERLAP,
        help=f'Chunk overlap in characters (default: {DEFAULT_CHUNK_OVERLAP})'
    )
    args = parser.parse_args()

    # Discover PDFs
    if args.doc:
        pdf_path = os.path.join(PDF_FOLDER, f'{args.doc}.pdf')
        if not os.path.exists(pdf_path):
            logger.error(f"PDF not found: {pdf_path}")
            sys.exit(1)
        pdf_files = [pdf_path]
    else:
        pdf_files = sorted(glob.glob(os.path.join(PDF_FOLDER, '*.pdf')))
        if not pdf_files:
            logger.error(f"No PDFs found in {PDF_FOLDER}")
            sys.exit(1)

    logger.info(f"Found {len(pdf_files)} PDF(s) to index")
    for f in pdf_files:
        logger.info(f"  - {os.path.basename(f)}")

    # Parse all PDFs
    all_chunks = []
    for pdf_path in pdf_files:
        chunks = parse_pdf(pdf_path, args.chunk_size, args.chunk_overlap)
        all_chunks.extend(chunks)
        logger.info(f"  → {len(chunks)} chunks extracted")

    logger.info(f"Total chunks to process: {len(all_chunks)}")

    if not all_chunks:
        logger.warning("No chunks extracted from any PDF")
        return

    if args.dry_run:
        logger.info("[DRY RUN] Would index the following:")
        docs = {}
        for c in all_chunks:
            docs.setdefault(c['doc_name'], 0)
            docs[c['doc_name']] += 1
        for doc, count in docs.items():
            logger.info(f"  {doc}: {count} chunks")
        return

    # Initialize DB + index
    await db_manager.initialize()
    start_time = time.time()

    total_stats = {'inserted': 0, 'updated': 0, 'skipped': 0, 'failed': 0}

    async with db_manager.get_connection() as conn:
        # Group chunks by document for efficient existing-check
        docs = {}
        for c in all_chunks:
            docs.setdefault(c['doc_name'], []).append(c)

        for doc_name, chunks in docs.items():
            logger.info(f"\nIndexing {doc_name} ({len(chunks)} chunks)...")
            stats = await index_chunks(conn, chunks, args.force, args.dry_run)
            for k, v in stats.items():
                total_stats[k] += v
            logger.info(
                f"  {doc_name}: +{stats['inserted']} new, "
                f"~{stats['updated']} updated, ={stats['skipped']} skipped, "
                f"x{stats['failed']} failed"
            )

    await db_manager.close()

    elapsed = time.time() - start_time
    logger.info(
        f"\nDone in {elapsed:.1f}s: "
        f"+{total_stats['inserted']} inserted, "
        f"~{total_stats['updated']} updated, "
        f"={total_stats['skipped']} skipped, "
        f"x{total_stats['failed']} failed"
    )


if __name__ == '__main__':
    asyncio.run(main())
