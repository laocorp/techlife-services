-- Make ALL tenants public for the Marketplace
update public.tenants 
set 
    is_public = true,
    description = coalesce(description, 'Taller especializado en servicios técnicos profesionales.'),
    public_address = coalesce(public_address, 'Ubicación General'),
    contact_email = coalesce(contact_email, 'contacto@techlifeservice.com');
