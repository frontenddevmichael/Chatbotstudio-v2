import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Frame-Options": "ALLOWALL",
  "Content-Security-Policy": "frame-ancestors *",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parsePath(url: string): { segments: string[]; query: URLSearchParams } {
  const u = new URL(url);
  return { segments: u.pathname.split("/").filter(Boolean), query: u.searchParams };
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return jsonResponse({ error: "missing_authorization_header" }, 401);
    }
    const apiKey = match[1];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Hash the presented key and compare against stored key_hash
    const keyHashBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
    const keyHash = Array.from(new Uint8Array(keyHashBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: keyRecord, error: keyErr } = await supabase
      .from("api_keys")
      .select("*, user_id")
      .eq("key_hash", keyHash)
      .single();

    if (keyErr || !keyRecord) {
      return jsonResponse({ error: "invalid_api_key" }, 401);
    }

    if (!keyRecord.is_active) {
      return jsonResponse({ error: "api_key_inactive" }, 403);
    }

    supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id).then(() => {});

    const userId = keyRecord.user_id;
    const { segments } = parsePath(req.url);

    if (segments.length < 1 || segments[0] !== "chatbots") {
      return jsonResponse({ error: "not_found" }, 404);
    }

    const chatbotId = segments[1];

    if (!chatbotId) {
      if (req.method === "GET") {
        const { data: chatbots, error: cbErr } = await supabase
          .from("chatbots")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (cbErr) return jsonResponse({ error: "db_error" }, 500);
        return jsonResponse({ data: chatbots });
      }
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    const subResource = segments[2];

    if (!subResource) {
      if (req.method === "GET") {
        const { data: chatbot, error: cbErr } = await supabase
          .from("chatbots")
          .select("*")
          .eq("id", chatbotId)
          .single();

        if (cbErr || !chatbot) return jsonResponse({ error: "chatbot_not_found" }, 404);
        if (chatbot.user_id !== userId) return jsonResponse({ error: "forbidden" }, 403);

        return jsonResponse({ data: chatbot });
      }
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    if (subResource === "chat") {
      if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

      const { data: chatbot, error: cbErr } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();

      if (cbErr || !chatbot) return jsonResponse({ error: "chatbot_not_found" }, 404);
      if (chatbot.user_id !== userId) return jsonResponse({ error: "forbidden" }, 403);

      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return jsonResponse({ error: "invalid_body" }, 400);
      }

      const { message, session_id, messages, visitor_id, image, page_context, visitor_lang } = body as Record<string, unknown>;

      if (typeof message !== "string" || !message.trim()) {
        return jsonResponse({ error: "invalid_message" }, 400);
      }

      const chatResponse = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          chatbot_id: chatbotId,
          session_id: session_id || crypto.randomUUID(),
          messages: messages || [],
          new_message: message,
          visitor_id: visitor_id || null,
          image: image || null,
          page_context: page_context || null,
          visitor_lang: visitor_lang || null,
        }),
      });

      const chatData = await chatResponse.json();
      return jsonResponse(chatData, chatResponse.status);
    }

    if (subResource === "faqs") {
      if (req.method === "GET") {
        const { data: faqs, error: fErr } = await supabase
          .from("faqs")
          .select("*")
          .eq("chatbot_id", chatbotId)
          .order("created_at", { ascending: false });

        if (fErr) return jsonResponse({ error: "db_error" }, 500);
        return jsonResponse({ data: faqs || [] });
      }

      if (req.method === "POST") {
        const { data: chatbot, error: cbErr } = await supabase
          .from("chatbots")
          .select("user_id")
          .eq("id", chatbotId)
          .single();

        if (cbErr || !chatbot) return jsonResponse({ error: "chatbot_not_found" }, 404);
        if (chatbot.user_id !== userId) return jsonResponse({ error: "forbidden" }, 403);

        const body = await req.json().catch(() => null);
        if (!body || typeof body.question !== "string" || typeof body.answer !== "string") {
          return jsonResponse({ error: "invalid_body" }, 400);
        }

        const { data: faq, error: insErr } = await supabase
          .from("faqs")
          .insert({ chatbot_id: chatbotId, question: body.question, answer: body.answer, variations: body.variations || [] })
          .select()
          .single();

        if (insErr) return jsonResponse({ error: "db_error" }, 500);
        return jsonResponse({ data: faq }, 201);
      }

      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    if (subResource === "conversations") {
      if (req.method !== "GET") return jsonResponse({ error: "method_not_allowed" }, 405);

      const { data: chatbot, error: cbErr } = await supabase
        .from("chatbots")
        .select("user_id")
        .eq("id", chatbotId)
        .single();

      if (cbErr || !chatbot) return jsonResponse({ error: "chatbot_not_found" }, 404);
      if (chatbot.user_id !== userId) return jsonResponse({ error: "forbidden" }, 403);

      const { data: conversations, error: convErr } = await supabase
        .from("conversations")
        .select("*")
        .eq("chatbot_id", chatbotId)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (convErr) return jsonResponse({ error: "db_error" }, 500);
      return jsonResponse({ data: conversations || [] });
    }

    if (subResource === "analytics") {
      if (req.method !== "GET") return jsonResponse({ error: "method_not_allowed" }, 405);

      const { data: chatbot, error: cbErr } = await supabase
        .from("chatbots")
        .select("user_id")
        .eq("id", chatbotId)
        .single();

      if (cbErr || !chatbot) return jsonResponse({ error: "chatbot_not_found" }, 404);
      if (chatbot.user_id !== userId) return jsonResponse({ error: "forbidden" }, 403);

      const { data: conversations } = await supabase
        .from("conversations")
        .select("messages, started_at, last_message_at")
        .eq("chatbot_id", chatbotId);

      const totalConversations = conversations?.length ?? 0;
      let totalMessages = 0;
      if (conversations) {
        for (const c of conversations) {
          totalMessages += Array.isArray(c.messages) ? c.messages.length : 0;
        }
      }

      return jsonResponse({
        data: {
          total_conversations: totalConversations,
          total_messages: totalMessages,
          chatbot_id: chatbotId,
        },
      });
    }

    return jsonResponse({ error: "not_found" }, 404);
  } catch (err) {
    console.error("REST API error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
}

serve(handler);

export default handler;
