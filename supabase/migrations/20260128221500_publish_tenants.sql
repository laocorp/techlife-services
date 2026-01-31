-- Publish All Tenants for Testing
update public.tenants 
set is_public = true,
    description = coalesce(description, 'Taller especializado en servicios técnicos.'),
    public_address = coalesce(public_address, 'Ubicación General'),
    industry = coalesce(industry, 'automotive');

-- Verify
select name, is_public, industry from public.tenants;
