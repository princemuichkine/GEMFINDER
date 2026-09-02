-- 04_optimize_repo_stats.sql
-- List RPC was scanning all of repositories_archive (~288k rows) on every
-- page load. anon statement_timeout is 3s, so the UI timed out whenever
-- the archive was not fully cached. Keep a tiny sightings table and use
-- per-repo index lookups for growth snapshots.

CREATE TABLE IF NOT EXISTS repo_sightings (
    github_id BIGINT PRIMARY KEY,
    times_seen INTEGER NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMPTZ
);

ALTER TABLE repo_sightings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on repo_sightings" ON repo_sightings;
CREATE POLICY "Allow public read access on repo_sightings"
    ON repo_sightings FOR SELECT TO public USING (true);

GRANT SELECT ON TABLE repo_sightings TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION bump_repo_sighting()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    INSERT INTO repo_sightings (github_id, times_seen, first_seen_at)
    VALUES (NEW.github_id, 1, NEW.archived_at)
    ON CONFLICT (github_id) DO UPDATE SET
        times_seen = repo_sightings.times_seen + 1,
        first_seen_at = LEAST(repo_sightings.first_seen_at, EXCLUDED.first_seen_at);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_repo_sighting ON repositories_archive;
CREATE TRIGGER trg_bump_repo_sighting
AFTER INSERT ON repositories_archive
FOR EACH ROW
EXECUTE FUNCTION bump_repo_sighting();

INSERT INTO repo_sightings (github_id, times_seen, first_seen_at)
SELECT a.github_id, COUNT(DISTINCT a.archived_at)::INT, MIN(a.archived_at)
FROM repositories_archive a
GROUP BY a.github_id
ON CONFLICT (github_id) DO UPDATE SET
    times_seen = EXCLUDED.times_seen,
    first_seen_at = EXCLUDED.first_seen_at;

CREATE OR REPLACE FUNCTION get_repo_stats(
    p_period_days INT DEFAULT 30,
    p_language TEXT DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 50,
    p_min_score FLOAT DEFAULT 0,
    p_sort_by TEXT DEFAULT 'score',
    p_search TEXT DEFAULT NULL,
    p_flag_filter TEXT DEFAULT NULL,
    p_min_stars INT DEFAULT 0,
    p_max_stars INT DEFAULT NULL
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
    prev_stars_growth INT,
    acceleration INT,
    times_seen INT,
    first_seen_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_saved BOOLEAN,
    is_hidden BOOLEAN
) AS $$
DECLARE
    q TEXT := NULLIF(TRIM(COALESCE(p_search, '')), '');
    ff TEXT := LOWER(COALESCE(NULLIF(TRIM(p_flag_filter), ''), 'default'));
BEGIN
    RETURN QUERY
    WITH flags AS (
        SELECT
            rf.github_id,
            bool_or(rf.flag = 'saved') AS saved,
            bool_or(rf.flag = 'hidden') AS hidden
        FROM repo_flags rf
        GROUP BY rf.github_id
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
        (COALESCE(om.old_stars, r.stars) - COALESCE(pm.prev_stars, COALESCE(om.old_stars, r.stars))) AS prev_stars_growth,
        (
            (r.stars - COALESCE(om.old_stars, r.stars))
            - (COALESCE(om.old_stars, r.stars) - COALESCE(pm.prev_stars, COALESCE(om.old_stars, r.stars)))
        ) AS acceleration,
        COALESCE(ast.times_seen, 0)::INT AS times_seen,
        ast.first_seen_at,
        r.updated_at,
        COALESCE(f.saved, FALSE) AS is_saved,
        COALESCE(f.hidden, FALSE) AS is_hidden
    FROM repositories r
    LEFT JOIN LATERAL (
        SELECT a.stars AS old_stars, a.forks AS old_forks
        FROM repositories_archive a
        WHERE a.github_id = r.github_id
        ORDER BY ABS(EXTRACT(EPOCH FROM (
            a.archived_at - (NOW() - make_interval(days => p_period_days))
        )))
        LIMIT 1
    ) om ON TRUE
    LEFT JOIN LATERAL (
        SELECT a.stars AS prev_stars
        FROM repositories_archive a
        WHERE a.github_id = r.github_id
        ORDER BY ABS(EXTRACT(EPOCH FROM (
            a.archived_at - (NOW() - make_interval(days => (2 * p_period_days)))
        )))
        LIMIT 1
    ) pm ON TRUE
    LEFT JOIN repo_sightings ast ON ast.github_id = r.github_id
    LEFT JOIN flags f ON r.github_id = f.github_id
    WHERE
        (p_language IS NULL OR p_language = 'All' OR r.language ILIKE p_language)
        AND r.score >= p_min_score
        AND r.stars >= COALESCE(p_min_stars, 0)
        AND (p_max_stars IS NULL OR r.stars <= p_max_stars)
        AND (
            q IS NULL
            OR r.owner ILIKE '%' || q || '%'
            OR r.name ILIKE '%' || q || '%'
            OR COALESCE(r.description, '') ILIKE '%' || q || '%'
        )
        AND (
            CASE
                WHEN ff = 'saved' THEN COALESCE(f.saved, FALSE)
                WHEN ff = 'hidden' THEN COALESCE(f.hidden, FALSE)
                WHEN ff = 'all' THEN TRUE
                ELSE COALESCE(f.hidden, FALSE) = FALSE
            END
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
$$ LANGUAGE plpgsql STABLE
SET search_path = public;

GRANT EXECUTE ON FUNCTION get_repo_stats(
    INT, TEXT, INT, INT, FLOAT, TEXT, TEXT, TEXT, INT, INT
) TO anon, authenticated, service_role;

ANALYZE repo_sightings;
ANALYZE repositories_archive;
ANALYZE repositories;
