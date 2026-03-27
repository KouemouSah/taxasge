"""
Index Precios.pdf with STRUCTURED table extraction for RAG chatbot.

Unlike generic PDF chunking (extract_text → sliding window), this script:
1. Uses pdfplumber extract_tables() to parse the 2-column table layout
2. Creates semantically structured chunks per (commerce_type, zone)
3. Preserves: commerce name, zone name, category tier, line items, totals
4. Generates high-quality embeddings optimized for pricing queries

Output chunks look like:
  "PRECIOS OFICIALES - Bares y Restaurantes en Capitales de Regiones (Zona A1)
   Tasas del Tesoro Público:
   - Contribución Mobiliaria Fiscal (CMF): 480,000 XAF
   - Cuota Anual comercial: 60,000 XAF
   ...
   TOTAL TESORO PÚBLICO: 322,000 XAF
   TOTAL CÁMARA DE COMERCIO: 40,000 XAF"

Usage:
    cd packages/backend
    python scripts/index_precios_structured.py
    python scripts/index_precios_structured.py --dry-run
    python scripts/index_precios_structured.py --force
"""

import argparse
import asyncio
import os
import re
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pdfplumber
from loguru import logger

from app.database.connection import db_manager
from app.modules.chatbot.services.embedding_service import embedding_service

PDF_PATH_CANDIDATES = [
    os.path.join(os.path.dirname(__file__), '..', 'data', 'legislacion', 'Precios.pdf'),
    os.path.join(os.path.dirname(__file__), '..', '..', 'web', 'public', 'documents', 'legislacion', 'Precios.pdf'),
    '/app/data/legislacion/Precios.pdf',
]

DOC_NAME = 'Precios_Estructurado'
EMBEDDING_MODEL = 'text-embedding-005'

# Zone mapping from PDF category codes to structured names
ZONE_MAP = {
    'CAPITALES DE REGIONES': ('A1', 'Capitales de Regiones'),
    'CAPITALES DE PROVINCIAS': ('B1', 'Capitales de Provincias'),
    'CAPITALES DE DISTRITALES Y MUNICIPALES': ('C1', 'Capitales Distritales y Municipales'),
    'CAPITALES DISTRITALES Y MUNICIPALES': ('C1', 'Capitales Distritales y Municipales'),
    'CONSEJOS DE POBLADOS': ('D1', 'Consejos de Poblados'),
}

# Commerce type normalization
COMMERCE_NORMALIZE = {
    'ABACERIAS, FACTORIAS Y COMERCIO EN GENERAL': 'Abacerías, Factorías y Comercio en General',
    'FERETERIAS': 'Ferreterías',
    'FERRETERIAS': 'Ferreterías',
    'FERRETRIAS': 'Ferreterías',
    'CAFETERIAS-PASTELERIAS, PANADERIAS Y SNACK BAR': 'Cafeterías-Pastelerías, Panaderías y Snack Bar',
    'CAFETERIAS-PASTELERIAS, SNACK BAR Y PUBS NOCTURNOS': 'Cafeterías-Pastelerías, Snack Bar y Pubs Nocturnos',
    'BARES Y RESTAURANTES': 'Bares y Restaurantes',
    'DISCOTECAS Y SIMILARES': 'Discotecas y Similares',
    'DISCOTECAS': 'Discotecas y Similares',
    'CLINICAS, FARMACIAS Y SIMILARES': 'Clínicas, Farmacias y Similares',
    'CL\u00cdNICAS, FARMACIAS Y SIMILARES': 'Clínicas, Farmacias y Similares',
    'TALLERES, Y BLOQUERIAS EN GENERAL': 'Talleres y Bloquerías en General',
    'TALLERES, Y BLOQUERIAS': 'Talleres y Bloquerías en General',
    'TALLERES Y TIENDAS ARTESANALES': 'Talleres y Tiendas Artesanales',
    'VIDEO CLUBS Y SIMILARES': 'Video Clubs y Similares',
    'VIDEO CLUBS': 'Video Clubs y Similares',
    'CARPINTERIAS EN GENERAL': 'Carpinterías en General',
    'CARPINTERIAS': 'Carpinterías en General',
}


def clean_price(val: str) -> int | None:
    """Parse price string like '480.000' or '3 .000' → 480000 or 3000."""
    if not val:
        return None
    val = val.strip()
    # Remove spaces within number (e.g., '3 .000' → '3.000')
    val = re.sub(r'\s+', '', val)
    # Remove trailing dots
    val = val.rstrip('.')
    # Parse: '480.000' means 480,000 (Spanish thousand separator)
    val = val.replace('.', '')
    try:
        return int(val)
    except ValueError:
        return None


