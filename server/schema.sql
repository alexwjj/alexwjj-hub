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
CREATE TABLE IF NOT EXISTS hub_discover (
  id UUID PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', pinned BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hub_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL);
INSERT INTO hub_discover(id,name,url,category,description,pinned)
SELECT x.id::uuid,x.name,x.url,x.category,x.description,true FROM (VALUES
('ad48ba93-d651-44b8-8ab5-4b022474aa01','Codex Radar','https://codexradar.com/','评测与动态','追踪 GPT / Codex 的评测与版本变化，看看模型在真实任务中的表现。'),
('ad48ba93-d651-44b8-8ab5-4b022474aa02','AIHOT','https://aihot.virxact.com/','AI 资讯','快速浏览 AI 新闻与热门话题，把值得继续了解的动态留在视野里。')
) AS x(id,name,url,category,description)
WHERE NOT EXISTS (SELECT 1 FROM hub_settings WHERE key='discover_initialized')
ON CONFLICT DO NOTHING;
INSERT INTO hub_settings(key,value) VALUES('discover_initialized','true'::jsonb) ON CONFLICT DO NOTHING;
