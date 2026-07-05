import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateContent, GeminiError } from "../_shared/gemini.ts";

interface FAQ {
  question: string;
  answer: string;
  variations?: string[];
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.chatbot_id !== "string") {
      return jsonResponse({ error: "chatbot_id_required" }, 400);
    }

    const chatbotId = body.chatbot_id;
    if (typeof chatbotId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chatbotId)) {
      return jsonResponse({ error: "invalid_chatbot_id" }, 400);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aiKey = Deno.env.get("AI_API_KEY");
    const aiModel = Deno.env.get("AI_MODEL") || "gemini-2.5-flash";
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

    if (!aiKey) {
      return jsonResponse({ error: "ai_not_configured" }, 500);
    }

    // Fetch chatbot and verify ownership
    const { data: chatbot, error: botErr } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", chatbotId)
      .single();

    if (botErr || !chatbot) {
      return jsonResponse({ error: "chatbot_not_found" }, 404);
    }

    if (chatbot.user_id !== user.id) {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    // Fetch existing FAQs
    const { data: existingFaqs } = await supabase
      .from("faqs")
      .select("*")
      .eq("chatbot_id", chatbotId);

    const currentFaqs = (existingFaqs || []) as FAQ[];

    // Fetch recent conversations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: conversations } = await supabase
      .from("conversations")
      .select("messages, started_at")
      .eq("chatbot_id", chatbotId)
      .gte("started_at", sevenDaysAgo)
      .order("started_at", { ascending: false })
      .limit(50);

    if (!conversations || conversations.length === 0) {
      return jsonResponse({ info: "no_recent_conversations", changelog: [] });
    }

    // Extract user questions that may be unanswered or uncertain
    const userQuestions: string[] = [];
    for (const conv of conversations) {
      const messages = conv.messages as Array<{ role: string; content: string }> || [];
      for (const msg of messages) {
        if (msg.role === "user") {
          const text = String(msg.content || "").trim().slice(0, 500);
          if (text.length > 10) userQuestions.push(text);
        }
      }
    }

    // Deduplicate and limit
    const uniqueQuestions = [...new Set(userQuestions)].slice(0, 30);

    // Use AI to analyze conversations and suggest new FAQs
    const existingFaqText = currentFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

    const prompt = `You are analyzing customer conversations for a chatbot named "${chatbot.name}" with tone "${chatbot.tone}".

EXISTING FAQs:
${existingFaqText || "None yet."}

RECENT USER QUESTIONS:
${uniqueQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Your job is to identify common questions that are NOT answered by the existing FAQs and suggest NEW FAQ entries.

Rules:
- Only suggest FAQs for questions that appear 2+ times or are clearly important
- Each new FAQ must be distinct from existing FAQs
- If the question is already covered by an existing FAQ, skip it
- Format: Q: question | A: answer
- Maximum 5 new FAQs
- Write answers that match the chatbot's tone

Return ONLY a JSON array of objects with "question" and "answer" keys. Example:
[{"question": "What are your hours?", "answer": "We're open 9-5 Monday to Friday."}]
If no new FAQs needed, return an empty array [].`;

    let newFaqs: FAQ[] = [];

    try {
      const content = await generateContent(aiModel, aiKey, "You are a FAQ analysis assistant. Only return valid JSON arrays.", [
        { role: "user", content: prompt },
      ], 0.3);
      const cleaned = content.replace(/```json|```/g, "").trim();
      newFaqs = JSON.parse(cleaned);
    } catch (err) {
      console.error("AI error:", err);
      return jsonResponse({ error: "ai_error" }, 500);
    }

    if (!Array.isArray(newFaqs) || newFaqs.length === 0) {
      return jsonResponse({ info: "no_new_faqs_needed", changelog: [] });
    }

    // Auto-apply: insert new FAQs and create changelog entries
    const changelog: Array<{ id: string; question: string; action: string }> = [];

    for (const faq of newFaqs.slice(0, 5)) {
      if (!faq.question || !faq.answer) continue;

      // Check for duplicates (fuzzy match)
      const isDuplicate = currentFaqs.some(
        (existing) =>
          existing.question.toLowerCase().includes(faq.question.toLowerCase().slice(0, 20)) ||
          faq.question.toLowerCase().includes(existing.question.toLowerCase().slice(0, 20)),
      );

      if (isDuplicate) continue;

      // Insert the new FAQ
      const { data: newFaq, error: insertErr } = await supabase
        .from("faqs")
        .insert({
          chatbot_id: chatbotId,
          question: faq.question,
          answer: faq.answer,
          variations: faq.variations || [],
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("Insert error:", insertErr);
        continue;
      }

      // Create changelog entry
      const { data: logEntry } = await supabase
        .from("faq_changelog")
        .insert({
          chatbot_id: chatbotId,
          faq_id: newFaq?.id,
          action: "create",
          field: "faq",
          new_value: `Q: ${faq.question}\nA: ${faq.answer}`,
          source: "autopilot",
          metadata: { generated_from: "conversation_analysis", conversation_count: conversations.length },
        })
        .select("id")
        .single();

      changelog.push({
        id: logEntry?.id || "",
        question: faq.question,
        action: "create",
      });
    }

    return jsonResponse({
      success: true,
      analyzed_conversations: conversations.length,
      analyzed_questions: uniqueQuestions.length,
      faqs_created: changelog.length,
      changelog,
    });
  } catch (err) {
    console.error("Autopilot error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
