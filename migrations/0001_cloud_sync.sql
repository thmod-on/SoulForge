PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX sessions_user_id ON sessions(user_id);
CREATE INDEX sessions_expires_at ON sessions(expires_at);

CREATE TABLE characters (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload_json TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, resource_id)
);

CREATE TABLE definitions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload_json TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, resource_id)
);

CREATE TABLE definition_overrides (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload_json TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (user_id, resource_id)
);

CREATE TABLE sync_changes (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('character', 'definition', 'override')),
  resource_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload_json TEXT,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX sync_changes_user_seq ON sync_changes(user_id, seq);

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, checksum)
);
CREATE INDEX media_assets_user_id ON media_assets(user_id);

CREATE TABLE media_references (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('character', 'definition', 'override')),
  resource_id TEXT NOT NULL,
  media_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, resource_type, resource_id, media_id)
);
CREATE INDEX media_references_media_id ON media_references(media_id);
