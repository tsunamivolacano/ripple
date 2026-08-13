import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[process-notifications] Starting scheduled notification batch process...");

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch pending notifications where trigger_time <= NOW()
    const nowISO = new Date().toISOString();

    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('trigger_time', nowISO)
      .limit(50);

    if (fetchError) {
      console.error("[process-notifications] Error fetching pending notifications:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[process-notifications] Found ${pendingNotifications?.length || 0} pending notifications to dispatch.`);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processedCount = 0;

    for (const notification of pendingNotifications) {
      // Mark as sent in DB
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'sent' })
        .eq('id', notification.id);

      processedCount++;
      console.log(`[process-notifications] Processed notification ${notification.id} for item ${notification.item_id}`);
    }

    return new Response(JSON.stringify({ processed: processedCount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error("[process-notifications] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});