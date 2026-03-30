-- Check current branch assignments for staff
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.branch_id,
    b.name as branch_name
FROM profiles p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.role IN ('sales_store', 'sales_field', 'cashier', 'manager')
ORDER BY p.full_name;
