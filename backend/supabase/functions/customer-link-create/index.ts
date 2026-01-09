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
    const user = await authenticateRequest(req);

    const { ewity_customer_id, customer_name, customer_phone } = await req.json();

    if (!ewity_customer_id || !customer_name || !customer_phone) {
      return new Response(
        JSON.stringify({ detail: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getSupabaseClient();

    // Check if already linked
    const { data: existing } = await supabase
      .from('blvq__customer_links')
      .select('*')
      .eq('ewity_customer_id', ewity_customer_id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ detail: 'Customer already linked' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create link
    const { data: newLink, error } = await supabase
      .from('blvq__customer_links')
      .insert({
        ewity_customer_id,
        customer_name,
        customer_phone,
        created_by: user.sub,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        uuid: newLink.uuid,
        customer_name: newLink.customer_name,
        customer_phone: newLink.customer_phone,
        created_at: newLink.created_at,
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
