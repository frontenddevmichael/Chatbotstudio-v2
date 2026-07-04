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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parsePath(url: string): string[] {
  return new URL(url).pathname.split("/").filter(Boolean);
}

const PROVIDERS = ["slack", "hubspot", "shopify", "wordpress", "calendly", "whatsapp"] as const;

const PROVIDER_CONFIG_FIELDS: Record<string, string[]> = {
  slack: ["webhook_url", "channel"],
  hubspot: ["api_key", "portal_id"],
  shopify: ["shop_domain", "access_token"],
  wordpress: ["site_url", "api_key"],
  calendly: ["api_key", "event_type_url"],
  whatsapp: ["phone_number_id", "access_token"],
};

function validateConfig(provider: string, config: Record<string, unknown>): string | null {
  const fields = PROVIDER_CONFIG_FIELDS[provider];
  if (!fields) return `Unknown provider: ${provider}`;
  for (const field of fields) {
    if (!config[field] || typeof config[field] !== "string" || !(config[field] as string).trim()) {
      return `${field} is required`;
    }
  }
  return null;
}

async function sendSlackMessage(webhookUrl: string, text: string): Promise<boolean> {
  if (isPrivateUrl(webhookUrl)) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
): Promise<boolean> {
  if (!/^\d+$/.test(phoneNumberId)) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const segments = parsePath(req.url);
    const functionsIndex = segments.findIndex((s) => s === "integrations");
    const routeSegments = functionsIndex >= 0 ? segments.slice(functionsIndex + 1) : segments;

    if (routeSegments.length < 3) {
      return jsonResponse({ error: "invalid_path" }, 400);
    }

    const [chatbotId, provider, action] = routeSegments;

    if (!PROVIDERS.includes(provider as typeof PROVIDERS[number])) {
      return jsonResponse({ error: "unsupported_provider" }, 400);
    }

    if (!["connect", "disconnect", "sync"].includes(action)) {
      return jsonResponse({ error: "invalid_action" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const { data: chatbot, error: chatbotErr } = await supabase
      .from("chatbots")
      .select("user_id")
      .eq("id", chatbotId)
      .single();

    if (chatbotErr || !chatbot) {
      return jsonResponse({ error: "chatbot_not_found" }, 404);
    }
    if (chatbot.user_id !== user.id) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    if (action === "connect") {
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      const config = body.config || {};

      const validationError = validateConfig(provider, config);
      if (validationError) {
        return jsonResponse({ error: `invalid_config: ${validationError}` }, 400);
      }

      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("chatbot_id", chatbotId)
        .eq("provider", provider)
        .maybeSingle();

      if (existing) {
        const { error: updateErr } = await supabase
          .from("integrations")
          .update({ config, is_enabled: true, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateErr) {
          return jsonResponse({ error: "db_error" }, 500);
        }
      } else {
        const { error: insertErr } = await supabase
          .from("integrations")
          .insert({ chatbot_id: chatbotId, provider, config, is_enabled: true });
        if (insertErr) {
          return jsonResponse({ error: "db_error" }, 500);
        }
      }

      return jsonResponse({ success: true, message: `${provider} connected` });
    }

    if (action === "disconnect") {
      const { error: updateErr } = await supabase
        .from("integrations")
        .update({ is_enabled: false, updated_at: new Date().toISOString() })
        .eq("chatbot_id", chatbotId)
        .eq("provider", provider);

      if (updateErr) {
        return jsonResponse({ error: "db_error" }, 500);
      }

      return jsonResponse({ success: true, message: `${provider} disconnected` });
    }

    if (action === "sync") {
      const { data: integration, error: fetchErr } = await supabase
        .from("integrations")
        .select("*")
        .eq("chatbot_id", chatbotId)
        .eq("provider", provider)
        .single();

      if (fetchErr || !integration) {
        return jsonResponse({ error: "integration_not_found" }, 404);
      }
      if (!integration.is_enabled) {
        return jsonResponse({ error: "integration_disabled" }, 400);
      }

      const config = integration.config as Record<string, string>;
      let syncResult: string;

      switch (provider) {
        case "slack": {
          const sent = await sendSlackMessage(config.webhook_url, `Sync triggered for chatbot ${chatbotId}`);
          syncResult = sent ? "Slack notification sent" : "Failed to send Slack notification";
          break;
        }
        case "whatsapp": {
          syncResult = "WhatsApp sync complete (no messages sent during sync)";
          break;
        }
        case "hubspot": {
          try {
            const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=3", {
              headers: { Authorization: `Bearer ${config.api_key}` },
            });
            if (res.ok) {
              const body = await res.json();
              const count = body?.results?.length ?? 0;
              syncResult = `HubSpot sync complete — ${count} contacts retrieved`;
            } else {
              syncResult = `HubSpot sync failed: ${res.status} ${res.statusText}`;
            }
          } catch {
            syncResult = "HubSpot sync failed — unable to reach API";
          }
          break;
        }
        case "shopify": {
          try {
            const res = await fetch(
              `https://${config.shop_domain}/admin/api/2024-01/orders.json?limit=3&status=any`,
              { headers: { "X-Shopify-Access-Token": config.access_token } },
            );
            if (res.ok) {
              const body = await res.json();
              const count = body?.orders?.length ?? 0;
              syncResult = `Shopify sync complete — ${count} orders retrieved`;
            } else {
              syncResult = `Shopify sync failed: ${res.status} ${res.statusText}`;
            }
          } catch {
            syncResult = "Shopify sync failed — unable to reach API";
          }
          break;
        }
        case "wordpress": {
          try {
            const siteUrl = config.site_url.replace(/\/+$/, "");
            const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts?per_page=3`, {
              headers: { Authorization: `Bearer ${config.api_key}` },
            });
            if (res.ok) {
              const posts = await res.json();
              const count = Array.isArray(posts) ? posts.length : 0;
              syncResult = `WordPress sync complete — ${count} posts retrieved`;
            } else {
              syncResult = `WordPress sync failed: ${res.status} ${res.statusText}`;
            }
          } catch {
            syncResult = "WordPress sync failed — unable to reach site";
          }
          break;
        }
        case "calendly": {
          try {
            const res = await fetch("https://api.calendly.com/event_types", {
              headers: { Authorization: `Bearer ${config.api_key}` },
            });
            if (res.ok) {
              const body = await res.json();
              const count = body?.collection?.length ?? 0;
              syncResult = `Calendly sync complete — ${count} event types found`;
            } else {
              syncResult = `Calendly sync failed: ${res.status} ${res.statusText}`;
            }
          } catch {
            syncResult = "Calendly sync failed — unable to reach API";
          }
          break;
        }
        default: {
          syncResult = `${provider} sync not yet supported`;
          break;
        }
      }

      await supabase
        .from("integrations")
        .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", integration.id);

      return jsonResponse({ success: true, message: syncResult });
    }

    return jsonResponse({ error: "invalid_action" }, 400);
  } catch (err) {
    console.error("Integrations function error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
