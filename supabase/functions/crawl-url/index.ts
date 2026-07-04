import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || !url.trim()) {
      return json({ error: "url is required" }, 400);
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;

    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return json({ error: "Invalid protocol" }, 400);
    }

    // Block private/internal IP ranges (SSRF protection)
    const hostname = parsed.hostname;
    const isPrivate = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0$|\[::1\]$|localhost$)/i.test(hostname);
    if (isPrivate || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      return json({ error: "Cannot crawl internal or private URLs" }, 400);
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "ChatBotStudio-Crawler/1.0 (+https://chatbotstudio.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return json({ error: `Failed to fetch page (HTTP ${response.status})` }, 422);
    }

    // Do not follow redirects — re-validate each redirect target
    const redirectTarget = response.headers.get("location");
    if (redirectTarget) {
      try {
        const redirectUrl = new URL(redirectTarget, targetUrl);
        const redirectHost = redirectUrl.hostname;
        const isRedirectPrivate = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0$|\[::1\]$|localhost$)/i.test(redirectHost);
        if (isRedirectPrivate || redirectHost === "localhost" || redirectHost === "127.0.0.1" || redirectHost === "[::1]") {
          return json({ error: "Redirect target is a private or internal URL" }, 400);
        }
      } catch {
        return json({ error: "Invalid redirect URL" }, 400);
      }
    }

    const html = await response.text();

    // Parse HTML with Deno's native DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (!doc) return json({ error: "Failed to parse page HTML" }, 422);

    // Remove script, style, nav, footer, header, aside — non-content elements
    const removeSelectors = ["script", "style", "nav", "footer", "header", "aside", ".sidebar", ".menu", ".footer", ".header", "noscript", "svg", "form"];
    for (const sel of removeSelectors) {
      try { doc.querySelectorAll(sel).forEach((el) => el.remove()); } catch { /* skip */ }
    }

    // Extract text from content-bearing tags
    const contentTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th", "blockquote", "figcaption", "dt", "dd"];
    const texts: string[] = [];
    for (const tag of contentTags) {
      try {
        doc.querySelectorAll(tag).forEach((el) => {
          const text = (el.textContent || "").trim();
          if (text.length > 10) texts.push(text);
        });
      } catch { /* skip */ }
    }

    // Also grab meta description
    try {
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content");
      if (metaDesc && metaDesc.trim().length > 10) texts.unshift(metaDesc.trim());
    } catch { /* skip */ }

    if (texts.length === 0) {
      return json({ error: "Could not extract meaningful content from this page" }, 422);
    }

    // Join, clean whitespace, truncate
    let body = texts.join("\n\n")
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (body.length < 50) {
      return json({ error: "Page content is too short to generate FAQs" }, 422);
    }

    const maxLen = 30000;
    if (body.length > maxLen) body = body.slice(0, maxLen) + "...";

    // Extract page title for context
    let title = "";
    try { title = doc.querySelector("title")?.textContent?.trim() || ""; } catch { /* skip */ }

    return json({ text: body, title, url: targetUrl });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return json({ error: "Request timed out. The page took too long to respond." }, 408);
    }
    console.error("crawl-url error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
