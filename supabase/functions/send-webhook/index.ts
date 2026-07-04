import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRIVATE_IPS = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|0\.|169\.254\.|::1|fd)/;

function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    if (PRIVATE_IPS.test(parsed.hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.chatbot_id || !body.event) {
      return jsonResponse({ error: "chatbot_id_and_event_required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalSecret = Deno.env.get("SEND_WEBHOOK_SECRET") || serviceKey;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token !== internalSecret) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch active webhooks for this chatbot that subscribe to this event
    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("chatbot_id", body.chatbot_id)
      .eq("is_active", true)
      .filter("events", "cs", `{${body.event}}`);

    if (!endpoints || endpoints.length === 0) {
      return jsonResponse({ delivered: 0 });
    }

    const payload = {
      event: body.event,
      chatbot_id: body.chatbot_id,
      data: body.data || {},
      timestamp: new Date().toISOString(),
    };

    let delivered = 0;
    for (const endpoint of endpoints) {
      if (isPrivateUrl(endpoint.url)) {
        continue;
      }
      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": endpoint.secret,
            "User-Agent": "ChatBotStudio-Webhook/1.0",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        await supabase
          .from("webhook_endpoints")
          .update({ last_sent_at: new Date().toISOString(), last_error: res.ok ? null : `HTTP ${res.status}` })
          .eq("id", endpoint.id);

        if (res.ok) delivered++;
      } catch (err) {
        const sanitizedErr = err instanceof Error ? err.message : "Unknown error";
        await supabase
          .from("webhook_endpoints")
          .update({ last_error: sanitizedErr })
          .eq("id", endpoint.id);
      }
    }

    return jsonResponse({ delivered });
  } catch (err) {
    console.error("send-webhook error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
}

serve(handler);

export { handler };
