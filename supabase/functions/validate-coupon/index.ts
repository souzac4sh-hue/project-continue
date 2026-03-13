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
    const body = await req.json();
    const { code, productId } = body;

    // Input validation
    if (!code || typeof code !== "string" || code.length > 50) {
      return new Response(
        JSON.stringify({ valid: false, error: "Cupom inválido" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check regular coupons
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (!coupon) {
      // Also check ninja coupons
      const { data: ninjaCoupon } = await supabase
        .from("ninja_coupons")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("status", "active")
        .maybeSingle();

      if (!ninjaCoupon) {
        return new Response(
          JSON.stringify({ valid: false, error: "Cupom inválido" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate ninja coupon
      if (ninjaCoupon.is_used || ninjaCoupon.current_uses >= ninjaCoupon.max_uses) {
        return new Response(
          JSON.stringify({ valid: false, error: "Cupom já utilizado" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (new Date(ninjaCoupon.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: "Cupom expirado" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (ninjaCoupon.product_id && productId && ninjaCoupon.product_id !== productId) {
        return new Response(
          JSON.stringify({ valid: false, error: "Cupom não válido para este produto" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          discount_type: "percentage",
          discount_value: ninjaCoupon.discount_percentage,
          code: ninjaCoupon.code,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate regular coupon
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "Cupom expirado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return new Response(
        JSON.stringify({ valid: false, error: "Cupom esgotado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        code: coupon.code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Validate coupon error:", err);
    return new Response(
      JSON.stringify({ valid: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
