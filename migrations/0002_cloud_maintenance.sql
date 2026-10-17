PRAGMA foreign_keys = ON;

ALTER TABLE media_assets ADD COLUMN unreferenced_at TEXT;
ALTER TABLE characters ADD COLUMN last_mutation_id TEXT;
ALTER TABLE definitions ADD COLUMN last_mutation_id TEXT;
ALTER TABLE definition_overrides ADD COLUMN last_mutation_id TEXT;

UPDATE media_assets
SET unreferenced_at = created_at
WHERE NOT EXISTS (
  SELECT 1
  FROM media_references
  WHERE media_references.media_id = media_assets.id
);

CREATE INDEX media_assets_unreferenced_at ON media_assets(unreferenced_at);

CREATE TABLE media_cleanup_queue (
  media_id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  queued_at TEXT NOT NULL
);

CREATE INDEX media_cleanup_queue_queued_at ON media_cleanup_queue(queued_at);
