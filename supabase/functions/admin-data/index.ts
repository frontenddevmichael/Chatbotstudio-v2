import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const ADMIN_SECRET = "Studio@Admin2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("x-admin-secret");
    if (authHeader !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, payload } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let result: any = null;

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
        // Fetch emails from auth
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
        // Delete profile (cascading will handle related data via FK)
        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) throw error;
        // Also delete from auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) console.error("Auth delete error:", authError);
        result = { ok: true };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Admin data error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
