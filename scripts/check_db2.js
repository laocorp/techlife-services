const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://adwjsxbbbqpjhpwsjdvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY'
);

async function check() {
  const { data: customers } = await supabase.from('customers').select('id, full_name, email, created_at, user_id').order('created_at', { ascending: false }).limit(2);
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(2);
  
  console.log("CUSTOMERS:", JSON.stringify(customers, null, 2));
  console.log("PROFILES:", JSON.stringify(profiles, null, 2));
}

check();