def normalize_commerce(name: str) -> str:
    """Normalize commerce type name with accents."""
    name = name.strip()
    upper = name.upper()
    return COMMERCE_NORMALIZE.get(upper, name.title())


def detect_zone(text: str) -> tuple[str, str] | None:
    """Detect zone from page text."""
    text_upper = text.upper()
    for key, (code, name) in ZONE_MAP.items():
        if key in text_upper:
            return code, name
    return None


def extract_page_tables(page) -> list[dict]:
    """Extract structured pricing data from a Precios PDF page.

    Each page has 2 commerce types side by side in a 10-column table.
    Returns list of {commerce_type, zone_code, zone_name, items, total_tesoro, total_camara}
    """
    results = []
    tables = page.extract_tables()
    if not tables:
        return results

    text = page.extract_text() or ''
    zone_info = detect_zone(text)
    if not zone_info:
        return results
    zone_code, zone_name = zone_info

    for table in tables:
        if not table or len(table) < 3:
            continue

        # Detect commerce types from first row
        first_row = table[0]
        left_commerce = None
        right_commerce = None

        if first_row and first_row[0]:
            left_commerce = normalize_commerce(first_row[0])
        # Right side starts at column 5 or 6
        for col_idx in range(5, min(10, len(first_row))):
            if first_row[col_idx] and first_row[col_idx].strip():
                right_commerce = normalize_commerce(first_row[col_idx])
                break

        if not left_commerce and not right_commerce:
            continue

        # Parse rows - left side (cols 0-3), right side (cols 5-8 or 6-9)
        left_items = []
        right_items = []
        left_total = 0
        right_total = 0

        for row in table[3:]:  # Skip header rows
            if not row or len(row) < 4:
                continue

            # Left side
            concepto_l = (row[2] or '').strip() if len(row) > 2 else ''
            precio_l = (row[3] or '').strip() if len(row) > 3 else ''

            if concepto_l and precio_l:
                price = clean_price(precio_l)
                if price is not None and price > 0:
                    if 'TOTAL' in concepto_l.upper():
                        left_total = price
                    else:
                        left_items.append((concepto_l, price))

            # Right side (offset by ~5 columns)
            right_offset = 5 if len(row) > 8 else 4
            concepto_r = (row[right_offset + 2] or '').strip() if len(row) > right_offset + 2 else ''
            precio_r = (row[right_offset + 3] or '').strip() if len(row) > right_offset + 3 else ''

            if concepto_r and precio_r:
                price = clean_price(precio_r)
                if price is not None and price > 0:
                    if 'TOTAL' in concepto_r.upper():
                        right_total = price
                    else:
                        right_items.append((concepto_r, price))

        if left_commerce and left_items:
            results.append({
                'commerce_type': left_commerce,
                'zone_code': zone_code,
                'zone_name': zone_name,
                'items': left_items,
                'total': left_total or sum(p for _, p in left_items),
            })

        if right_commerce and right_items:
            results.append({
                'commerce_type': right_commerce,
                'zone_code': zone_code,
                'zone_name': zone_name,
                'items': right_items,
                'total': right_total or sum(p for _, p in right_items),
            })

    return results


def extract_summary_page(page) -> list[dict]:
    """Extract from summary page (Ayuntamientos de Malabo y Bata)."""
    results = []
    tables = page.extract_tables()
    if not tables:
        return results

    for table in tables:
        if not table or len(table) < 2:
            continue
        # Header: [CATEGORIA, ACTIVIDAD, CUOTA]
        current_activity = None
        items = []
        for row in table[1:]:
            if not row or len(row) < 3:
                continue
            cat = (row[0] or '').strip()
            activity = (row[1] or '').strip()
            cuota = (row[2] or '').strip()

            if activity:
                if current_activity and items:
                    results.append({
                        'commerce_type': normalize_commerce(current_activity),
                        'zone_code': 'MALABO_BATA',
                        'zone_name': 'Ayuntamientos de Malabo y Bata',
                        'items': items,
                        'total': sum(p for _, p in items),
                    })
                current_activity = activity
                items = []

            price = clean_price(cuota)
            if price and cat:
                items.append((f"Categoría {cat}", price))

        # Last group
        if current_activity and items:
            results.append({
                'commerce_type': normalize_commerce(current_activity),
                'zone_code': 'MALABO_BATA',
                'zone_name': 'Ayuntamientos de Malabo y Bata',
                'items': items,
                'total': sum(p for _, p in items),
            })

    return results


