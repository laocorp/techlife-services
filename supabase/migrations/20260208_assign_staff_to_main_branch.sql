-- Assign staff members without a branch to the main branch
UPDATE profiles
SET branch_id = (
    SELECT id 
    FROM branches 
    WHERE tenant_id = profiles.tenant_id 
    AND is_main = true 
    LIMIT 1
)
WHERE branch_id IS NULL 
AND role IN ('sales_store', 'sales_field', 'cashier', 'manager', 'technician', 'receptionist', 'warehouse_keeper', 'head_technician')
AND tenant_id IS NOT NULL;
