const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://adwjsxbbbqpjhpwsjdvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY'
);

async function check() {
  console.log("--- LATEST CUSTOMERS ---");
  const { data: customers } = await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(3);
  console.log(customers);

  console.log("--- LATEST PROFILES ---");
  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(3);
  console.log(profiles);
}

check();