def format_chunk(data: dict) -> str:
    """Format structured data into a human-readable RAG chunk."""
    lines = [
        f"PRECIOS OFICIALES - {data['commerce_type']} en {data['zone_name']} (Zona {data['zone_code']})",
        "",
        f"Tipo de comercio: {data['commerce_type']}",
        f"Zona geográfica: {data['zone_name']} ({data['zone_code']})",
        "",
        "Desglose de tasas:",
    ]

    for concepto, precio in data['items']:
        lines.append(f"  - {concepto}: {precio:,} XAF".replace(',', '.'))

    lines.append("")
    lines.append(f"TOTAL: {data['total']:,} XAF".replace(',', '.'))
    lines.append("")
    lines.append(
        f"Nota: Estos precios son oficiales según el documento de Precios de la "
        f"República de Guinea Ecuatorial. Para iniciar el trámite de apertura de "
        f"un establecimiento de tipo '{data['commerce_type']}' en la zona "
        f"'{data['zone_name']}', puede usar la plataforma Facil que ofrece un "
        f"proceso automatizado, seguro y con asistencia IA."
    )

    return '\n'.join(lines)


async def main():
    parser = argparse.ArgumentParser(description='Index Precios.pdf with structured table extraction')
    parser.add_argument('--force', action='store_true', help='Re-index all chunks')
    parser.add_argument('--dry-run', action='store_true', help='Parse only, no DB writes')
    args = parser.parse_args()

    # Find PDF
    pdf_path = None
    for candidate in PDF_PATH_CANDIDATES:
        if os.path.exists(candidate):
            pdf_path = candidate
            break

    if not pdf_path:
        logger.error("Precios.pdf not found in any candidate path")
        sys.exit(1)

    logger.info(f"Processing: {pdf_path}")

    # Extract structured data from all pages
    all_data = []
    with pdfplumber.open(pdf_path) as pdf:
        logger.info(f"  {len(pdf.pages)} pages")

        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ''

            # Pages 20-21: summary tables
            if 'AYUNTAMIENTOS' in text.upper():
                data = extract_summary_page(page)
            else:
                data = extract_page_tables(page)

            if data:
                logger.info(f"  Page {page_num}: {len(data)} commerce-zone pairs extracted")
                for d in data:
                    d['page_number'] = page_num
                    all_data.append(d)
            else:
                logger.warning(f"  Page {page_num}: no structured data extracted")

    logger.info(f"\nTotal structured chunks: {len(all_data)}")
    for d in all_data:
        logger.info(f"  {d['commerce_type']} @ {d['zone_name']} ({d['zone_code']}): {d['total']:,} XAF ({len(d['items'])} items)")

    if args.dry_run:
        logger.info("\n[DRY RUN] Sample chunk:")
        if all_data:
            print(format_chunk(all_data[0]))
        return

    if not all_data:
        logger.warning("No data extracted, nothing to index")
        return

    # Index to DB
    await db_manager.initialize()
    start_time = time.time()
    stats = {'inserted': 0, 'updated': 0, 'skipped': 0, 'failed': 0}

    async with db_manager.get_connection() as conn:
        # Get existing chunks
        existing = set()
        if not args.force:
            rows = await conn.fetch(
                "SELECT chunk_id FROM legislacion_documents WHERE document_name = $1",
                DOC_NAME,
            )
            existing = {r['chunk_id'] for r in rows}

        for i, data in enumerate(all_data):
            chunk_text = format_chunk(data)
            chunk_id = f"precios_{data['zone_code'].lower()}_{data['commerce_type'][:20].lower().replace(' ', '_')}_{i}"

            if chunk_id in existing and not args.force:
                stats['skipped'] += 1
                continue

            emb = await embedding_service.generate_embedding(
                chunk_text,
                task_type='RETRIEVAL_DOCUMENT',
                title=f"Precios - {data['commerce_type']} - {data['zone_name']}",
            )
            if not emb:
                stats['failed'] += 1
                continue

            emb_str = '[' + ','.join(str(x) for x in emb) + ']'
            is_update = chunk_id in existing

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
                DOC_NAME,
                data['page_number'],
                chunk_id,
                chunk_text,
                emb_str,
                EMBEDDING_MODEL,
            )

            if is_update:
                stats['updated'] += 1
            else:
                stats['inserted'] += 1

            logger.info(f"  [{i+1}/{len(all_data)}] {chunk_id}: {'updated' if is_update else 'indexed'}")

    await db_manager.close()
    elapsed = time.time() - start_time
    logger.info(
        f"\nDone in {elapsed:.1f}s: +{stats['inserted']} inserted, "
        f"~{stats['updated']} updated, ={stats['skipped']} skipped, "
        f"x{stats['failed']} failed"
    )


if __name__ == '__main__':
    asyncio.run(main())
