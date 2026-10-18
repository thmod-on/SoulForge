PRAGMA foreign_keys = ON;

CREATE TABLE sync_devices (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  acknowledged_seq INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_ack_at TEXT NOT NULL,
  PRIMARY KEY (user_id, device_id)
);

CREATE INDEX sync_devices_last_ack_at ON sync_devices(last_ack_at);

CREATE TABLE sync_retention_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  compacted_through_seq INTEGER NOT NULL DEFAULT 0,
  last_compacted_at TEXT
);

CREATE TABLE sync_snapshot_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  baseline_seq INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX sync_snapshot_sessions_expires_at ON sync_snapshot_sessions(expires_at);
