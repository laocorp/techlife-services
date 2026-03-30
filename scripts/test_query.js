const { createClient } = require('@supabase/supabase-js');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY';
const supabase = createClient('https://adwjsxbbbqpjhpwsjdvc.supabase.co', serviceKey);

async function run() {
  const { data, error } = await supabase
        .from('service_orders')
        .select(`
            *,
            customers (id, full_name),
            asset:customer_assets (identifier, details, brand, model),
            tech:profiles!service_orders_assigned_to_fkey (full_name, avatar_url)
        `)
        .limit(1);
        
  console.log("Error:", error);
  console.log("Data length:", data ? data.length : 0);
  
  if (error) {
     console.log("Let's try without the tech profile relation:");
     const { data: d2, error: e2 } = await supabase
        .from('service_orders')
        .select(`
            *,
            customers (id, full_name),
            asset:customer_assets (identifier, details, brand, model)
        `)
        .limit(1);
     console.log("Error 2:", e2);
  }
}
run();
