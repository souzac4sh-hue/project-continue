import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NINJA-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function pickDiscount(): number {
  // 92% chance for 5%, 8% chance for 10%
  return Math.random() < 0.08 ? 10 : 5;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { product_id, session_id, visitor_id } = body;

    // Input validation
    if (!product_id || typeof product_id !== "string" || product_id.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid product_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session_id || typeof session_id !== "string" || session_id.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!visitor_id || typeof visitor_id !== "string" || visitor_id.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid visitor_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Anti-abuse: Check if this session already has an active coupon
    const { data: existingSession } = await supabase
      .from("ninja_coupons")
      .select("id")
      .eq("session_id", session_id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .limit(1);

    if (existingSession && existingSession.length > 0) {
      return new Response(
        JSON.stringify({ error: "Already received a ninja reward this session" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Anti-abuse: Check visitor rate limit (max 3 per day)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentVisitor, error: countError } = await supabase
      .from("ninja_coupons")
      .select("id")
      .eq("visitor_id", visitor_id)
      .gte("created_at", dayAgo);

    if (!countError && recentVisitor && recentVisitor.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Daily ninja reward limit reached" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate the reward server-side
    const discount = pickDiscount();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    const { data: coupon, error: insertError } = await supabase
      .from("ninja_coupons")
      .insert({
        code,
        discount_percentage: discount,
        product_id,
        session_id,
        visitor_id,
        expires_at: expiresAt,
        status: "active",
        is_used: false,
        max_uses: 1,
        current_uses: 0,
      })
      .select("code, discount_percentage, expires_at")
      .single();

    if (insertError) {
      console.error("Failed to create ninja coupon:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reward" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        code: coupon.code,
        discount_percentage: coupon.discount_percentage,
        expires_at: coupon.expires_at,
        label: `${coupon.discount_percentage}% OFF`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Ninja coupon error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
