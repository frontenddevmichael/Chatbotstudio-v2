import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatbot_id, session_id, messages, new_message } = await req.json();

    if (!chatbot_id || !session_id || !new_message) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sanitizedMessage = new_message.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!sanitizedMessage) {
      return new Response(JSON.stringify({ error: "empty_message" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch chatbot
    const { data: chatbot, error: botErr } = await supabase.from("chatbots").select("*").eq("id", chatbot_id).single();
    if (botErr || !chatbot) {
      return new Response(JSON.stringify({ error: "chatbot_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!chatbot.is_active) {
      return new Response(JSON.stringify({ error: "chatbot_inactive" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limiting
    const identifier = session_id.slice(0, 64);
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: rateData } = await supabase.from("rate_limits").select("*").eq("identifier", identifier).eq("endpoint", "widget_chat").gte("window_start", oneHourAgo).single();

    if (rateData && rateData.request_count >= 20) {
      return new Response(JSON.stringify({ error: "rate_limit", message: "Too many messages. Please wait and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Upsert rate limit
    if (rateData) {
      await supabase.from("rate_limits").update({ request_count: rateData.request_count + 1 }).eq("id", rateData.id);
    } else {
      await supabase.from("rate_limits").upsert({ identifier, endpoint: "widget_chat", request_count: 1, window_start: new Date().toISOString() }, { onConflict: "identifier,endpoint" });
    }

    // Fetch FAQs
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
For any question not covered in the business knowledge base above, use your general knowledge and reasoning to give a genuinely helpful, accurate answer.

BEHAVIOR RULES:
- Always check Layer 1 first. If the answer is there, use it.
- If not in Layer 1, answer from your general knowledge helpfully and confidently.
- Maintain full conversation context.
- Match the tone: ${chatbot.tone}
- Keep responses concise unless the question needs depth.
- Never break character. You are ${chatbot.name}.
- Never mention any underlying AI technology.`;

    // Build conversation history
    const conversationMessages = Array.isArray(messages)
      ? messages.filter((m: any) => m.role === "user" || m.role === "assistant").map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      : [];
    conversationMessages.push({ role: "user", content: sanitizedMessage });

    if (!lovableApiKey) {
      const fallbackResponse = "I'm currently unable to process your request. Please try again later.";
      return new Response(JSON.stringify({ response: fallbackResponse, session_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Lovable AI Gateway
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
        return new Response(JSON.stringify({ error: "rate_limit", message: "AI rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", message: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    const sanitizedResponse = responseText.replace(/<script[^>]*>.*?<\/script>/gi, "");

    // Save conversation async (fire and forget)
    const fullMessages = [...conversationMessages.slice(0, -1), { role: "user", content: sanitizedMessage }, { role: "assistant", content: sanitizedResponse }];

    const { data: existingConvo } = await supabase.from("conversations").select("id, messages").eq("chatbot_id", chatbot_id).eq("session_id", session_id).single();

    if (existingConvo) {
      const updatedMsgs = [...(Array.isArray(existingConvo.messages) ? existingConvo.messages : []), { role: "user", content: sanitizedMessage }, { role: "assistant", content: sanitizedResponse }];
      supabase.from("conversations").update({ messages: updatedMsgs, last_message_at: new Date().toISOString() }).eq("id", existingConvo.id).then(() => {});
    } else {
      supabase.from("conversations").insert({ chatbot_id, session_id, messages: fullMessages }).then(() => {});
      supabase.from("chatbots").update({ total_conversations: (chatbot.total_conversations || 0) + 1 }).eq("id", chatbot_id).then(() => {});
    }

    return new Response(JSON.stringify({ response: sanitizedResponse, session_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Chat function error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
