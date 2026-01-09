import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/database.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { ewityGet } from '../_shared/ewity.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate
    await authenticateRequest(req);

    const supabase = getSupabaseClient();

    console.log('🔄 Syncing customers from Ewity API...');

    let syncedCount = 0;
    let updatedCount = 0;
    let page = 1;
    let totalPages = 1;

    // Fetch all pages
    while (page <= totalPages) {
      console.log(`  Fetching page ${page}...`);

      const data = await ewityGet('/customers', { page });
      const customers = data?.data || [];
      const pagination = data?.pagination || {};

      // Update total pages from first response
      if (page === 1) {
        totalPages = pagination.lastPage || 1;
        const totalCustomers = pagination.total || 0;
        console.log(`  Found ${totalPages} pages (${totalCustomers} total customers)`);
      }

      // Process customers from this page
      for (const customerData of customers) {
        const customerId = customerData.id;
        if (!customerId) continue;

        // Check if customer exists
        const { data: existing } = await supabase
          .from('blvq__customers')
          .select('id')
          .eq('id', customerId)
          .single();

        // Upsert customer
        const { error } = await supabase
          .from('blvq__customers')
          .upsert({
            id: customerId,
            name: customerData.name,
            mobile: customerData.mobile,
            email: customerData.email,
            address: customerData.address,
            credit_limit: customerData.credit_limit,
            total_spent: customerData.total_spent,
            outstanding_balance: customerData.total_outstanding,
            data: customerData,
            synced_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`Error upserting customer ${customerId}:`, error);
          continue;
        }

        if (existing) {
          updatedCount++;
        } else {
          syncedCount++;
        }
      }

      console.log(`  ✓ Processed page ${page}/${totalPages}`);
      page++;
    }

    const total = syncedCount + updatedCount;
    console.log(`✓ Synced ${total} customers (${syncedCount} new, ${updatedCount} updated)`);

    return new Response(
      JSON.stringify({
        success: true,
        total,
        new: syncedCount,
        updated: updatedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
