-- 1. Ensure RLS is enabled on tenants (Best Practice)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2. Allow public read access to tenants marked as public
-- We drop it first to avoid conflicts if it exists
DROP POLICY IF EXISTS "Public tenants are viewable by everyone" ON tenants;

CREATE POLICY "Public tenants are viewable by everyone"
ON tenants FOR SELECT
To public
USING (is_public = true);

-- 3. Update existing tenants to be public so they appear in Marketplace
-- (Safety check: Only if they are currently null or false)
UPDATE tenants 
SET is_public = true 
WHERE is_public IS FALSE OR is_public IS NULL;
