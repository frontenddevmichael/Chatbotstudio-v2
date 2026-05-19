import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const ADMIN_SECRET = "Studio@Admin2026!";

// Constant-time string comparison to mitigate timing attacks on the admin secret.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const jsonError = (error: string, status: number, code?: string) =>
  new Response(JSON.stringify({ error, code }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("x-admin-secret") ?? "";
    if (!safeEqual(authHeader, ADMIN_SECRET)) {
      return jsonError("Unauthorized", 401, "unauthorized");
    }

    let body: { action?: unknown; payload?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400, "invalid_json");
    }
    const { action, payload } = body;

    if (typeof action !== "string" || action.length === 0 || action.length > 64) {
      return jsonError("Missing or invalid action", 400, "invalid_action");
    }
    if (payload !== undefined && (typeof payload !== "object" || payload === null || Array.isArray(payload))) {
      return jsonError("Invalid payload", 400, "invalid_payload");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let result: unknown = null;

    switch (action) {
      case "get-stats": {
        const [
          { count: userCount },
          { count: botCount },
          { count: convoCount },
          { count: waitlistCount },
          { count: faqCount },
          { data: settings },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("chatbots").select("*", { count: "exact", head: true }),
          supabase.from("conversations").select("*", { count: "exact", head: true }),
          supabase.from("waitlist").select("*", { count: "exact", head: true }),
          supabase.from("faqs").select("*", { count: "exact", head: true }),
          supabase.from("platform_settings").select("*").single(),
        ]);
        const { count: premiumCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("plan", "premium");
        const revenue = (premiumCount ?? 0) * (settings?.premium_price_monthly ?? 19.99);
        result = {
          userCount: userCount ?? 0,
          botCount: botCount ?? 0,
          convoCount: convoCount ?? 0,
          waitlistCount: waitlistCount ?? 0,
          faqCount: faqCount ?? 0,
          premiumCount: premiumCount ?? 0,
          revenue,
          settings,
        };
        break;
      }

      case "get-delta-stats": {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

        const [
          { count: usersThisWeek },
          { count: usersLastWeek },
          { count: botsThisWeek },
          { count: botsLastWeek },
          { count: convosThisWeek },
          { count: convosLastWeek },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
          supabase.from("chatbots").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.from("chatbots").select("*", { count: "exact", head: true }).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
          supabase.from("conversations").select("*", { count: "exact", head: true }).gte("started_at", weekAgo),
          supabase.from("conversations").select("*", { count: "exact", head: true }).gte("started_at", twoWeeksAgo).lt("started_at", weekAgo),
        ]);

        result = {
          usersThisWeek: usersThisWeek ?? 0,
          usersLastWeek: usersLastWeek ?? 0,
          botsThisWeek: botsThisWeek ?? 0,
          botsLastWeek: botsLastWeek ?? 0,
          convosThisWeek: convosThisWeek ?? 0,
          convosLastWeek: convosLastWeek ?? 0,
        };
        break;
      }

      case "get-activity-feed": {
        const [
          { data: recentUsers },
          { data: recentBots },
          { data: recentConvos },
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("chatbots").select("id, name, avatar_emoji, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("conversations").select("id, chatbot_id, started_at").order("started_at", { ascending: false }).limit(5),
        ]);

        const feed: any[] = [];
        (recentUsers ?? []).forEach((u: any) => feed.push({ type: 'signup', label: u.full_name || 'New user', time: u.created_at }));
        (recentBots ?? []).forEach((b: any) => feed.push({ type: 'bot', label: `${b.avatar_emoji || '🤖'} ${b.name}`, time: b.created_at }));
        (recentConvos ?? []).forEach((c: any) => feed.push({ type: 'conversation', label: 'New conversation', time: c.started_at }));
        feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        result = feed.slice(0, 10);
        break;
      }

      case "get-signup-chart": {
        const { data } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", payload?.since)
          .order("created_at");
        result = data ?? [];
        break;
      }

      case "get-convo-chart": {
        const { data } = await supabase
          .from("conversations")
          .select("started_at")
          .gte("started_at", payload?.since)
          .order("started_at");
        result = data ?? [];
        break;
      }

      case "get-recent-users": {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8);
        result = data ?? [];
        break;
      }

      case "get-active-bots": {
        const { data } = await supabase
          .from("chatbots")
          .select("*")
          .order("total_conversations", { ascending: false })
          .limit(5);
        result = data ?? [];
        break;
      }

      case "get-users": {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap: Record<string, string> = {};
        (authData?.users ?? []).forEach((u: any) => {
          emailMap[u.id] = u.email ?? "";
        });
        result = (profiles ?? []).map((p: any) => ({ ...p, email: emailMap[p.id] ?? "" }));
        break;
      }

      case "get-roles": {
        const { data } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .eq("role", "admin");
        result = (data ?? []).map((r: any) => r.user_id);
        break;
      }

      case "get-bot-counts": {
        const { data } = await supabase.from("chatbots").select("user_id");
        const counts: Record<string, number> = {};
        (data ?? []).forEach((b: any) => {
          counts[b.user_id] = (counts[b.user_id] ?? 0) + 1;
        });
        result = counts;
        break;
      }

      case "get-chatbots": {
        const { data } = await supabase
          .from("chatbots")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        result = data ?? [];
        break;
      }

      case "get-owners": {
        const { data } = await supabase.from("profiles").select("id, full_name");
        const map: Record<string, string> = {};
        (data ?? []).forEach((p: any) => {
          map[p.id] = p.full_name || "Unnamed";
        });
        result = map;
        break;
      }

      case "get-faq-counts": {
        const { data } = await supabase.from("faqs").select("chatbot_id");
        const counts: Record<string, number> = {};
        (data ?? []).forEach((f: any) => {
          counts[f.chatbot_id] = (counts[f.chatbot_id] ?? 0) + 1;
        });
        result = counts;
        break;
      }

      case "get-conversations": {
        const { data } = await supabase
          .from("conversations")
          .select("*")
          .order("last_message_at", { ascending: false })
          .limit(200);
        result = data ?? [];
        break;
      }

      case "get-chatbot-map": {
        const { data } = await supabase.from("chatbots").select("id, name, avatar_emoji");
        const map: Record<string, { name: string; emoji: string }> = {};
        (data ?? []).forEach((b: any) => {
          map[b.id] = { name: b.name, emoji: b.avatar_emoji };
        });
        result = map;
        break;
      }

      case "get-ads": {
        const { data } = await supabase
          .from("ads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        result = data ?? [];
        break;
      }

      case "get-settings": {
        const { data } = await supabase.from("platform_settings").select("*").single();
        result = data;
        break;
      }

      case "update-settings": {
        const { error } = await supabase
          .from("platform_settings")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", 1);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "toggle-maintenance": {
        const { data: current } = await supabase
          .from("platform_settings")
          .select("maintenance_mode")
          .single();
        const { error } = await supabase
          .from("platform_settings")
          .update({ maintenance_mode: !(current?.maintenance_mode ?? false) })
          .eq("id", 1);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "toggle-plan": {
        const { id, plan } = payload;
        const newPlan = plan === "premium" ? "free" : "premium";
        const newLimit = newPlan === "premium" ? 10000 : 500;
        const { error } = await supabase
          .from("profiles")
          .update({ plan: newPlan, message_limit: newLimit })
          .eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "bulk-toggle-plan": {
        const { ids, targetPlan } = payload;
        const newLimit = targetPlan === "premium" ? 10000 : 500;
        const { error } = await supabase
          .from("profiles")
          .update({ plan: targetPlan, message_limit: newLimit })
          .in("id", ids);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "toggle-bot-active": {
        const { id, is_active } = payload;
        const { error } = await supabase
          .from("chatbots")
          .update({ is_active: !is_active })
          .eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "toggle-admin-role": {
        const { id, isAdmin } = payload;
        if (isAdmin) {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", id)
            .eq("role", "admin");
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: id, role: "admin" });
          if (error) throw error;
        }
        result = { ok: true };
        break;
      }

      case "reset-user-messages": {
        const { id } = payload;
        const { error } = await supabase
          .from("profiles")
          .update({ monthly_message_count: 0 })
          .eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "reset-all-messages": {
        const { error } = await supabase
          .from("profiles")
          .update({ monthly_message_count: 0 })
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "delete-chatbot": {
        const { id } = payload;
        await supabase.from("faqs").delete().eq("chatbot_id", id);
        await supabase.from("conversations").delete().eq("chatbot_id", id);
        const { error } = await supabase.from("chatbots").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "delete-conversation": {
        const { id } = payload;
        const { error } = await supabase.from("conversations").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "purge-old-conversations": {
        const { olderThanDays } = payload;
        const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase.from("conversations").delete().lt("last_message_at", cutoff);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "create-ad": {
        const { error } = await supabase.from("ads").insert(payload);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "delete-ad": {
        const { error } = await supabase.from("ads").delete().eq("id", payload.id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "toggle-ad": {
        const { id, is_active } = payload;
        const { error } = await supabase
          .from("ads")
          .update({ is_active: !is_active })
          .eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      case "delete-user": {
        const userId = payload.id;
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) throw error;
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) console.error("Auth delete error:", authError);
        result = { ok: true };
        break;
      }

      case "get-waitlist": {
        const { data } = await supabase
          .from("waitlist")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        result = data ?? [];
        break;
      }

      case "delete-waitlist-entry": {
        const { id } = payload;
        const { error } = await supabase.from("waitlist").delete().eq("id", id);
        if (error) throw error;
        result = { ok: true };
        break;
      }

      default:
        return jsonError(`Unknown action: ${action}`, 400, "unknown_action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Admin data error:", err);
    return jsonError(err instanceof Error ? err.message : "Internal error", 500, "internal_error");
  }
});