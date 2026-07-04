import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aiKey = Deno.env.get("AI_API_KEY");
    const aiBaseUrl = (Deno.env.get("AI_BASE_URL") || "https://openrouter.ai/api").replace(/\/+$/, "");
    const aiModel = Deno.env.get("AI_MODEL") || "google/gemini-2.5-flash";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) {
      return new Response(JSON.stringify({ error: "server_not_configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify user JWT
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let parsedBody: { faq_id?: unknown };
    try {
      parsedBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { faq_id } = parsedBody;
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof faq_id !== "string" || !uuidRe.test(faq_id)) {
      return new Response(JSON.stringify({ error: "invalid_faq_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify FAQ belongs to user's chatbot
    const { data: faq } = await supabase
      .from("faqs")
      .select("*, chatbots!inner(user_id)")
      .eq("id", faq_id)
      .single();

    if (!faq || (faq.chatbots as Record<string, string>)?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limiting: 50 supercharges per user per day
    const identifier = user.id;
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: rateData } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("endpoint", "supercharge")
      .gte("window_start", oneDayAgo)
      .single();

    if (rateData && rateData.request_count >= 50) {
      return new Response(
        JSON.stringify({ error: "rate_limit", message: "Daily supercharge limit reached. Try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (rateData) {
      await supabase.from("rate_limits").update({ request_count: rateData.request_count + 1 }).eq("id", rateData.id);
    } else {
      await supabase.from("rate_limits").upsert(
        { identifier, endpoint: "supercharge", request_count: 1, window_start: new Date().toISOString() },
        { onConflict: "identifier,endpoint" }
      );
    }

    if (!aiKey) {
      return new Response(JSON.stringify({ error: "api_key_missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiKey}`,
    };
    if (aiBaseUrl.includes("openrouter")) {
      aiHeaders["HTTP-Referer"] = "https://chatbotstudio.dev";
      aiHeaders["X-Title"] = "ChatBot Studio";
    }

    const aiResponse = await fetch(`${aiBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: aiModel,
        messages: [{
          role: "user",
          content: `Given this FAQ — Question: '${faq.question}', Answer: '${faq.answer}'.
Generate 8 natural language variations of the question that real users might type in a chatbot. Think about different phrasings, levels of formality, and levels of detail.
Return ONLY a valid JSON array of 8 strings. No explanation, no markdown, no code blocks. Just the raw JSON array.`,
        }],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "AI rate limit exceeded." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const text = aiData.choices?.[0]?.message?.content || "[]";

    // Safely parse JSON response
    let variations: string[];
    try {
      // Handle markdown code blocks wrapping
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      variations = JSON.parse(cleaned);
      if (!Array.isArray(variations)) variations = [];
      // Ensure all items are strings
      variations = variations.filter((v: unknown) => typeof v === "string").slice(0, 8);
    } catch {
      console.error("Failed to parse AI response:", text);
      variations = [];
    }

    // Save variations to FAQ
    await supabase.from("faqs").update({ variations }).eq("id", faq_id);

    return new Response(JSON.stringify({ variations }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Supercharge error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
