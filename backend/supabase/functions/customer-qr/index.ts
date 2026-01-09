import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/database.ts';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get UUID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    // Remove the last element which is 'qr'
    const uuid = pathParts[pathParts.length - 2];

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

    // Verify link exists
    const { data: link, error } = await supabase
      .from('blvq__customer_links')
      .select('*')
      .eq('uuid', uuid)
      .single();

    if (error || !link) {
      return new Response(
        JSON.stringify({ detail: 'Customer not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate QR code
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://blvq.crawlingsloth.cloud';
    const qrUrl = `${frontendUrl}/balance/${uuid}`;

    const qrCode = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'L',
      width: 300,
      margin: 4,
    });

    // Convert data URL to buffer
    const base64Data = qrCode.split(',')[1];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
      },
    });
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
