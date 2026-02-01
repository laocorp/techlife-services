UPDATE tenants SET is_public = true WHERE is_public IS FALSE OR is_public IS NULL;
