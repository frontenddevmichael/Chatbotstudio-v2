import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const chatbotIds = (await supabase.from("chatbots").select("id").eq("user_id", userId)).data?.map(c => c.id) ?? [];

    if (chatbotIds.length > 0) {
      await supabase.from("follow_up_log").delete().in("rule_id", (
        await supabase.from("follow_up_rules").select("id").in("chatbot_id", chatbotIds)
      ).data?.map(r => r.id) ?? []);

      await supabase.from("follow_up_rules").delete().in("chatbot_id", chatbotIds);
      await supabase.from("webhooks").delete().in("chatbot_id", chatbotIds);
      await supabase.from("integrations").delete().in("chatbot_id", chatbotIds);
      await supabase.from("lighthouse_scores").delete().in("chatbot_id", chatbotIds);
      await supabase.from("conversations").delete().in("chatbot_id", chatbotIds);
      await supabase.from("faqs").delete().in("chatbot_id", chatbotIds);
      await supabase.from("chatbot_variants").delete().in("chatbot_id", chatbotIds);
      await supabase.from("chatbots").delete().eq("user_id", userId);
    }

    await supabase.from("conversation_annotations").delete().eq("user_id", userId);
    await supabase.from("api_keys").delete().eq("user_id", userId);
    await supabase.from("agency_members").delete().eq("user_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Profile is best-effort in case cascade handles it
    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch { /* non-fatal */ }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Auth deletion failed (data already removed):", deleteAuthError);
      return new Response(JSON.stringify({
        error: "Account data removed but auth deletion failed. Contact support.",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("delete-account error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handler);
export { handler };
