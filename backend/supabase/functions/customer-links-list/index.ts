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

    const supabase = getSupabaseClient();

    // Get all links
    const { data: links, error } = await supabase
      .from('blvq__customer_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const formattedLinks = (links || []).map((link: any) => ({
      uuid: link.uuid,
      customer_name: link.customer_name,
      customer_phone: link.customer_phone,
      created_at: link.created_at,
      ewity_customer_id: link.ewity_customer_id,
    }));

    return new Response(
      JSON.stringify(formattedLinks),
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
