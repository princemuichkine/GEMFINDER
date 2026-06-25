-- 04_archive_growth.sql
--
-- Phase 1: make the "runs data" intelligent.
--
-- Before this migration, growth (stars_growth / forks_growth) was computed from
-- `metrics_history`, which the collector WIPES on every run (see ArchiveAndClear).
-- That meant growth was almost always 0 and the period filter was a no-op.
--
-- `repositories_archive` already accumulates a full snapshot of every repo on every
-- run (keyed by the stable github_id), but nothing ever read it. This migration
-- turns that archive into a real time-series:
--   * real growth over the selected period (current vs closest snapshot N days ago)
--   * acceleration (is the star-rate speeding up vs the previous period?)
--   * durability (how many distinct runs has this repo shown up in?)
--   * first_seen_at (when we first discovered it)
-- and adds a per-repo history RPC for sparklines.

-- Index to make github_id-based, time-bucketed lookups against the archive fast.
CREATE INDEX IF NOT EXISTS idx_repositories_archive_github_archived
    ON repositories_archive (github_id, archived_at);

-- The return signature changes, so the old function must be dropped first
-- (CREATE OR REPLACE cannot change OUT columns).
DROP FUNCTION IF EXISTS get_repo_stats(INT, TEXT, INT, INT, FLOAT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_repo_stats(
    p_period_days INT DEFAULT 30,
    p_language TEXT DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 50,
    p_min_score FLOAT DEFAULT 0,
    p_sort_by TEXT DEFAULT 'score',
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    repo_id BIGINT,
    github_id BIGINT,
    owner TEXT,
    name TEXT,
    description TEXT,
    language TEXT,
    stars INT,
    forks INT,
    issues INT,
    score FLOAT,
    created_at TIMESTAMPTZ,
    stars_growth INT,
    forks_growth INT,
    owner_followers INT,
    owner_repo_count INT,
    velocity_badge TEXT,
    -- Phase 1 additions (derived from repositories_archive time-series)
    prev_stars_growth INT,   -- star growth in the period BEFORE this one
    acceleration INT,        -- recent growth minus previous growth (momentum trend)
    times_seen INT,          -- distinct runs this repo has appeared in (durability)
    first_seen_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    q TEXT := NULLIF(TRIM(COALESCE(p_search, '')), '');
BEGIN
    RETURN QUERY
    WITH
    -- Closest archived snapshot to "p_period_days ago" (the start of the window).
    old_metrics AS (
        SELECT
            a.github_id,
            a.stars AS old_stars,
            a.forks AS old_forks,
            ROW_NUMBER() OVER (
                PARTITION BY a.github_id
                ORDER BY ABS(EXTRACT(EPOCH FROM (a.archived_at - (NOW() - (p_period_days || ' days')::INTERVAL))))
            ) AS rn
        FROM repositories_archive a
        -- look back a little further than the window to find the closest point
        WHERE a.archived_at >= NOW() - ((p_period_days + 14) || ' days')::INTERVAL
    ),
    -- Closest archived snapshot to "2 * p_period_days ago" (start of the PREVIOUS window),
    -- used to measure whether growth is accelerating.
    prev_metrics AS (
        SELECT
            a.github_id,
            a.stars AS prev_stars,
            ROW_NUMBER() OVER (
                PARTITION BY a.github_id
                ORDER BY ABS(EXTRACT(EPOCH FROM (a.archived_at - (NOW() - ((2 * p_period_days) || ' days')::INTERVAL))))
            ) AS rn
        FROM repositories_archive a
        WHERE a.archived_at <= NOW() - (p_period_days || ' days')::INTERVAL
    ),
    -- Durability: how many distinct runs we've seen this repo in, and when first seen.
    archive_stats AS (
        SELECT
            a.github_id,
            COUNT(DISTINCT a.archived_at) AS times_seen,
            MIN(a.archived_at) AS first_seen_at
        FROM repositories_archive a
        GROUP BY a.github_id
    )
    SELECT
        r.id AS repo_id,
        r.github_id,
        r.owner,
        r.name,
        r.description,
        r.language,
        r.stars,
        r.forks,
        r.issues,
        LEAST(r.score, 100)::FLOAT AS score,
        r.created_at,
        (r.stars - COALESCE(om.old_stars, r.stars)) AS stars_growth,
        (r.forks - COALESCE(om.old_forks, r.forks)) AS forks_growth,
        r.owner_followers,
        r.owner_repo_count,
        r.velocity_badge,
        -- previous-period star growth = (old) - (prev), defaulting to 0 when unknown
        (COALESCE(om.old_stars, r.stars) - COALESCE(pm.prev_stars, COALESCE(om.old_stars, r.stars))) AS prev_stars_growth,
        -- acceleration = recent growth - previous growth
        (
            (r.stars - COALESCE(om.old_stars, r.stars))
            - (COALESCE(om.old_stars, r.stars) - COALESCE(pm.prev_stars, COALESCE(om.old_stars, r.stars)))
        ) AS acceleration,
        COALESCE(ast.times_seen, 0)::INT AS times_seen,
        ast.first_seen_at,
        r.updated_at
    FROM repositories r
    LEFT JOIN old_metrics om ON r.github_id = om.github_id AND om.rn = 1
    LEFT JOIN prev_metrics pm ON r.github_id = pm.github_id AND pm.rn = 1
    LEFT JOIN archive_stats ast ON r.github_id = ast.github_id
    WHERE
        (p_language IS NULL OR p_language = 'All' OR r.language ILIKE p_language)
        AND r.score >= p_min_score
        AND (
            q IS NULL
            OR r.owner ILIKE '%' || q || '%'
            OR r.name ILIKE '%' || q || '%'
            OR COALESCE(r.description, '') ILIKE '%' || q || '%'
        )
    ORDER BY
        CASE
            WHEN p_sort_by = 'score' THEN LEAST(r.score, 100)
            WHEN p_sort_by = 'stars' THEN r.stars::FLOAT
            WHEN p_sort_by = 'growth' THEN (r.stars - COALESCE(om.old_stars, r.stars))::FLOAT
            WHEN p_sort_by = 'acceleration' THEN (
                (r.stars - COALESCE(om.old_stars, r.stars))
                - (COALESCE(om.old_stars, r.stars) - COALESCE(pm.prev_stars, COALESCE(om.old_stars, r.stars)))
            )::FLOAT
            WHEN p_sort_by = 'durability' THEN COALESCE(ast.times_seen, 0)::FLOAT
            ELSE LEAST(r.score, 100)
        END DESC NULLS LAST,
        CASE
            WHEN p_sort_by = 'created_asc' THEN EXTRACT(EPOCH FROM r.created_at)
            ELSE 0
        END ASC NULLS LAST,
        CASE
            WHEN p_sort_by = 'created_desc' THEN EXTRACT(EPOCH FROM r.created_at)
            ELSE 0
        END DESC NULLS LAST,
        r.stars DESC
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Per-repo star/fork history for sparklines. Combines archived snapshots with the
-- current live value so the trend line ends at "today".
CREATE OR REPLACE FUNCTION get_repo_history(p_github_id BIGINT)
RETURNS TABLE (
    captured_at TIMESTAMPTZ,
    stars INT,
    forks INT
) AS $$
    SELECT a.archived_at AS captured_at, a.stars, a.forks
    FROM repositories_archive a
    WHERE a.github_id = p_github_id
    UNION ALL
    SELECT COALESCE(r.last_scanned_at, NOW()) AS captured_at, r.stars, r.forks
    FROM repositories r
    WHERE r.github_id = p_github_id
    ORDER BY captured_at ASC;
$$ LANGUAGE sql STABLE
SET search_path = public;
