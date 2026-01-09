import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/database.ts';
import { verifyPassword, createAccessToken } from '../_shared/auth.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ detail: 'Username and password required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = getSupabaseClient();

    // Get user from database
    const { data: user, error } = await supabase
      .from('blvq__users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return new Response(
        JSON.stringify({ detail: 'Incorrect username or password' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ detail: 'Incorrect username or password' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check role
    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ detail: 'Not authorized' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create token
    const accessToken = await createAccessToken(user.id, user.role);

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: 'bearer',
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
