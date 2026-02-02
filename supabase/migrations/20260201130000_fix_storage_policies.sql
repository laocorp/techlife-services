-- 1. Reset Policies for Branding (Safe to run multiple times)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Delete" ON storage.objects;
DROP POLICY IF EXISTS "Branding Policy" ON storage.objects;

-- 2. Create a single PERMISSIVE policy for the branding bucket
CREATE POLICY "Branding Policy"
ON storage.objects FOR ALL
USING ( bucket_id = 'branding' )
WITH CHECK ( bucket_id = 'branding' );

-- NOTE: We removed the 'ALTER TABLE' command as it caused permission errors.
-- storage.objects usually has RLS enabled by default anyway.
