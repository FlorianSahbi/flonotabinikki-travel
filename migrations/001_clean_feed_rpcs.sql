-- ============================================================
-- FEED SYSTEM - Complete Database Schema
-- ============================================================
--
-- Architecture: TikTok-style vertical video feed
--
--   [Standalone Video] ← videos WHERE cluster_id IS NULL
--   [Cluster Card]     ← clusters + cluster_heads (timeline position)
--   [Standalone Video]
--   [Cluster Card]
--   ...
--
-- Tables:
--   videos         → Individual videos (lat, lng, recorded_at_local, cluster_id)
--   clusters       → Group metadata (name, description, cover_url)
--   cluster_heads  → Timeline position for clusters (cluster_id → sort_at)
--
-- Views:
--   map_points_simple   → All points for map display
--   cluster_first_video → First video coords per cluster
--
-- ============================================================


-- ============================================================
-- 1. CLEANUP
-- ============================================================

DROP FUNCTION IF EXISTS feed_get_context_items(uuid, integer);
DROP FUNCTION IF EXISTS feed_get_items_after(timestamp with time zone, integer, uuid);
DROP FUNCTION IF EXISTS feed_get_items_before(timestamp with time zone, integer, uuid);
DROP FUNCTION IF EXISTS feed__cluster_items_after(integer, timestamp with time zone, uuid);
DROP FUNCTION IF EXISTS feed__cluster_items_before(integer, timestamp with time zone, uuid);
DROP FUNCTION IF EXISTS feed__standalone_videos_after(integer, timestamp with time zone);
DROP FUNCTION IF EXISTS feed__standalone_videos_before(integer, timestamp with time zone);
DROP FUNCTION IF EXISTS get_random_map_points(integer);
DROP FUNCTION IF EXISTS get_random_videos();
DROP TYPE IF EXISTS feed_item_row CASCADE;


-- ============================================================
-- 2. SHARED RETURN TYPE
-- ============================================================

CREATE TYPE feed_item_row AS (
  id          text,
  kind        text,             -- 'video' | 'cluster'
  lat         double precision,
  lng         double precision,
  recorded_at text,             -- ISO timestamp for sorting
  main_url    text,
  poster_url  text,
  title       text,
  description text,
  preview     text,
  position    integer
);


-- ============================================================
-- 3. feed_get_items_after
-- ============================================================
-- Infinite scroll DOWN (older items)
-- Called from: src/features/feed/api.ts → feedGetItemsAfter()

CREATE FUNCTION feed_get_items_after(
  ref_time timestamp with time zone,
  lim integer DEFAULT 5,
  skip_cluster_id uuid DEFAULT NULL
)
RETURNS SETOF feed_item_row
LANGUAGE sql STABLE AS $$
  WITH unified AS (
    -- Standalone videos
    SELECT
      v.id::text, 'video'::text AS kind, v.lat, v.lng,
      v.recorded_at_local::text AS recorded_at,
      COALESCE(v.main_url, ''), COALESCE(v.poster_url, ''),
      COALESCE(v.title, ''), COALESCE(v.description, ''),
      COALESCE(v.preview_url, '')
    FROM videos v
    WHERE v.cluster_id IS NULL
      AND v.lat IS NOT NULL AND v.lng IS NOT NULL
      AND v.recorded_at_local < ref_time

    UNION ALL

    -- Clusters
    SELECT
      c.id::text, 'cluster'::text, cfv.lat, cfv.lng,
      ch.sort_at::text,
      COALESCE(c.cover_url, ''), COALESCE(c.cover_url, ''),
      c.name, COALESCE(c.description, ''), COALESCE(c.preview, '')
    FROM clusters c
    JOIN cluster_heads ch ON ch.cluster_id = c.id
    JOIN cluster_first_video cfv ON cfv.cluster_id = c.id
    WHERE ch.sort_at < ref_time
      AND (skip_cluster_id IS NULL OR c.id != skip_cluster_id)
      AND cfv.lat IS NOT NULL AND cfv.lng IS NOT NULL
  )
  SELECT *, ROW_NUMBER() OVER (ORDER BY recorded_at DESC)::integer
  FROM unified ORDER BY recorded_at DESC LIMIT lim;
$$;


-- ============================================================
-- 4. feed_get_items_before
-- ============================================================
-- Infinite scroll UP (newer items)
-- Called from: src/features/feed/api.ts → feedGetItemsBefore()

