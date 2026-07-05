import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateContentWithTools, GeminiError } from "../_shared/gemini.ts";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return jsonError("Unauthorized", 401, "unauthorized");
    }
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return jsonError("Unauthorized", 401, "unauthorized");
    }

    // Per-IP rate limit: 10 generations per hour.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const { data: allowed, error: rlErr } = await supabase.rpc("check_and_increment_rate_limit", {
      _identifier: ip,
      _endpoint: "generate-faqs",
      _max_requests: 10,
      _window_seconds: 3600,
    });
    if (rlErr || allowed === false) {
      return jsonError("Rate limit exceeded. Please try again later.", 429, "rate_limit");
    }

    const aiKey = Deno.env.get("AI_API_KEY");
    const aiModel = Deno.env.get("AI_MODEL") || "gemini-2.5-flash";
    if (!aiKey) {
      return jsonError("AI service not configured", 500, "api_key_missing");
    }

    // Strip control chars, truncate to ~15k chars for token safety.
    let sanitized = '';
    for (const c of trimmed) {
      const code = c.charCodeAt(0);
      if (code === 0x09 || code === 0x0A || code === 0x0D || code >= 0x20) sanitized += c;
    }
    const truncated = sanitized.slice(0, 15000);

    const result = await generateContentWithTools(
      aiModel,
      aiKey,
      "You are an FAQ generator. Given a company document, extract 10-15 frequently asked questions and their concise answers.",
      [
        {
          role: "user",
          content: `Extract FAQs from this document:\n\n${truncated}`,
        },
      ],
      [
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
      { type: "function", function: { name: "generate_faqs" } },
    );

    if (result.toolCall?.args) {
      try {
        const parsed = JSON.parse(result.toolCall.args);
        const faqs = parsed.faqs;
        if (Array.isArray(faqs) && faqs.length > 0) {
          return new Response(JSON.stringify({ faqs }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // fall through to content fallback
      }
    }

    // Fallback: try content
    const content = result.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const faqs = JSON.parse(jsonMatch[0]);
        if (Array.isArray(faqs)) {
          return new Response(JSON.stringify({ faqs }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // fall through
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
