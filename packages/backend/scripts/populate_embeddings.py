#!/usr/bin/env python3
"""
Populate Embeddings Script - Generate embeddings for fiscal services

This script generates and stores embeddings for all fiscal services
in the database using Gemini text-embedding-004 model.

Usage:
    python scripts/populate_embeddings.py [OPTIONS]

Options:
    --batch-size N      Batch size for embedding generation (default: 250)
    --force            Regenerate embeddings even if they exist
    --service-id ID    Only process specific service ID
    --limit N          Limit number of services to process (for testing)
    --dry-run          Preview without making changes

Examples:
    # Generate embeddings for all services
    python scripts/populate_embeddings.py

    # Test with first 10 services
    python scripts/populate_embeddings.py --limit 10

    # Force regeneration
    python scripts/populate_embeddings.py --force

    # Dry run to preview
    python scripts/populate_embeddings.py --dry-run --limit 5

Author: Claude Code
Date: 2025-01-22
"""

import asyncio
import argparse
from datetime import datetime
from typing import List, Dict, Any
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncpg
from loguru import logger

from app.config import settings
from app.modules.chatbot.services.embedding_service import embedding_service


# ============================================================================
# DATABASE QUERIES
# ============================================================================

async def get_services_needing_embeddings(
    conn: asyncpg.Connection,
    force: bool = False,
    service_id: int = None,
    limit: int = None
) -> List[Dict[str, Any]]:
    """
    Get fiscal services that need embedding generation

    Args:
        conn: Database connection
        force: Force regeneration even if embeddings exist
        service_id: Only get specific service
        limit: Limit number of services

    Returns:
        List of services with full context
    """
    # Build WHERE clause
    where_conditions = ["fs.status = 'active'"]

    if not force:
        where_conditions.append(
            "(fs.embedding IS NULL OR fs.needs_embedding_update = TRUE)"
        )

    if service_id:
        where_conditions.append(f"fs.id = {service_id}")

    where_clause = " AND ".join(where_conditions)

    # Query with full context
    query = f"""
        SELECT
            fs.id,
            fs.service_code,
            fs.name_es,
            fs.description_es,
            c.name_es as category_name,
            s.name_es as sector_name,
            m.name_es as ministry_name,

            -- Aggregate keywords
            ARRAY_AGG(
                DISTINCT jsonb_build_object(
                    'keyword', sk.keyword,
                    'weight', sk.weight,
                    'language_code', sk.language_code
                ) ORDER BY jsonb_build_object(
                    'keyword', sk.keyword,
                    'weight', sk.weight,
                    'language_code', sk.language_code
                )
            ) FILTER (WHERE sk.id IS NOT NULL) as keywords

        FROM fiscal_services fs
        LEFT JOIN categories c ON fs.category_id = c.id
        LEFT JOIN sectors s ON c.sector_id = s.id
        LEFT JOIN ministries m ON c.ministry_id = m.id
        LEFT JOIN service_keywords sk ON fs.id = sk.fiscal_service_id

        WHERE {where_clause}

        GROUP BY
            fs.id, fs.service_code, fs.name_es, fs.description_es,
            c.name_es, s.name_es, m.name_es

        ORDER BY fs.id
        {"LIMIT " + str(limit) if limit else ""}
    """

    results = await conn.fetch(query)
    return [dict(row) for row in results]


async def update_service_embedding(
    conn: asyncpg.Connection,
    service_id: int,
    embedding: List[float],
    dry_run: bool = False
) -> bool:
    """
    Update service embedding in database

    Args:
        conn: Database connection
        service_id: Service ID
        embedding: Embedding vector (768 dimensions)
        dry_run: If True, don't actually update

    Returns:
        True if successful
    """
    if dry_run:
        logger.info(f"[DRY RUN] Would update embedding for service_id={service_id}")
        return True

    query = """
        UPDATE fiscal_services
        SET
            embedding = $1::vector,
            embedding_generated_at = NOW(),
            embedding_model = $2,
            embedding_version = COALESCE(embedding_version, 0) + 1,
            needs_embedding_update = FALSE
        WHERE id = $3
        RETURNING id
    """

    try:
        result = await conn.fetchrow(
            query,
            embedding,
            settings.GEMINI_EMBEDDING_MODEL,
            service_id
        )

        if result:
            logger.debug(f"Updated embedding for service_id={service_id}")
            return True
        else:
            logger.error(f"Failed to update service_id={service_id} (not found)")
            return False

    except Exception as e:
        logger.error(f"Error updating service_id={service_id}: {e}")
        return False


async def get_embedding_stats(conn: asyncpg.Connection) -> Dict[str, Any]:
    """Get current embedding coverage statistics"""
    query = "SELECT * FROM v_embedding_status"

    try:
        result = await conn.fetchrow(query)
        return dict(result) if result else {}
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        return {}


# ============================================================================
# MAIN PROCESSING LOGIC
# ============================================================================

