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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "invalid_body" }, 400);
    }
    const { chatbot_id, session_id, messages, new_message, visitor_id, image, page_context, visitor_lang, variant_id } = body as Record<string, unknown>;

    // Validate field types
    if (typeof chatbot_id !== "string" || !/^[0-9a-f-]{36}$/i.test(chatbot_id)) {
      return jsonResponse({ error: "invalid_chatbot_id" }, 400);
    }
    if (typeof session_id !== "string" || session_id.length < 1 || session_id.length > 128) {
      return jsonResponse({ error: "invalid_session_id" }, 400);
    }
    if (typeof new_message !== "string") {
      return jsonResponse({ error: "invalid_message" }, 400);
    }
    if (messages !== undefined && !Array.isArray(messages)) {
      return jsonResponse({ error: "invalid_messages" }, 400);
    }

    // Sanitize: strip HTML tags and limit to 2000 chars
    const sanitizedMessage = new_message.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
    if (!sanitizedMessage) {
      return jsonResponse({ error: "empty_message" }, 400);
    }

    // Validate optional image (base64 data URL, max 4MB)
    let imageDataUrl: string | null = null;
    if (typeof image === "string" && image.length > 0) {
      if (image.length > 4_000_000) {
        return jsonResponse({ error: "image_too_large" }, 400);
      }
      if (!image.startsWith("data:image/")) {
        return jsonResponse({ error: "invalid_image_format" }, 400);
      }
      imageDataUrl = image;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aiKey = Deno.env.get("AI_API_KEY");
    const aiBaseUrl = (Deno.env.get("AI_BASE_URL") || "https://openrouter.ai/api").replace(/\/+$/, "");
    const defaultAiModel = Deno.env.get("AI_MODEL") || "google/gemini-2.5-flash";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch chatbot
    const { data: chatbot, error: botErr } = await supabase.from("chatbots").select("*").eq("id", chatbot_id).single();
    if (botErr || !chatbot) {
      return jsonResponse({ error: "chatbot_not_found" }, 404);
    }
    if (!chatbot.is_active) {
      return jsonResponse({ error: "chatbot_inactive" }, 403);
    }

    // A/B test variant override
    let effectiveTone = chatbot.tone;
    let systemPromptOverride: string | null = null;
    let selectedAiModel: string | null = null;
    if (typeof variant_id === "string" && variant_id.length > 0) {
      const { data: variant } = await supabase
        .from("chatbot_variants")
        .select("tone, system_prompt_override, ai_model")
        .eq("id", variant_id)
        .maybeSingle();
      if (variant) {
        if (variant.system_prompt_override) systemPromptOverride = variant.system_prompt_override;
        if (variant.tone) effectiveTone = variant.tone;
        if (variant.ai_model) selectedAiModel = variant.ai_model;
      }
    }

    // Multi-model routing
    const aiModel = selectedAiModel || chatbot.ai_model || defaultAiModel;
    const fallbackModel = chatbot.fallback_model || null;
    const routingStrategy = chatbot.routing_strategy || "single";

    async function callModel(model: string): Promise<Response> {
      return await fetch(`${aiBaseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationMessages,
          ],
        }),
      });
    }

    function isComplexQuery(): boolean {
      if (conversationMessages.length > 5) return true;
      const lastMsg = conversationMessages[conversationMessages.length - 1];
      const content = typeof lastMsg?.content === "string" ? lastMsg.content : "";
      return content.length > 100;
    }

    // Check chatbot owner's message limit
    const { data: ownerProfile } = await supabase.from("profiles").select("monthly_message_count, message_limit").eq("id", chatbot.user_id).single();
    if (ownerProfile && ownerProfile.monthly_message_count >= ownerProfile.message_limit) {
      return jsonResponse({ error: "owner_limit_reached", message: "This chatbot's message limit has been reached. Please contact the business owner." }, 429);
    }

    // Atomic rate limiting: 20 messages per session per hour
    const identifier = session_id.slice(0, 64);
    const { data: allowed, error: rlErr } = await supabase.rpc("check_and_increment_rate_limit", {
      _identifier: identifier,
      _endpoint: "widget_chat",
      _max_requests: 20,
      _window_seconds: 3600,
    });

    if (rlErr || allowed === false) {
      if (rlErr) console.error("Rate limit check error:", rlErr);
      return jsonResponse({ error: "rate_limit", message: "Too many messages. Please wait and try again." }, 429);
    }

    // Semantic FAQ retrieval via pgvector, fallback to full list
    let faqContext = "";
    let matchedFaqs: Array<{ question: string; answer: string; variations?: string[]; similarity: number }> | null = null;
    try {
      const embedRes = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: sanitizedMessage.slice(0, 8000),
        }),
      });
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const embedding = embedData?.data?.[0]?.embedding;
        if (embedding && Array.isArray(embedding) && embedding.length === 1536) {
          const { data: matched } = await supabase.rpc("match_faqs", {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
            p_chatbot_id: chatbot_id,
          });
          if (matched && matched.length > 0) {
            matchedFaqs = matched as Array<{ question: string; answer: string; variations?: string[]; similarity: number }>;
            faqContext = matchedFaqs
              .map(f => `Topic: ${f.question}\nAnswer: ${f.answer}${f.variations?.length ? `\nAlso asked as: ${f.variations.join(", ")}` : ""} (relevance: ${Math.round(f.similarity * 100)}%)`)
              .join("\n\n");
          }
        }
      }
    } catch {
      // Vector search unavailable — fall back to full FAQ list
    }

    if (!matchedFaqs || matchedFaqs.length === 0) {
      const { data: faqs } = await supabase.from("faqs").select("*").eq("chatbot_id", chatbot_id);
      faqContext = (faqs || []).map((f: { question: string; answer: string; variations?: string[] }) => {
        let entry = `Topic: ${f.question}\nAnswer: ${f.answer}`;
        if (f.variations?.length) entry += `\nAlso asked as: ${f.variations.join(", ")}`;
        return entry;
      }).join("\n\n");
    }

    // Visitor persona detection from conversation messages
    function detectPersona(msgs: Array<{ role: string; content: string }>): string {
      const text = msgs.filter(m => m.role === "user").map(m => m.content.toLowerCase()).join(" ");
      const signals: string[] = [];
      if (/\b(buy|purchase|order|price|cost|pricing|subscription|upgrade|plan|billing|invoice)\b/i.test(text)) signals.push("purchase_intent");
      if (/\b(help|issue|problem|bug|error|broken|not working|fix|trouble)\b/i.test(text)) signals.push("support_seeking");
      if (/\b(partner|reseller|affiliate|wholesale|distributor)\b/i.test(text)) signals.push("partner");
      if (/\b(investor|investment|funding|series|valuation)\b/i.test(text)) signals.push("investor");
      if (/\b(hiring|job|career|apply|position|role|recruit)\b/i.test(text)) signals.push("job_seeker");
      if (/\b(website|app|software|api|integration|plugin|extension|platform)\b/i.test(text)) signals.push("technical_visitor");
      if (/\b(store|shop|restaurant|service|appointment|booking|reservation)\b/i.test(text)) signals.push("consumer");
      return signals.length > 0 ? `Visitor signals: ${signals.join(", ")}.` : "";
    }

    // Cross-session memory: fetch past conversation summaries for this visitor
    let pastContext = "";
    if (typeof visitor_id === "string" && visitor_id.length > 0) {
      try {
        const { data: pastConvos } = await supabase
          .from("conversations")
          .select("messages, started_at")
          .eq("visitor_id", visitor_id)
          .eq("chatbot_id", chatbot_id)
          .neq("session_id", session_id)
          .not("messages", "is", null)
          .order("started_at", { ascending: false })
          .limit(3);

        if (pastConvos && pastConvos.length > 0) {
          const summaries = pastConvos.map((conv, i) => {
            const msgs = (conv.messages as Array<{ role: string; content: string }>) || [];
            const userMsgs = msgs.filter(m => m.role === "user").map(m => m.content.slice(0, 200));
            return `[Past Session ${i + 1} — ${new Date(conv.started_at || "").toLocaleDateString()}]\nUser asked: ${userMsgs.join(" | ")}`;
          }).filter(s => s.length > 20);
          if (summaries.length > 0) {
            pastContext = "\n\nPREVIOUS CONVERSATIONS WITH THIS VISITOR:\n" + summaries.join("\n\n");
          }
        }
      } catch {
        // Non-critical — conversation memory is best-effort
      }
    }

    // Detect visitor persona from conversation
    const conversationHistory = Array.isArray(messages)
      ? (messages as Array<{ role: string; content: string }>)
      : [];
    const personaContext = detectPersona(conversationHistory);

    const toneLabel = effectiveTone === "friendly" ? "warm, casual, uses contractions" : effectiveTone === "professional" ? "formal, precise, no slang" : effectiveTone === "casual" ? "like texting a smart friend" : "corporate, structured responses";

    const systemPrompt = systemPromptOverride || `You are ${chatbot.name}, an intelligent AI assistant.
Your personality and tone: ${effectiveTone || chatbot.tone}.

You have two layers of knowledge:

LAYER 1 — Business Knowledge Base (always prioritize this):
${faqContext || "No specific business knowledge has been added yet."}${pastContext}

VISITOR CONTEXT: ${personaContext || "Unknown visitor — answer helpfully regardless."}

CURRENT PAGE CONTEXT (the visitor is on this page right now):
${typeof page_context === "string" && page_context ? page_context : "Unknown page — answer generally."}

LAYER 2 — General Intelligence:
You are a highly capable AI. For any question not covered in the business knowledge base above, use your general knowledge and reasoning to give a genuinely helpful, accurate answer. Never pretend you don't know something you actually know.

BEHAVIOR RULES:
- Always check Layer 1 first. If the answer is there, use it.
- If not in Layer 1, answer from your general knowledge helpfully and confidently.
- Maintain full conversation context — remember everything said earlier in this chat.
- Match the tone setting: ${toneLabel}
- Keep responses concise unless the question genuinely needs depth.
- Match the visitor's language: ${typeof visitor_lang === "string" && visitor_lang ? `The visitor's browser language is ${visitor_lang}. Respond in the same language unless the visitor switches to another.` : "Respond in the language the visitor is using."}
- Never break character. You are ${chatbot.name}.
- Never mention Anthropic, Claude, Google, Gemini, or any underlying AI technology.
- If asked "are you an AI?" respond naturally based on tone — acknowledge it without revealing the technology stack.`;

    // Build conversation history
    const conversationMessages: Array<{ role: string; content: string | Array<Record<string, unknown>> }> = Array.isArray(messages)
      ? (messages as Array<{ role: string; content: string }>)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      : [];

    // If image provided, use multimodal content for the latest user message
    if (imageDataUrl) {
      conversationMessages.push({
        role: "user",
        content: [
          { type: "text", text: sanitizedMessage },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      });
    } else {
      conversationMessages.push({ role: "user", content: sanitizedMessage });
    }

    if (!aiKey) {
      return jsonResponse({ response: "I'm currently unable to process your request. Please try again later.", session_id });
    }

    const aiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiKey}`,
    };
    if (aiBaseUrl.includes("openrouter")) {
      aiHeaders["HTTP-Referer"] = "https://chatbotstudio.dev";
      aiHeaders["X-Title"] = "ChatBot Studio";
    }

    let selectedModel = aiModel;
    let aiResponse: Response;

    if (routingStrategy === "fallback" && fallbackModel) {
      aiResponse = await callModel(aiModel);
      if (!aiResponse.ok && [402, 429].includes(aiResponse.status) || aiResponse.status >= 500) {
        selectedModel = fallbackModel;
        aiResponse = await callModel(fallbackModel);
      }
    } else if (routingStrategy === "complexity" && fallbackModel) {
      if (isComplexQuery()) {
        aiResponse = await callModel(aiModel);
      } else {
        selectedModel = fallbackModel;
        aiResponse = await callModel(fallbackModel);
      }
    } else {
      aiResponse = await callModel(aiModel);
    }

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
    supabase.rpc("increment_message_count", { _user_id: chatbot.user_id }).then(() => {}).catch((e) => console.error("increment_message_count failed:", e));

    // Save conversation (fire and forget)
    let isNewConversation = false;
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
        .then(() => {}).catch((e) => console.error("save conversation failed:", e));
    } else {
      isNewConversation = true;
      const fullMessages = [
        ...conversationMessages.slice(0, -1),
        { role: "user", content: sanitizedMessage },
        { role: "assistant", content: sanitizedResponse },
      ];
      const insertPayload: Record<string, unknown> = { chatbot_id, session_id, messages: fullMessages };
      if (typeof visitor_id === "string" && visitor_id.length > 0) insertPayload.visitor_id = visitor_id;
      if (typeof variant_id === "string" && variant_id.length > 0) insertPayload.variant_id = variant_id;
      supabase.from("conversations").insert(insertPayload).then(() => {}).catch((e) => console.error("insert conversation failed:", e));
      supabase.rpc("increment_conversation_count", { p_chatbot_id: chatbot_id }).then(() => {}).catch((e) => console.error("increment conversation count failed:", e));
    }

    // Fire outbound webhook (fire and forget)
    const webhookEvent = isNewConversation ? "conversation.created" : "message.created";
      fetch(`${supabaseUrl}/functions/v1/send-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        chatbot_id,
        event: webhookEvent,
        data: {
          session_id,
          message: sanitizedMessage,
          response: sanitizedResponse,
        },
      }),
    }).catch((e) => console.error("webhook delivery failed:", e));

    return jsonResponse({ response: sanitizedResponse, session_id });
  } catch (err) {
    console.error("Chat function error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
