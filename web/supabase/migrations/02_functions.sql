-- 02_functions.sql

-- Function to get repository stats with growth
CREATE OR REPLACE FUNCTION get_repo_stats(
    p_period_days INT DEFAULT 30,
    p_language TEXT DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 50
)
RETURNS TABLE (
    repo_id BIGINT,
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
    forks_growth INT
) AS $$
BEGIN
    RETURN QUERY
    WITH old_metrics AS (
        SELECT 
            mh.repo_id,
            mh.stars AS old_stars,
            mh.forks AS old_forks,
            ROW_NUMBER() OVER (PARTITION BY mh.repo_id ORDER BY ABS(EXTRACT(EPOCH FROM (mh.captured_at - (NOW() - (p_period_days || ' days')::INTERVAL))))) as rn
        FROM metrics_history mh
        WHERE mh.captured_at >= NOW() - ((p_period_days + 7) || ' days')::INTERVAL -- Look back a bit further to find closest
    )
    SELECT 
        r.id AS repo_id,
        r.owner,
        r.name,
        r.description,
        r.language,
        r.stars,
        r.forks,
        r.issues,
        r.score,
        r.created_at,
        (r.stars - COALESCE(om.old_stars, r.stars)) AS stars_growth,
        (r.forks - COALESCE(om.old_forks, r.forks)) AS forks_growth
    FROM repositories r
    LEFT JOIN old_metrics om ON r.id = om.repo_id AND om.rn = 1
    WHERE 
        (p_language IS NULL OR p_language = 'All' OR r.language ILIKE p_language)
    ORDER BY 
        stars_growth DESC NULLS LAST, -- Prioritize growth
        r.stars DESC
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql;

-- Function to get distinct languages
CREATE OR REPLACE FUNCTION get_distinct_languages()
RETURNS TABLE (language TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT r.language
    FROM repositories r
    WHERE r.language IS NOT NULL AND r.language != ''
    ORDER BY r.language;
END;
$$ LANGUAGE plpgsql;
