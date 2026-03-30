const { createClient } = require('@supabase/supabase-js');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY';
const supabase = createClient('https://adwjsxbbbqpjhpwsjdvc.supabase.co', serviceKey);

async function run() {
  const { data: branches } = await supabase.from('branches').select('*');
  console.log("Branches:", branches);
  
  const { data: ordersWithNull } = await supabase.from('service_orders').select('id, branch_id').is('branch_id', null);
  console.log("Orders with null branch:", ordersWithNull);
  
  const { data: technician } = await supabase.from('profiles').select('id, full_name, role, branch_id').eq('role', 'technician');
  console.log("Technicians:", technician);
}
run();
