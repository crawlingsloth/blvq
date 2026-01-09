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

    // Delete link
    const { error } = await supabase
      .from('blvq__customer_links')
      .delete()
      .eq('uuid', uuid);

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ detail: 'Link not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ message: 'Link deleted successfully' }),
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
