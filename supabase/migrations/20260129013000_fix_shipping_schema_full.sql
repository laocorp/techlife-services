-- Comprehensive fix for Shipping Feature
-- 1. Add columns to ecommerce_orders if they are missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecommerce_orders' AND column_name = 'shipping_carrier') THEN
        ALTER TABLE "public"."ecommerce_orders"
        ADD COLUMN "shipping_carrier" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecommerce_orders' AND column_name = 'shipping_tracking') THEN
        ALTER TABLE "public"."ecommerce_orders"
        ADD COLUMN "shipping_tracking" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecommerce_orders' AND column_name = 'shipping_proof_url') THEN
        ALTER TABLE "public"."ecommerce_orders"
        ADD COLUMN "shipping_proof_url" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ecommerce_orders' AND column_name = 'shipped_at') THEN
        ALTER TABLE "public"."ecommerce_orders"
        ADD COLUMN "shipped_at" timestamptz;
    END IF;
END $$;

-- 2. Create storage bucket for shipping proofs (Idempotent)
INSERT INTO "storage"."buckets" ("id", "name", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types")
VALUES ('shipping-proofs', 'shipping-proofs', true, false, null, null)
ON CONFLICT ("id") DO UPDATE
SET "public" = true;

-- 3. RLS Policies for shipping-proofs bucket
-- Drop existing policies to avoid conflicts/dupes and recreate them ensures they are correct
DROP POLICY IF EXISTS "Staff can upload shipping proofs" ON "storage"."objects";
DROP POLICY IF EXISTS "Authenticated users can view shipping proofs" ON "storage"."objects";

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
