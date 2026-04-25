-- Phase 1 Document Intelligence: Partial unique index for deduplication
-- Prevents race condition where two concurrent uploads of the same file
-- both pass the find_duplicate() check before either inserts.
--
-- Only active, non-deleted documents are considered (archived/expired can be re-uploaded).
-- 2026-04-25

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_user_documents_dedup
ON user_documents (user_id, file_hash)
WHERE status = 'active' AND deleted_at IS NULL;
