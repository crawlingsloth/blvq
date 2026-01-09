import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { getAllCustomers } from '../_shared/ewity.ts';

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
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    // Get customers from Ewity API
    const data = await getAllCustomers(page);

    return new Response(
      JSON.stringify(data),
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
