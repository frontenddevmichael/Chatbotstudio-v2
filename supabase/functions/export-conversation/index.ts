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
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversation_id");
    const format = url.searchParams.get("format") || "json";

    if (!conversationId) {
      return jsonResponse({ error: "conversation_id is required" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*, chatbots!inner(user_id)")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return jsonResponse({ error: "Conversation not found" }, 404);
    }

    if (conversation.chatbots.user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const { data: tags } = await supabase
      .from("conversation_tags")
      .select("tag")
      .eq("conversation_id", conversationId);

    const { data: annotations } = await supabase
      .from("conversation_annotations")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const exportData = {
      id: conversation.id,
      chatbot_id: conversation.chatbot_id,
      session_id: conversation.session_id,
      visitor_id: conversation.visitor_id,
      started_at: conversation.started_at,
      last_message_at: conversation.last_message_at,
      messages: conversation.messages,
      tags: tags?.map((t: { tag: string }) => t.tag) || [],
      annotations: annotations || [],
    };

    if (format === "csv") {
      const messages = (conversation.messages as Array<{ role: string; content: string }>) || [];
      const header = "role,content,timestamp";
      const rows = messages.map((m) => {
        const content = `"${(m.content || "").replace(/"/g, '""')}"`;
        return `${m.role},${content},`;
      });
      const csv = [header, ...rows].join("\n");
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="conversation-${conversationId}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="conversation-${conversationId}.json"`,
      },
    });
  } catch (err) {
    console.error("export-conversation error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
