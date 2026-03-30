const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://adwjsxbbbqpjhpwsjdvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY'
);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_table_policies', { table_name: 'service_orders' })
    .catch(async () => {
      // Fallback query if rpc doesn't exist
      const { data, error } = await supabase.auth.admin.listUsers(); // just test admin
      return supabase.from('service_orders').select('*').limit(1);
    });
    
  console.log("To check RLS policies, we need to query pg_policies via REST if possible, but we don't have a direct endpoint.");
}

checkPolicies();
