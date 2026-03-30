const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://adwjsxbbbqpjhpwsjdvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY'
);

async function testTechnicianAccess() {
  // First get the latest order assigned to someone
  const { data: orders, error: oError } = await supabase
    .from('service_orders')
    .select('id, assigned_to')
    .not('assigned_to', 'is', null)
    .limit(1);
    
  if (oError || !orders || orders.length === 0) {
    console.log("No assigned orders found");
    return;
  }
  
  const order = orders[0];
  console.log(`Testing with Order ID: ${order.id}, assigned to: ${order.assigned_to}`);
  
  // Now simulate being that technician using standard client
  // Since we don't have their password, we can just look at the policies in the db.
  // We can query pg_policies via RPC!
  const { data, error } = await supabase.rpc('execute_sql', { query: `SELECT * FROM pg_policies WHERE tablename = 'service_orders'` })
  
  if (error) {
     console.log("RPC execute_sql not found or failed. Let's try standard JS:");
     console.log(error);
  } else {
     console.log("Policies:", data);
  }
}

testTechnicianAccess();