CREATE FUNCTION feed_get_items_before(
  ref_time timestamp with time zone,
  lim integer DEFAULT 5,
  skip_cluster_id uuid DEFAULT NULL
)
RETURNS SETOF feed_item_row
LANGUAGE sql STABLE AS $$
  WITH unified AS (
    SELECT
      v.id::text, 'video'::text AS kind, v.lat, v.lng,
      v.recorded_at_local::text AS recorded_at,
      COALESCE(v.main_url, ''), COALESCE(v.poster_url, ''),
      COALESCE(v.title, ''), COALESCE(v.description, ''),
      COALESCE(v.preview_url, '')
    FROM videos v
    WHERE v.cluster_id IS NULL
      AND v.lat IS NOT NULL AND v.lng IS NOT NULL
      AND v.recorded_at_local > ref_time

    UNION ALL

    SELECT
      c.id::text, 'cluster'::text, cfv.lat, cfv.lng,
      ch.sort_at::text,
      COALESCE(c.cover_url, ''), COALESCE(c.cover_url, ''),
      c.name, COALESCE(c.description, ''), COALESCE(c.preview, '')
    FROM clusters c
    JOIN cluster_heads ch ON ch.cluster_id = c.id
    JOIN cluster_first_video cfv ON cfv.cluster_id = c.id
    WHERE ch.sort_at > ref_time
      AND (skip_cluster_id IS NULL OR c.id != skip_cluster_id)
      AND cfv.lat IS NOT NULL AND cfv.lng IS NOT NULL
  )
  SELECT *, ROW_NUMBER() OVER (ORDER BY recorded_at ASC)::integer
  FROM unified ORDER BY recorded_at ASC LIMIT lim;
$$;


-- ============================================================
-- 5. feed_get_context_items
-- ============================================================
-- Initial load: items around a target video/cluster
-- Called from: src/app/[lang]/explore/[[...id]]/page.tsx
--              src/features/explore/useExploreStore.ts

CREATE FUNCTION feed_get_context_items(
  target_id uuid,
  range_size integer DEFAULT 5
)
RETURNS SETOF feed_item_row
LANGUAGE plpgsql STABLE AS $$
DECLARE
  target_time timestamptz;
BEGIN
  -- Find target timestamp (video or cluster)
  SELECT recorded_at_local INTO target_time FROM videos WHERE id = target_id;
  IF target_time IS NULL THEN
    SELECT sort_at INTO target_time FROM cluster_heads WHERE cluster_id = target_id;
  END IF;
  IF target_time IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH unified AS (
    SELECT
      v.id::text, 'video'::text AS kind, v.lat, v.lng,
      v.recorded_at_local::text AS recorded_at,
      COALESCE(v.main_url, ''), COALESCE(v.poster_url, ''),
      COALESCE(v.title, ''), COALESCE(v.description, ''),
      COALESCE(v.preview_url, '')
    FROM videos v
    WHERE v.cluster_id IS NULL
      AND v.lat IS NOT NULL AND v.lng IS NOT NULL

    UNION ALL

    SELECT
      c.id::text, 'cluster'::text, cfv.lat, cfv.lng,
      ch.sort_at::text,
      COALESCE(c.cover_url, ''), COALESCE(c.cover_url, ''),
      c.name, COALESCE(c.description, ''), COALESCE(c.preview, '')
    FROM clusters c
    JOIN cluster_heads ch ON ch.cluster_id = c.id
    JOIN cluster_first_video cfv ON cfv.cluster_id = c.id
    WHERE cfv.lat IS NOT NULL AND cfv.lng IS NOT NULL
  ),
  before AS (
    SELECT * FROM unified WHERE recorded_at > target_time::text
    ORDER BY recorded_at ASC LIMIT range_size
  ),
  after AS (
    SELECT * FROM unified WHERE recorded_at <= target_time::text
    ORDER BY recorded_at DESC LIMIT range_size + 1
  )
  SELECT *, ROW_NUMBER() OVER (ORDER BY recorded_at DESC)::integer
  FROM (SELECT * FROM before UNION ALL SELECT * FROM after) combined
  ORDER BY recorded_at DESC;
END;
$$;


-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_videos_feed
  ON videos (recorded_at_local DESC)
  WHERE cluster_id IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_videos_cluster
  ON videos (cluster_id, recorded_at_local ASC)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cluster_heads_sort
  ON cluster_heads (sort_at DESC);


-- ============================================================
-- 7. VIEWS
-- ============================================================

DROP VIEW IF EXISTS map_points_simple;
DROP VIEW IF EXISTS cluster_first_video;

CREATE VIEW cluster_first_video AS
SELECT DISTINCT ON (cluster_id)
  cluster_id, id AS video_id, lat, lng, recorded_at_local AS recorded_at
FROM videos
WHERE cluster_id IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL
ORDER BY cluster_id, recorded_at_local ASC;

CREATE VIEW map_points_simple AS
SELECT id::text, 'video'::text AS kind, lat, lng
FROM videos
WHERE cluster_id IS NULL AND lat IS NOT NULL AND lng IS NOT NULL
UNION ALL
SELECT c.id::text, 'cluster'::text, cfv.lat, cfv.lng
FROM clusters c
JOIN cluster_first_video cfv ON cfv.cluster_id = c.id
WHERE cfv.lat IS NOT NULL AND cfv.lng IS NOT NULL;
