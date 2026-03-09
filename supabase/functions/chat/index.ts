import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Frame-Options": "ALLOWALL",
  "Content-Security-Policy": "frame-ancestors *",
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
    const { chatbot_id, session_id, messages, new_message } = await req.json();

    if (!chatbot_id || !session_id || !new_message) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    // Sanitize: strip HTML tags and limit to 2000 chars
    const sanitizedMessage = new_message.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!sanitizedMessage) {
      return jsonResponse({ error: "empty_message" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch chatbot
    const { data: chatbot, error: botErr } = await supabase.from("chatbots").select("*").eq("id", chatbot_id).single();
    if (botErr || !chatbot) {
      return jsonResponse({ error: "chatbot_not_found" }, 404);
    }
    if (!chatbot.is_active) {
      return jsonResponse({ error: "chatbot_inactive" }, 403);
    }

    // Check chatbot owner's message limit
    const { data: ownerProfile } = await supabase.from("profiles").select("monthly_message_count, message_limit").eq("id", chatbot.user_id).single();
    if (ownerProfile && ownerProfile.monthly_message_count >= ownerProfile.message_limit) {
      return jsonResponse({ error: "owner_limit_reached", message: "This chatbot's message limit has been reached. Please contact the business owner." }, 429);
    }

    // Rate limiting: 20 messages per session per hour
    const identifier = session_id.slice(0, 64);
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: rateData } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("endpoint", "widget_chat")
      .gte("window_start", oneHourAgo)
      .single();

    if (rateData && rateData.request_count >= 20) {
      return jsonResponse({ error: "rate_limit", message: "Too many messages. Please wait and try again." }, 429);
    }

    // Upsert rate limit counter
    if (rateData) {
      await supabase.from("rate_limits").update({ request_count: rateData.request_count + 1 }).eq("id", rateData.id);
    } else {
      await supabase.from("rate_limits").upsert(
        { identifier, endpoint: "widget_chat", request_count: 1, window_start: new Date().toISOString() },
        { onConflict: "identifier,endpoint" }
      );
    }

    // Fetch FAQs for knowledge base
    const { data: faqs } = await supabase.from("faqs").select("*").eq("chatbot_id", chatbot_id);

    // Build system prompt
    const faqContext = (faqs || []).map((f: any) => {
      let entry = `Topic: ${f.question}\nAnswer: ${f.answer}`;
      if (f.variations?.length) entry += `\nAlso asked as: ${f.variations.join(", ")}`;
      return entry;
    }).join("\n\n");

    const systemPrompt = `You are ${chatbot.name}, an intelligent AI assistant.
Your personality and tone: ${chatbot.tone}.

You have two layers of knowledge:

LAYER 1 — Business Knowledge Base (always prioritize this):
${faqContext || "No specific business knowledge has been added yet."}

LAYER 2 — General Intelligence:
You are a highly capable AI. For any question not covered in the business knowledge base above, use your general knowledge and reasoning to give a genuinely helpful, accurate answer. Never pretend you don't know something you actually know.

BEHAVIOR RULES:
- Always check Layer 1 first. If the answer is there, use it.
- If not in Layer 1, answer from your general knowledge helpfully and confidently.
- Maintain full conversation context — remember everything said earlier in this chat.
- Match the tone setting: ${chatbot.tone === "friendly" ? "warm, casual, uses contractions" : chatbot.tone === "professional" ? "formal, precise, no slang" : chatbot.tone === "casual" ? "like texting a smart friend" : "corporate, structured responses"}
- Keep responses concise unless the question genuinely needs depth.
- Never break character. You are ${chatbot.name}.
- Never mention Anthropic, Claude, Google, Gemini, or any underlying AI technology.
- If asked "are you an AI?" respond naturally based on tone — acknowledge it without revealing the technology stack.`;

    // Build conversation history
    const conversationMessages = Array.isArray(messages)
      ? messages
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      : [];
    conversationMessages.push({ role: "user", content: sanitizedMessage });

    if (!lovableApiKey) {
      return jsonResponse({ response: "I'm currently unable to process your request. Please try again later.", session_id });
    }

    // Call AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonResponse({ error: "rate_limit", message: "AI rate limit exceeded. Please try again later." }, 429);
      }
      if (aiResponse.status === 402) {
        return jsonResponse({ error: "payment_required", message: "AI credits exhausted." }, 402);
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return jsonResponse({ error: "ai_error" }, 500);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    const sanitizedResponse = responseText.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<\/script>/gi, "");

    // Atomic increment of owner's monthly_message_count (fire and forget)
    supabase.rpc("increment_message_count", { _user_id: chatbot.user_id }).then(() => {});

    // Save conversation (fire and forget)
    const { data: existingConvo } = await supabase
      .from("conversations")
      .select("id, messages")
      .eq("chatbot_id", chatbot_id)
      .eq("session_id", session_id)
      .single();

    if (existingConvo) {
      const updatedMsgs = [
        ...(Array.isArray(existingConvo.messages) ? existingConvo.messages : []),
        { role: "user", content: sanitizedMessage },
        { role: "assistant", content: sanitizedResponse },
      ];
      supabase
        .from("conversations")
        .update({ messages: updatedMsgs, last_message_at: new Date().toISOString() })
        .eq("id", existingConvo.id)
        .then(() => {});
    } else {
      const fullMessages = [
        ...conversationMessages.slice(0, -1),
        { role: "user", content: sanitizedMessage },
        { role: "assistant", content: sanitizedResponse },
      ];
      supabase.from("conversations").insert({ chatbot_id, session_id, messages: fullMessages }).then(() => {});
      supabase.from("chatbots").update({ total_conversations: (chatbot.total_conversations || 0) + 1 }).eq("id", chatbot_id).then(() => {});
    }

    return jsonResponse({ response: sanitizedResponse, session_id });
  } catch (err) {
    console.error("Chat function error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
