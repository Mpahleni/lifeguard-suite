import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!TWILIO_API_KEY) {
    return new Response(JSON.stringify({ error: "TWILIO_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { type, fromNumber } = await req.json();

    // Validate input
    if (!type || !["payment_due", "policy_renewal", "manual"].includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid reminder type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!fromNumber) {
      return new Response(JSON.stringify({ error: "fromNumber is required (your Twilio number)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let recipients: { phone: string; message: string }[] = [];

    if (type === "payment_due") {
      // Find payments due in the next 7 days that are pending/overdue
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: payments, error } = await supabase
        .from("payments")
        .select(`*, policies(policy_number, clients(full_name, phone))`)
        .in("status", ["pending", "overdue"])
        .lte("due_date", sevenDaysFromNow.toISOString().split("T")[0])
        .order("due_date", { ascending: true });

      if (error) throw error;

      recipients = (payments || [])
        .filter((p: any) => p.policies?.clients?.phone)
        .map((p: any) => ({
          phone: p.policies.clients.phone,
          message: `Hi ${p.policies.clients.full_name}, your payment of R${p.amount} for policy ${p.policies.policy_number} is due on ${p.due_date}. Please ensure timely payment. Ref: ${p.reference || "N/A"}`,
        }));
    } else if (type === "policy_renewal") {
      // Find active policies with next_payment_date in the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: policies, error } = await supabase
        .from("policies")
        .select(`*, clients(full_name, phone)`)
        .eq("status", "active")
        .not("next_payment_date", "is", null)
        .lte("next_payment_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .order("next_payment_date", { ascending: true });

      if (error) throw error;

      recipients = (policies || [])
        .filter((p: any) => p.clients?.phone)
        .map((p: any) => ({
          phone: p.clients.phone,
          message: `Hi ${p.clients.full_name}, your policy ${p.policy_number} renewal is coming up on ${p.next_payment_date}. Premium: R${p.premium_amount}. Please contact us for any queries.`,
        }));
    }

    // Send SMS to each recipient
    const results = [];
    for (const r of recipients) {
      try {
        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: r.phone,
            From: fromNumber,
            Body: r.message,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          results.push({ phone: r.phone, success: false, error: data.message || "Failed" });
        } else {
          results.push({ phone: r.phone, success: true, sid: data.sid });
        }
      } catch (err: any) {
        results.push({ phone: r.phone, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({
      type,
      totalRecipients: recipients.length,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-sms-reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
