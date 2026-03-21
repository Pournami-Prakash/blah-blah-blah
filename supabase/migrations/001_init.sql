-- ─────────────────────────────────────────────────────────────────────────────
-- blah blah blah — Supabase schema
-- Run this in the Supabase SQL editor (supabase.com → your project → SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── posts ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text        NOT NULL
                           CHECK (type IN ('letter','polaroid','typewriter','cafe','journal','activity')),
  likes_count  integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- location (nullable — not all posts need it)
  city         text,
  country      text,
  lat          double precision,
  lng          double precision,

  -- shared text fields
  content      text,
  title        text,
  attribution  text,

  -- cafe / activity
  name         text,
  description  text,
  tags         text[],

  -- polaroid
  image_url    text,
  caption      text
);

-- Full-text search index on content
CREATE INDEX IF NOT EXISTS posts_content_fts
  ON posts USING gin(to_tsvector('english', coalesce(content, '') || ' ' || coalesce(caption, '')));

-- Index for city-based filtering
CREATE INDEX IF NOT EXISTS posts_city_idx ON posts (city);
CREATE INDEX IF NOT EXISTS posts_type_idx ON posts (type);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts (created_at DESC);

-- ── journal_entries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content    text        NOT NULL,
  city       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_created_idx ON journal_entries (created_at DESC);

-- ── post_likes ────────────────────────────────────────────────────────────────
-- Anonymous likes — keyed by (post_id, session_id).
-- session_id is a random UUID stored in the visitor's localStorage.
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    uuid  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  session_id text  NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, session_id)
);

-- ── pins view ─────────────────────────────────────────────────────────────────
-- Aggregates posts into city pins for the globe.
CREATE OR REPLACE VIEW pins AS
  SELECT
    city,
    country,
    lat,
    lng,
    count(*)::integer AS count
  FROM posts
  WHERE city IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL
  GROUP BY city, country, lat, lng;

-- ── increment_likes RPC ───────────────────────────────────────────────────────
-- Called after inserting into post_likes. Keeps likes_count in sync atomically.
CREATE OR REPLACE FUNCTION increment_likes(p_post_id uuid, p_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the like record (will fail silently if already liked — PK constraint)
  INSERT INTO post_likes (post_id, session_id)
  VALUES (p_post_id, p_session_id)
  ON CONFLICT DO NOTHING;

  -- Only bump count if the row was actually inserted
  IF FOUND THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
  END IF;
END;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes     ENABLE ROW LEVEL SECURITY;

-- posts: public read, public insert, no update/delete
CREATE POLICY "posts_read"   ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (true);

-- journal: public read, public insert
CREATE POLICY "journal_read"   ON journal_entries FOR SELECT USING (true);
CREATE POLICY "journal_insert" ON journal_entries FOR INSERT WITH CHECK (true);

-- post_likes: public read + insert (the RPC handles atomicity)
CREATE POLICY "likes_read"   ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT WITH CHECK (true);

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Create this in the Supabase dashboard → Storage → New bucket:
--   Name: post-images
--   Public: YES
--
-- Or run via the Supabase JS management API / CLI.
-- The bucket policy allows any authenticated or anonymous user to upload.
