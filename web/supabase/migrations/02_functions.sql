-- 02_functions.sql — RPC functions (canonical fresh install)

CREATE OR REPLACE FUNCTION get_repo_stats(
    p_period_days INT DEFAULT 30,
    p_language TEXT DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 50,
    p_min_score FLOAT DEFAULT 0,
    p_sort_by TEXT DEFAULT 'score',
    p_search TEXT DEFAULT NULL,
    p_flag_filter TEXT DEFAULT NULL,  -- NULL/'default' = hide hidden, 'saved', 'hidden', 'all'
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
    WITH
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
        WHERE a.archived_at >= NOW() - ((p_period_days + 14) || ' days')::INTERVAL
    ),
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
    archive_stats AS (
        SELECT
            a.github_id,
            COUNT(DISTINCT a.archived_at) AS times_seen,
            MIN(a.archived_at) AS first_seen_at
        FROM repositories_archive a
        GROUP BY a.github_id
    ),
    flags AS (
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
    LEFT JOIN old_metrics om ON r.github_id = om.github_id AND om.rn = 1
    LEFT JOIN prev_metrics pm ON r.github_id = pm.github_id AND pm.rn = 1
    LEFT JOIN archive_stats ast ON r.github_id = ast.github_id
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
$$ LANGUAGE plpgsql
SET search_path = public;

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

CREATE OR REPLACE FUNCTION get_distinct_languages()
RETURNS TABLE (language TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT r.language
    FROM repositories r
    WHERE r.language IS NOT NULL AND r.language != ''
    ORDER BY r.language;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION get_last_run_at()
RETURNS TIMESTAMPTZ AS $$
  SELECT MAX(last_scanned_at) FROM repositories;
$$ LANGUAGE sql STABLE
SET search_path = public;
