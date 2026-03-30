const { createClient } = require('@supabase/supabase-js');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY';
const supabase = createClient('https://adwjsxbbbqpjhpwsjdvc.supabase.co', serviceKey);

async function run() {
  const { data: orders } = await supabase.from('service_orders').select('*').order('created_at', { ascending: false }).limit(2);
  console.log("Latest Orders:", JSON.stringify(orders, null, 2));
}
run();
