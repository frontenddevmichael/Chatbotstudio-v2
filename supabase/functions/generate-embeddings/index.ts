import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/gemini.ts";

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
    const input = body?.input;
    const faqId = body?.faq_id;

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return jsonResponse({ error: "input_required" }, 400);
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

    // If updating a specific FAQ, verify the caller owns its chatbot
    if (faqId) {
      const { data: faq } = await supabase
        .from("faqs")
        .select("chatbot_id")
        .eq("id", faqId)
        .single();
      if (!faq) {
        return jsonResponse({ error: "faq_not_found" }, 404);
      }
      const { data: chatbot } = await supabase
        .from("chatbots")
        .select("user_id")
        .eq("id", faq.chatbot_id)
        .single();
      if (!chatbot || chatbot.user_id !== user.id) {
        return jsonResponse({ error: "forbidden" }, 403);
      }
    }

    // Try Gemini embeddings (768-dim), pad to match DB schema (1536-dim)
    const apiKey = Deno.env.get("AI_API_KEY");
    let embedding: number[] | null = null;

    if (apiKey) {
      try {
        const result = await generateEmbedding(apiKey, input.trim());
        if (result.length > 0) {
          // Gemini returns 768-dim embeddings; DB expects 1536-dim. Pad with zeros.
          embedding = [...result, ...new Array(1536 - result.length).fill(0)];
        } else {
          console.warn("Embedding API returned empty result");
        }
      } catch (err) {
        console.warn("Embedding API call failed:", err);
      }
    }

    if (faqId && embedding) {
      // Update the FAQ with the generated embedding
      await supabase
        .from("faqs")
        .update({ embedding } as any)
        .eq("id", faqId);
    }

    return jsonResponse({ embedding, faq_id: faqId || null });
  } catch (err) {
    console.error("generate-embeddings error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
