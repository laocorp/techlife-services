-- Force creation of shipping-proofs bucket
INSERT INTO "storage"."buckets" ("id", "name", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types")
VALUES ('shipping-proofs', 'shipping-proofs', true, false, null, null)
ON CONFLICT ("id") DO UPDATE
SET "public" = true;

-- Ensure RLS is enabled/correct
CREATE POLICY "Staff can upload shipping proofs"
ON "storage"."objects"
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'shipping-proofs' );

CREATE POLICY "Authenticated users can view shipping proofs"
ON "storage"."objects"
FOR SELECT
TO authenticated
USING ( bucket_id = 'shipping-proofs' );
