import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/database.ts';
import { authenticateRequest } from '../_shared/auth.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate
    await authenticateRequest(req);

    // Parse query parameters
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    if (query.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'Query must be at least 2 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getSupabaseClient();

    // Search customers
    const { data: customers, error } = await supabase
      .from('blvq__customers')
      .select('*')
      .or(`name.ilike.%${query}%,mobile.like.%${query}%`)
      .limit(50);

    if (error) {
      throw error;
    }

    // Format response
    const formattedCustomers = (customers || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      address: c.address,
      creditLimit: c.credit_limit,
      totalSpent: c.total_spent,
      outstandingBalance: c.outstanding_balance,
    }));

    // Paginate
    const pageSize = 20;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginated = formattedCustomers.slice(startIdx, endIdx);

    return new Response(
      JSON.stringify({
        customers: paginated,
        page,
        total_pages: Math.ceil(formattedCustomers.length / pageSize),
        total_count: formattedCustomers.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const status = error.message.includes('token') ? 401 : 500;
    return new Response(
      JSON.stringify({ detail: error.message || 'Internal server error' }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
