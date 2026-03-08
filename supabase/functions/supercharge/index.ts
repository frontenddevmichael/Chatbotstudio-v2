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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { faq_id } = await req.json();
    if (!faq_id) {
      return new Response(JSON.stringify({ error: "missing_faq_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify FAQ belongs to user's chatbot
    const { data: faq } = await supabase.from("faqs").select("*, chatbots!inner(user_id)").eq("id", faq_id).single();
    if (!faq || (faq as any).chatbots?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limiting
    const identifier = user.id;
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: rateData } = await supabase.from("rate_limits").select("*").eq("identifier", identifier).eq("endpoint", "supercharge").gte("window_start", oneDayAgo).single();

    if (rateData && rateData.request_count >= 50) {
      return new Response(JSON.stringify({ error: "rate_limit", message: "Daily supercharge limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (rateData) {
      await supabase.from("rate_limits").update({ request_count: rateData.request_count + 1 }).eq("id", rateData.id);
    } else {
      await supabase.from("rate_limits").upsert({ identifier, endpoint: "supercharge", request_count: 1, window_start: new Date().toISOString() }, { onConflict: "identifier,endpoint" });
    }

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "api_key_missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Claude
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: `Given this FAQ — Question: '${faq.question}', Answer: '${faq.answer}'.
Generate 8 natural language variations of the question that real users might type in a chatbot. Think about different phrasings, levels of formality, and levels of detail.
Return ONLY a valid JSON array of 8 strings. No explanation, no markdown, no code blocks. Just the raw JSON array.`,
        }],
      }),
    });

    const claudeData = await claudeResponse.json();
    const text = claudeData.content?.[0]?.text || "[]";

    let variations: string[];
    try {
      variations = JSON.parse(text);
      if (!Array.isArray(variations)) variations = [];
    } catch {
      variations = [];
    }

    // Save variations
    await supabase.from("faqs").update({ variations }).eq("id", faq_id);

    return new Response(JSON.stringify({ variations }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Supercharge error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
