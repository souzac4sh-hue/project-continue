import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { code, product_id } = body;

    // Input validation
    if (!code || typeof code !== "string" || code.length > 50) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid coupon code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!product_id || typeof product_id !== "string" || product_id.length > 100) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid product_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find coupon
    const { data: coupon, error } = await supabase
      .from("ninja_coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (error || !coupon) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check status
    if (coupon.status !== "active") {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon is no longer active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if used
    if (coupon.is_used || coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon already used" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (new Date(coupon.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("ninja_coupons")
        .update({ status: "expired" })
        .eq("id", coupon.id);

      return new Response(
        JSON.stringify({ valid: false, error: "Coupon expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check product restriction
    if (coupon.product_id && coupon.product_id !== product_id) {
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon not valid for this product" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valid! Return discount info (don't mark as used yet - that happens at payment)
    return new Response(
      JSON.stringify({
        valid: true,
        discount_percentage: coupon.discount_percentage,
        code: coupon.code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Validate ninja coupon error:", err);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
