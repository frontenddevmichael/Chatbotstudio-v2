import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const secretHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Support both webhook calls (from Flutterwave) and client verification calls
    const isWebhook = req.headers.get("verif-hash") !== null;

    if (isWebhook) {
      // Webhook: Flutterwave sends event with verif-hash header
      const hash = req.headers.get("verif-hash");
      if (!secretHash) {
        return jsonResponse({ error: "webhook_not_configured" }, 500);
      }
      if (hash !== secretHash) {
        return jsonResponse({ error: "unauthorized" }, 401);
      }

      const event = await req.json();
      const { event: eventType, data } = event;

      // Log event
      await supabase.from("flutterwave_events").insert({
        event_type: eventType,
        transaction_id: String(data?.id || ""),
        tx_ref: String(data?.tx_ref || ""),
        amount: data?.amount ? Number(data.amount) : null,
        currency: data?.currency || null,
        status: data?.status || null,
        customer_email: data?.customer?.email || null,
        customer_name: data?.customer?.name || null,
        raw_body: event,
      });

      // Handle successful charge
      if (
        eventType === "charge.completed" &&
        data?.status === "successful"
      ) {
        await upgradeUser(supabase, String(data.customer?.email || ""), String(data.tx_ref || ""));
      }

      return jsonResponse({ received: true });
    }

    // Client verification: called from the billing page after successful payment
    const authHeader = req.headers.get("authorization") || "";
    const authMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!authMatch) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authMatch[1]);
    if (userError || !user) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    const body = await req.json();
    const { transaction_id, tx_ref, email } = body as Record<string, string>;

    if (!tx_ref || !email) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    // Verify with Flutterwave API
    const secretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!secretKey) {
      return jsonResponse({ error: "payment_not_configured" }, 500);
    }

    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    if (!verifyRes.ok) {
      return jsonResponse({ error: "verification_failed" }, 400);
    }

    const verifyData = await verifyRes.json();
    if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
      return jsonResponse({ error: "payment_not_confirmed" }, 400);
    }

    // Cross-verify: the email in the request must match the transaction's customer email
    const txEmail = verifyData.data?.customer?.email;
    if (!txEmail || txEmail.toLowerCase() !== email.toLowerCase()) {
      return jsonResponse({ error: "email_mismatch" }, 403);
    }

    // Log verification
    await supabase.from("flutterwave_events").insert({
      event_type: "client_verification",
      transaction_id: transaction_id || null,
      tx_ref: tx_ref || null,
      amount: verifyData.data?.amount ? Number(verifyData.data.amount) : null,
      currency: verifyData.data?.currency || null,
      status: "successful",
      customer_email: email,
      raw_body: verifyData,
    });

    await upgradeUser(supabase, email, tx_ref);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Flutterwave error:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
});

async function upgradeUser(
  supabase: ReturnType<typeof createClient>,
  email: string,
  txRef: string,
) {
  const { data: userData } = await supabase.auth.admin.getUserByEmail(email);
  const userId = userData?.user?.id;

  if (!userId) {
    console.error("User not found for email:", email);
    return;
  }

  await supabase
    .from("profiles")
    .update({
      plan: "premium",
      message_limit: 10000,
      payment_provider: "flutterwave",
      payment_status: "active",
      flutterwave_customer_id: txRef,
    })
    .eq("id", userId);
}
