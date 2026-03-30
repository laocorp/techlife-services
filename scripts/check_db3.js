const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://adwjsxbbbqpjhpwsjdvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY'
);

async function check() {
  const { data: customers } = await supabase.from('customers').select('id, full_name, email, created_at, user_id').order('created_at', { ascending: false }).limit(2);
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(2);
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  const results = {
    customers,
    profiles,
    authUsers: authUsers.users.slice(0, 2).map(u => ({ id: u.id, email: u.email, meta: u.user_metadata }))
  };
  
  fs.writeFileSync('check_results.json', JSON.stringify(results, null, 2));
  console.log("Written to check_results.json");
}

check();
