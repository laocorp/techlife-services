-- Test manual UPDATE of branch_id for Marcos
-- First, get the IDs we need
SELECT 
    'Marcos ID:' as label,
    id as value
FROM profiles 
WHERE full_name = 'Marcos Adrade'
UNION ALL
SELECT 
    'Current Branch ID:' as label,
    branch_id as value
FROM profiles 
WHERE full_name = 'Marcos Adrade'
UNION ALL
SELECT 
    'Available Branches:' as label,
    id || ' - ' || name as value
FROM branches
ORDER BY label, value;

-- Try to update Marcos' branch_id manually
-- Replace 'NEW_BRANCH_ID_HERE' with an actual branch ID from the query above
-- UPDATE profiles
-- SET branch_id = 'NEW_BRANCH_ID_HERE'
-- WHERE full_name = 'Marcos Adrade';

-- Then check if it worked
-- SELECT full_name, branch_id, b.name as branch_name
-- FROM profiles p
-- LEFT JOIN branches b ON p.branch_id = b.id
-- WHERE p.full_name = 'Marcos Adrade';