async def process_services(
    services: List[Dict[str, Any]],
    conn: asyncpg.Connection,
    batch_size: int = 250,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Process services and generate embeddings

    Args:
        services: List of services to process
        conn: Database connection
        batch_size: Batch size for API calls
        dry_run: Preview mode

    Returns:
        Processing statistics
    """
    if not services:
        logger.warning("No services to process")
        return {"processed": 0, "success": 0, "failed": 0}

    total = len(services)
    logger.info(f"Processing {total} services in batches of {batch_size}")

    # Prepare texts for embedding
    texts = []
    service_ids = []

    for service in services:
        text = embedding_service.prepare_service_text(service)
        texts.append(text)
        service_ids.append(service['id'])

        if dry_run:
            logger.info(f"[DRY RUN] Service {service['service_code']}:")
            logger.info(f"  Text: {text[:200]}...")

    if dry_run:
        logger.info(f"[DRY RUN] Would generate {len(texts)} embeddings")
        return {
            "processed": len(texts),
            "success": len(texts),
            "failed": 0,
            "dry_run": True
        }

    # Generate embeddings in batches
    logger.info("Generating embeddings with Gemini...")
    embeddings = await embedding_service.batch_generate_embeddings(
        texts=texts,
        batch_size=batch_size,
        show_progress=True
    )

    # Update database
    logger.info("Updating database...")
    success_count = 0
    failed_count = 0

    for service_id, embedding in zip(service_ids, embeddings):
        if embedding:
            success = await update_service_embedding(conn, service_id, embedding)
            if success:
                success_count += 1
            else:
                failed_count += 1
        else:
            logger.warning(f"No embedding generated for service_id={service_id}")
            failed_count += 1

    return {
        "processed": total,
        "success": success_count,
        "failed": failed_count
    }


async def main(args: argparse.Namespace):
    """Main execution function"""

    logger.info("=" * 70)
    logger.info("EMBEDDING POPULATION SCRIPT")
    logger.info("=" * 70)
    logger.info(f"Database: {settings.DATABASE_URL[:50]}...")
    logger.info(f"Model: {settings.GEMINI_EMBEDDING_MODEL}")
    logger.info(f"Batch size: {args.batch_size}")
    logger.info(f"Force regeneration: {args.force}")
    logger.info(f"Dry run: {args.dry_run}")
    if args.limit:
        logger.info(f"Limit: {args.limit}")
    if args.service_id:
        logger.info(f"Service ID: {args.service_id}")
    logger.info("=" * 70)

    # Check embedding service
    if not embedding_service.enabled:
        logger.error("❌ Embedding service is not enabled!")
        logger.error("Please check:")
        logger.error("  1. Vertex AI SDK installed: pip install google-cloud-aiplatform")
        logger.error("  2. Google Cloud credentials configured")
        logger.error("  3. Vertex AI API enabled in GCP project")
        return 1

    logger.info(f"✅ Embedding service ready: {embedding_service.get_stats()}")

    # Connect to database
    logger.info("Connecting to database...")
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        logger.info("✅ Database connected")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return 1

    try:
        # Get initial stats
        logger.info("\nInitial embedding coverage:")
        stats_before = await get_embedding_stats(conn)
        logger.info(f"  Total services: {stats_before.get('total_services', 0)}")
        logger.info(f"  With embeddings: {stats_before.get('total_with_embeddings', 0)}")
        logger.info(f"  Needs update: {stats_before.get('total_needs_update', 0)}")
        logger.info(f"  Coverage: {stats_before.get('coverage_percentage', 0)}%")

        # Get services needing embeddings
        logger.info("\nFetching services...")
        services = await get_services_needing_embeddings(
            conn,
            force=args.force,
            service_id=args.service_id,
            limit=args.limit
        )

        if not services:
            logger.info("✅ No services need embedding generation!")
            return 0

        logger.info(f"Found {len(services)} services to process")

        # Preview first few
        logger.info("\nPreview of services to process:")
        for service in services[:5]:
            logger.info(f"  - {service['service_code']}: {service['name_es']}")

        if len(services) > 5:
            logger.info(f"  ... and {len(services) - 5} more")

        # Confirm if not dry run and processing many
        if not args.dry_run and len(services) > 50 and not args.force:
            logger.warning(f"\n⚠️  About to process {len(services)} services")
            logger.warning(f"   Estimated cost: ~${len(services) * 0.000025:.4f} USD")
            response = input("Continue? (yes/no): ")
            if response.lower() != "yes":
                logger.info("Cancelled by user")
                return 0

        # Process services
        logger.info("\n" + "=" * 70)
        logger.info("PROCESSING EMBEDDINGS")
        logger.info("=" * 70)

        start_time = datetime.now()

        result = await process_services(
            services,
            conn,
            batch_size=args.batch_size,
            dry_run=args.dry_run
        )

        elapsed = (datetime.now() - start_time).total_seconds()

        # Final stats
        logger.info("\n" + "=" * 70)
        logger.info("RESULTS")
        logger.info("=" * 70)
        logger.info(f"Processed: {result['processed']}")
        logger.info(f"Success: {result['success']}")
        logger.info(f"Failed: {result['failed']}")
        logger.info(f"Time: {elapsed:.2f}s")
        logger.info(f"Avg: {elapsed / max(result['processed'], 1):.2f}s per service")

        if not args.dry_run:
            logger.info("\nFinal embedding coverage:")
            stats_after = await get_embedding_stats(conn)
            logger.info(f"  Total services: {stats_after.get('total_services', 0)}")
            logger.info(f"  With embeddings: {stats_after.get('total_with_embeddings', 0)}")
            logger.info(f"  Coverage: {stats_after.get('coverage_percentage', 0)}%")

        logger.info("=" * 70)
        logger.info("✅ COMPLETED")
        logger.info("=" * 70)

        return 0

    finally:
        await conn.close()
        logger.info("Database connection closed")


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate embeddings for fiscal services",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=250,
        help="Batch size for embedding generation (default: 250, max: 250)"
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate embeddings even if they exist"
    )

    parser.add_argument(
        "--service-id",
        type=int,
        help="Only process specific service ID"
    )

    parser.add_argument(
        "--limit",
        type=int,
        help="Limit number of services to process (for testing)"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview without making changes"
    )

    args = parser.parse_args()

    # Run async main
    exit_code = asyncio.run(main(args))
    sys.exit(exit_code)
