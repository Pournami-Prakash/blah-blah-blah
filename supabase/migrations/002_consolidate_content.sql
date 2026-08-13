-- Consolidate the journal into posts without deleting historical data.
INSERT INTO posts (id, type, content, city, created_at)
SELECT id, 'journal', content, city, created_at
FROM journal_entries
ON CONFLICT (id) DO NOTHING;

-- Anonymous safety reports. One report per browser session and post.
CREATE TABLE IF NOT EXISTS post_reports (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harmful', 'private-info', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, session_id)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert" ON post_reports;
CREATE POLICY "reports_insert" ON post_reports FOR INSERT WITH CHECK (true);

-- Reports intentionally have no public SELECT policy.
