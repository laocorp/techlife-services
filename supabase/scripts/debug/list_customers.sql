-- List all customers to check their IDs
SELECT 
    id, 
    full_name, 
    email, 
    user_id, 
    tenant_id
FROM customers
ORDER BY created_at DESC;
