import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/database.ts';
import { ewityGet } from '../_shared/ewity.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get UUID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const uuid = pathParts[pathParts.length - 1];

    if (!uuid) {
      return new Response(
        JSON.stringify({ detail: 'UUID required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getSupabaseClient();

    // Find the customer link
    const { data: link, error: linkError } = await supabase
      .from('blvq__customer_links')
      .select('*')
      .eq('uuid', uuid)
      .single();

    if (linkError || !link) {
      return new Response(
        JSON.stringify({ detail: 'Customer not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update last accessed
    await supabase
      .from('blvq__customer_links')
      .update({ last_accessed: new Date().toISOString() })
      .eq('uuid', uuid);

    // Fetch FRESH customer data from Ewity API
    let customerData: any = null;
    let foundPage: number | null = null;

    try {
      // Check cached page first
      if (link.last_api_page) {
        console.log(`Checking cached page ${link.last_api_page}`);
        const data = await ewityGet('/customers', { page: link.last_api_page });
        const customers = data?.data || [];

        for (const c of customers) {
          if (c.id === link.ewity_customer_id) {
            customerData = c;
            foundPage = link.last_api_page;
            break;
          }
        }
      }

      // Search all pages if not found on cached page
      if (!customerData) {
        console.log('Searching all pages...');
        for (let page = 1; page <= 14; page++) {
          if (page === link.last_api_page) continue;

          const data = await ewityGet('/customers', { page });
          const customers = data?.data || [];

          for (const c of customers) {
            if (c.id === link.ewity_customer_id) {
              customerData = c;
              foundPage = page;
              break;
            }
          }

          if (customerData) break;
        }
      }

      // Update cached page if found on different page
      if (foundPage && foundPage !== link.last_api_page) {
        await supabase
          .from('blvq__customer_links')
          .update({ last_api_page: foundPage })
          .eq('uuid', uuid);
      }
    } catch (error) {
      console.error('Error fetching from Ewity:', error);
    }

    // Fallback to database if API fails
    if (!customerData) {
      console.log('Falling back to database');
      const { data: dbCustomer } = await supabase
        .from('blvq__customers')
        .select('*')
        .eq('id', link.ewity_customer_id)
        .single();

      if (dbCustomer) {
        customerData = {
          name: dbCustomer.name,
          mobile: dbCustomer.mobile,
          credit_limit: dbCustomer.credit_limit,
          total_outstanding: dbCustomer.outstanding_balance,
          total_spent: dbCustomer.total_spent,
        };
      }
    }

    if (!customerData) {
      return new Response(
        JSON.stringify({ detail: 'Customer data not available' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return balance info
    return new Response(
      JSON.stringify({
        uuid: link.uuid,
        customer_name: customerData.name || link.customer_name || 'Unknown',
        customer_phone: customerData.mobile || link.customer_phone,
        credit_limit: customerData.credit_limit || 0,
        total_outstanding: customerData.total_outstanding || 0,
        total_spent: customerData.total_spent || 0,
        loyalty_text: customerData.loyalty_text || null,
        last_updated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ detail: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
