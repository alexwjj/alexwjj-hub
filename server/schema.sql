CREATE TABLE IF NOT EXISTS hub_projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, repo TEXT,
  visibility TEXT NOT NULL DEFAULT 'public', origins JSONB NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS hub_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL, login TEXT NOT NULL, name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hub_events (
  id UUID PRIMARY KEY, project_id TEXT NOT NULL REFERENCES hub_projects(id),
  type TEXT NOT NULL, name TEXT NOT NULL, path TEXT NOT NULL,
  visitor TEXT NOT NULL, session_id TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT '', device TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hub_events_project_date ON hub_events(project_id, created_at);
CREATE TABLE IF NOT EXISTS hub_limits (
  key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
