-- 03_rls_policies.sql
-- Enable Row Level Security on tables

-- Enable RLS on repositories table
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on metrics_history table
ALTER TABLE metrics_history ENABLE ROW LEVEL SECURITY;

-- Policies for repositories table
-- Allow public read access (SELECT)
CREATE POLICY "Allow public read access on repositories"
    ON repositories
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to insert repositories
CREATE POLICY "Allow authenticated insert on repositories"
    ON repositories
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Allow authenticated users to update repositories
CREATE POLICY "Allow authenticated update on repositories"
    ON repositories
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Allow authenticated users to delete repositories
CREATE POLICY "Allow authenticated delete on repositories"
    ON repositories
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

-- Policies for metrics_history table
-- Allow public read access (SELECT)
CREATE POLICY "Allow public read access on metrics_history"
    ON metrics_history
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users to insert metrics_history
CREATE POLICY "Allow authenticated insert on metrics_history"
    ON metrics_history
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Allow authenticated users to update metrics_history
CREATE POLICY "Allow authenticated update on metrics_history"
    ON metrics_history
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Allow authenticated users to delete metrics_history
CREATE POLICY "Allow authenticated delete on metrics_history"
    ON metrics_history
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

-- Enable RLS on repositories_archive
ALTER TABLE repositories_archive ENABLE ROW LEVEL SECURITY;

-- Allow public read on archive (for potential future archive browser)
CREATE POLICY "Allow public read access on repositories_archive"
    ON repositories_archive
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated insert (collector uses service role)
CREATE POLICY "Allow authenticated insert on repositories_archive"
    ON repositories_archive
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);
