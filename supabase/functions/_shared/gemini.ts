const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function geminiUrl(model: string, apiKey: string): string {
  return `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;
}

function geminiEmbedUrl(apiKey: string): string {
  return `${GEMINI_BASE}/models/text-embedding-004:embedContent?key=${apiKey}`;
}

function convertMessages(messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>) {
  const contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];
  for (const msg of messages) {
    if (msg.role === "system") continue;
    const role = msg.role === "assistant" ? "model" : "user";
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        const p = part as Record<string, unknown>;
        if (p.type === "text") {
          parts.push({ text: String(p.text) });
        } else if (p.type === "image_url") {
          const url = String((p.image_url as Record<string, unknown>)?.url || "");
          if (url.startsWith("data:image/")) {
            const comma = url.indexOf(",");
            const mimeType = url.substring(5, comma).split(";")[0];
            const data = url.substring(comma + 1);
            parts.push({ inlineData: { mimeType, data } });
          }
        }
      }
    }
    contents.push({ role, parts });
  }
  return contents;
}

function convertTools(tools: Array<Record<string, unknown>>) {
  const functionDeclarations: Array<Record<string, unknown>> = [];
  for (const tool of tools) {
    if (tool.type === "function") {
      const fn = tool.function as Record<string, unknown>;
      functionDeclarations.push({
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
      });
    }
  }
  if (functionDeclarations.length === 0) return undefined;
  return [{ functionDeclarations }];
}

function normalizeModel(model: string): string {
  return model.replace(/^google\//, "").replace(/^openrouter\//, "");
}

export async function generateContent(
  model: string,
  apiKey: string,
  systemPrompt: string | null,
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>,
  temperature?: number,
  maxOutputTokens = 512,
): Promise<string> {
  model = normalizeModel(model);
  const body: Record<string, unknown> = {
    contents: convertMessages(messages),
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  body.generationConfig = {
    temperature: temperature ?? 0.7,
    maxOutputTokens,
    topP: 0.95,
    topK: 40,
  };

  const res = await fetch(geminiUrl(model, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new GeminiError(res.status, errText);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

export async function generateContentWithTools(
  model: string,
  apiKey: string,
  systemPrompt: string | null,
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>,
  tools: Array<Record<string, unknown>>,
  toolChoice?: { type: string; function?: { name: string } },
): Promise<{ content?: string; toolCall?: { name: string; args: string } }> {
  model = normalizeModel(model);
  const body: Record<string, unknown> = {
    contents: convertMessages(messages),
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  const convertedTools = convertTools(tools);
  if (convertedTools) {
    body.tools = convertedTools;
  }
  if (toolChoice?.function?.name) {
    body.toolConfig = {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: [toolChoice.function.name],
      },
    };
  }

  const res = await fetch(geminiUrl(model, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new GeminiError(res.status, errText);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0]?.content;

  if (candidate?.parts?.[0]?.functionCall) {
    const fc = candidate.parts[0].functionCall;
    return {
      toolCall: {
        name: fc.name,
        args: JSON.stringify(fc.args),
      },
    };
  }

  const text = candidate?.parts?.[0]?.text || "";
  return { content: text };
}

export async function generateEmbedding(apiKey: string, text: string): Promise<number[]> {
  const res = await fetch(geminiEmbedUrl(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: text.slice(0, 8000) }] },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini embedding error:", res.status, errText);
    return [];
  }

  const data = await res.json();
  return data?.embedding?.values || [];
}

export class GeminiError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`Gemini API error (${status}): ${body}`);
    this.status = status;
    this.name = "GeminiError";
  }
}
