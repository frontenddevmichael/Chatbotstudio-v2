import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.changelog_id !== "string") {
      return jsonResponse({ error: "changelog_id_required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    // Fetch changelog entry
    const { data: entry, error: entryErr } = await supabase
      .from("faq_changelog")
      .select("*")
      .eq("id", body.changelog_id)
      .single();

    if (entryErr || !entry) {
      return jsonResponse({ error: "changelog_not_found" }, 404);
    }

    // Verify the caller owns the chatbot this changelog belongs to
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("user_id")
      .eq("id", entry.chatbot_id)
      .single();
    if (!chatbot || chatbot.user_id !== user.id) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    if (entry.rolled_back_at) {
      return jsonResponse({ error: "already_rolled_back" }, 400);
    }

    // Handle rollback based on action
    if (entry.action === "create" && entry.faq_id) {
      // Delete the created FAQ
      await supabase.from("faqs").delete().eq("id", entry.faq_id);
    } else if (entry.action === "update" && entry.faq_id) {
      // Restore old value
      const [oldField, oldVal] = (entry.old_value || "").split(": ");
      await supabase
        .from("faqs")
        .update({ [entry.field]: oldVal || entry.old_value })
        .eq("id", entry.faq_id);
    } else if (entry.action === "delete" && entry.old_value) {
      // Re-create the deleted FAQ
      const lines = entry.old_value.split("\n");
      const question = lines[0]?.replace(/^Q:\s*/i, "") || "";
      const answer = lines.slice(1).join("\n").replace(/^A:\s*/i, "") || entry.old_value;
      const { data: newFaq } = await supabase
        .from("faqs")
        .insert({ chatbot_id: entry.chatbot_id, question, answer })
        .select("id")
        .single();

      // Create a rollback changelog entry linking to the new FAQ
      await supabase.from("faq_changelog").insert({
        chatbot_id: entry.chatbot_id,
        faq_id: newFaq?.id,
        action: "rollback",
        field: "faq",
        old_value: entry.new_value,
        new_value: entry.old_value,
        source: "manual",
        metadata: { rolled_back_from: entry.id },
      });
    }

    // Mark the original entry as rolled back
    await supabase
      .from("faq_changelog")
      .update({ rolled_back_at: new Date().toISOString() })
      .eq("id", body.changelog_id);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Rollback error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
