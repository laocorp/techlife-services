-- Add shipping columns to ecommerce_orders
ALTER TABLE "public"."ecommerce_orders"
ADD COLUMN "shipping_carrier" text,
ADD COLUMN "shipping_tracking" text,
ADD COLUMN "shipping_proof_url" text,
ADD COLUMN "shipped_at" timestamptz;

-- Create storage bucket for shipping proofs
INSERT INTO "storage"."buckets" ("id", "name", "public")
VALUES ('shipping-proofs', 'shipping-proofs', true)
ON CONFLICT ("id") DO NOTHING;

-- RLS Policies for shipping-proofs bucket
-- 1. Allow authenticated users (staff) to upload
CREATE POLICY "Staff can upload shipping proofs"
ON "storage"."objects"
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'shipping-proofs' );

-- 2. Allow public to view (so customers can see their proof)
-- Alternatively, we could restrict to owner, but public read with unguessable names is often easier for MVP.
-- Given signed URLs logic used previously, we can skip public policy if we use signed URLs, 
-- but consistent with payment-proofs (which we made public-ish or signed), let's ensure we can read.
-- The code currently uses createSignedUrl, so we don't strictly need public=true if we assume RLS handles 'select'.
-- BUT, typically storage RLS defaults to 'no access'.
-- Let's allow authenticated to SELECT (view) broadly or strictly.
-- For simplicity in this MVP: Trusted staff uploads, anyone with link (signed) or auth user can view.

CREATE POLICY "Authenticated users can view shipping proofs"
ON "storage"."objects"
FOR SELECT
TO authenticated
USING ( bucket_id = 'shipping-proofs' );
