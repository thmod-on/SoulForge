PRAGMA foreign_keys = ON;

CREATE TABLE authorized_emails (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
