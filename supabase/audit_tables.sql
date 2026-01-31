-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check policies for payments and ecommerce
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('payments', 'sales_orders', 'ecommerce_orders', 'products');
