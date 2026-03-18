-- =============================================
-- SYSTEM RESET & CLEAN SLATE V2 (Safe Version)
-- =============================================
-- This script dynamically finds ALL tables in 'public' and wipes them.
-- It avoids errors if a specific table doesn't exist.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT quote_ident(tablename) as table_name
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'spatial_ref_sys' -- Don't touch PostGIS if installed
    ) LOOP
        -- Execute Truncate for each table found
        EXECUTE 'TRUNCATE TABLE public.' || r.table_name || ' RESTART IDENTITY CASCADE';
    END LOOP;
END $$;
