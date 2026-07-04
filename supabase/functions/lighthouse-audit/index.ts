import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { chatbot_id, url } = await req.json();
    if (!chatbot_id || !url) {
      return json({ error: "chatbot_id and url are required" }, 400);
    }

    const { data: chatbot, error: chatbotError } = await supabase
      .from("chatbots")
      .select("id, user_id")
      .eq("id", chatbot_id)
      .single();

    if (chatbotError || !chatbot) {
      return json({ error: "Chatbot not found" }, 404);
    }

    if (chatbot.user_id !== user.id) {
      return json({ error: "Forbidden" }, 403);
    }

    const apiKey = Deno.env.get("LIGHTHOUSE_PAGESPEED_API_KEY");
    if (!apiKey) {
      return json({
        error: "lighthouse_not_configured",
        message: "Lighthouse audits require a Google PageSpeed Insights API key. Set LIGHTHOUSE_PAGESPEED_API_KEY in edge function secrets.",
      }, 501);
    }

    const encodedUrl = encodeURIComponent(url);
    const categories = ["ACCESSIBILITY", "BEST_PRACTICES", "PERFORMANCE", "SEO"];
    const categoryParams = categories.map((c) => `category=${c}`).join("&");
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&key=${apiKey}&${categoryParams}`;

    const psiRes = await fetch(psiUrl);
    if (!psiRes.ok) {
      const errBody = await psiRes.text();
      console.error("PageSpeed API error:", psiRes.status, errBody);
      return json({ error: `PageSpeed API returned ${psiRes.status}` }, 502);
    }

    const psiData = await psiRes.json();
    const categories_ = psiData?.lighthouseResult?.categories || {};
    const score = (cat: string) => {
      const s = categories_[cat]?.score;
      return s !== undefined ? Math.round(s * 100) : null;
    };

    const scores = {
      performance: score("performance"),
      accessibility: score("accessibility"),
      best_practices: score("best-practices"),
      seo: score("seo"),
      pwa: null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("lighthouse_scores")
      .insert({
        chatbot_id,
        url,
        performance: scores.performance,
        accessibility: scores.accessibility,
        best_practices: scores.best_practices,
        seo: scores.seo,
        pwa: scores.pwa,
        score_json: psiData,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return json({ error: "Failed to save scores" }, 500);
    }

    return json(inserted);
  } catch (err) {
    console.error("lighthouse-audit error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
}

Deno.serve(handler);
export { handler };
