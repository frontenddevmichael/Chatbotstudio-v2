import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    let supabase;

    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
      supabase = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
    } else {
      const internalSecret = Deno.env.get("PROCESS_FOLLOW_UPS_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const presentedKey = req.headers.get("x-service-role-key");
      if (!presentedKey || presentedKey !== internalSecret) {
        return jsonResponse({ error: "internal_only" }, 401);
      }
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    }

    const { data: activeRules, error: rulesError } = await supabase
      .from("follow_up_rules")
      .select("*, chatbots!inner(name, user_id)")
      .eq("is_active", true);

    if (rulesError) {
      console.error("Error fetching rules:", rulesError);
      return jsonResponse({ error: "Failed to fetch rules" }, 500);
    }

    const processed: Array<{ rule_id: string; conversation_id: string; status: string }> = [];

    for (const rule of (activeRules || [])) {
      const cutoff = new Date(Date.now() - (rule.trigger_delay_hours ?? 24) * 3600 * 1000).toISOString();
      let conversations: Array<{ id: string; visitor_id: string | null; messages: Array<{ role: string; content: string }> | null }> = [];

      if (rule.trigger_type === "no_response") {
        const { data } = await supabase
          .from("conversations")
          .select("id, visitor_id, messages")
          .eq("chatbot_id", rule.chatbot_id)
          .lt("last_message_at", cutoff)
          .order("last_message_at", { ascending: false })
          .limit(50);
        conversations = (data || []) as typeof conversations;
      } else if (rule.trigger_type === "after_conversation") {
        const { data } = await supabase
          .from("conversations")
          .select("id, visitor_id, messages")
          .eq("chatbot_id", rule.chatbot_id)
          .not("messages", "is", null)
          .lt("last_message_at", cutoff)
          .order("last_message_at", { ascending: false })
          .limit(50);
        conversations = (data || []) as typeof conversations;
      } else if (rule.trigger_type === "keyword_detected" && rule.condition_value) {
        const keywords = rule.condition_value.split(",").map((k: string) => k.trim().toLowerCase());
        const { data } = await supabase
          .from("conversations")
          .select("id, visitor_id, messages")
          .eq("chatbot_id", rule.chatbot_id)
          .not("messages", "is", null)
          .order("last_message_at", { ascending: false })
          .limit(100);
        conversations = ((data || []) as typeof conversations).filter((conv) => {
          const text = (conv.messages || [])
            .filter((m) => m.role === "user")
            .map((m) => m.content.toLowerCase())
            .join(" ");
          return keywords.some((kw: string) => text.includes(kw));
        });
      } else if (rule.trigger_type === "abandoned_cart") {
        const { data } = await supabase
          .from("conversations")
          .select("id, visitor_id, messages")
          .eq("chatbot_id", rule.chatbot_id)
          .not("messages", "is", null)
          .lt("last_message_at", cutoff)
          .order("last_message_at", { ascending: false })
          .limit(50);
        conversations = ((data || []) as typeof conversations).filter((conv) => {
          const text = (conv.messages || [])
            .filter((m) => m.role === "user")
            .map((m) => m.content.toLowerCase())
            .join(" ");
          return /\b(cart|checkout|buy|purchase|order|basket)\b/i.test(text);
        });
      }

      for (const conv of conversations) {
        const { data: existing } = await supabase
          .from("follow_up_log")
          .select("id")
          .eq("rule_id", rule.id)
          .eq("conversation_id", conv.id)
          .maybeSingle();

        if (existing) continue;

        const visitorEmail = conv.visitor_id || "simulated@example.com";

        const { data: logEntry } = await supabase
          .from("follow_up_log")
          .insert({
            rule_id: rule.id,
            conversation_id: conv.id,
            visitor_email: visitorEmail,
            sent_at: new Date().toISOString(),
            status: "pending",
          })
          .select()
          .single();

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        let deliveryStatus = "pending";

        if (resendApiKey && rule.email_body && visitorEmail !== "simulated@example.com") {
          try {
            const chatbotName = rule.chatbots?.name || "ChatBot";
            const body = (rule.email_body as string)
              .replace(/\{\{chatbot_name\}\}/g, chatbotName)
              .replace(/\{\{visitor_email\}\}/g, visitorEmail);
            const htmlBody = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;max-width:560px;margin:0 auto;color:#1a1a1a">
<div style="border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:20px">
<span style="font-size:14px;font-weight:600;color:#6b7280">${chatbotName}</span>
</div>
<div style="font-size:16px;line-height:1.6;white-space:pre-wrap">${body.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
<div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:12px;font-size:12px;color:#9ca3af">
<p>You received this message because you interacted with ${chatbotName}.</p>
</div>
</body></html>`;

            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "ChatBot Studio <noreply@chatbotstudio.dev>",
                to: [visitorEmail],
                subject: rule.email_subject || "Follow-up from ChatBot Studio",
                text: body,
                html: htmlBody,
              }),
            });

            if (emailRes.ok) {
              deliveryStatus = "sent";
            } else {
              const errBody = await emailRes.text();
              console.error(`[process-follow-ups] Resend error for rule "${rule.name}":`, emailRes.status, errBody);
            }
          } catch (emailErr) {
            console.error(`[process-follow-ups] Failed to send email for rule "${rule.name}":`, emailErr);
          }
        } else {
          console.log(
            `[process-follow-ups] Email ${resendApiKey ? "skipped (no body or simulated address)" : "skipped — set RESEND_API_KEY"} ` +
            `for rule "${rule.name}" (${rule.trigger_type}) to ${visitorEmail}: ` +
            `subject="${rule.email_subject || "No subject"}"`
          );
        }

        if (deliveryStatus === "sent" && logEntry) {
          await supabase
            .from("follow_up_log")
            .update({ status: "sent" })
            .eq("id", logEntry.id);
        }

        processed.push({
          rule_id: rule.id,
          conversation_id: conv.id,
          status: deliveryStatus,
        });
      }
    }

    return jsonResponse({ processed: processed.length, details: processed });
  } catch (err) {
    console.error("process-follow-ups error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "internal_error" }, 500);
  }
});
