const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://adwjsxbbbqpjhpwsjdvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkd2pzeGJiYnFwamhwd3NqZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUzNzczNiwiZXhwIjoyMDg0MTEzNzM2fQ.ju-pFMsipNjCPwOy5I319xM0TYHW9GuLyjrYROY_XcY'
);

async function fixOrders() {
  console.log("Fetching orders with null branch_id...");
  const { data: orders, error } = await supabase.from('service_orders').select('id, tenant_id').is('branch_id', null);
  
  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }
  
  console.log(`Found ${orders.length} orders to fix.`);
  
  if (orders.length === 0) return;

  // Cache branches
  const branchMap = new Map();
  
  for (const order of orders) {
    let targetBranchId = branchMap.get(order.tenant_id);
    
    if (!targetBranchId) {
      // Find a branch for this tenant
      const { data: branch } = await supabase.from('branches').select('id').eq('tenant_id', order.tenant_id).limit(1).single();
      if (branch) {
        targetBranchId = branch.id;
        branchMap.set(order.tenant_id, targetBranchId);
      }
    }
    
    if (targetBranchId) {
      const { error: updateError } = await supabase.from('service_orders').update({ branch_id: targetBranchId }).eq('id', order.id);
      if (updateError) {
        console.error(`Failed to update order ${order.id}:`, updateError);
      } else {
        console.log(`Fixed order ${order.id} with branch ${targetBranchId}`);
      }
    }
  }
  
  console.log("Done fixing orders.");
}

fixOrders();
