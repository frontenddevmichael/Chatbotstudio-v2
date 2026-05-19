import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonError = (error: string, status: number, code?: string) =>
  new Response(JSON.stringify({ error, code }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { document_text?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400, "invalid_json");
    }
    const { document_text } = body;

    if (typeof document_text !== "string") {
      return jsonError("document_text must be a string", 400, "invalid_input");
    }
    const trimmed = document_text.trim();
    if (trimmed.length < 50) {
      return jsonError("Document text must be at least 50 characters.", 400, "too_short");
    }
    if (trimmed.length > 50000) {
      return jsonError("Document text must be 50 000 characters or fewer.", 400, "too_long");
    }

    // Per-IP rate limit: 10 generations per hour.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: allowed } = await supabase.rpc("check_and_increment_rate_limit", {
      _identifier: ip,
      _endpoint: "generate-faqs",
      _max_requests: 10,
      _window_seconds: 3600,
    });
    if (allowed === false) {
      return jsonError("Rate limit exceeded. Please try again later.", 429, "rate_limit");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return jsonError("AI service not configured", 500, "api_key_missing");
    }

    // Strip control chars, truncate to ~15k chars for token safety.
    const sanitized = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    const truncated = sanitized.slice(0, 15000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an FAQ generator. Given a company document, extract 10-15 frequently asked questions and their concise answers. Return ONLY a valid JSON array of objects with 'question' and 'answer' keys. No markdown, no explanation, just the JSON array.",
          },
          {
            role: "user",
            content: `Extract FAQs from this document:\n\n${truncated}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_faqs",
              description: "Return 10-15 FAQ pairs extracted from the document.",
              parameters: {
                type: "object",
                properties: {
                  faqs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["faqs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_faqs" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    const data = await aiResponse.json();

    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      const faqs = parsed.faqs;
      if (Array.isArray(faqs) && faqs.length > 0) {
        return new Response(JSON.stringify({ faqs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: try content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const faqs = JSON.parse(jsonMatch[0]);
      if (Array.isArray(faqs)) {
        return new Response(JSON.stringify({ faqs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: "Could not extract FAQs from this document. Try a more detailed document." }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-faqs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
