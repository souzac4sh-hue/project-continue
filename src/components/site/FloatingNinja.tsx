import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Config (future: load from admin/store context) ─── */
const ninjaConfig = {
  enabled: true,
  spawnChance: 0.6,
  escapeChance: 0.5,
  cooldownMinutes: 10,
  delayMin: 5,
  delayMax: 15,
  moveIntervalMin: 3000,
  moveIntervalMax: 6000,
  phraseIntervalMin: 4000,
  phraseIntervalMax: 8000,
  couponDurationSeconds: 300,
};

const COOLDOWN_KEY = "floating_ninja_cooldown";
const VISITOR_KEY = "ninja_visitor_id";

const PHRASES = [
  '🥷 "Clique rápido!"',
  '🥷 "Desconto escondido..."',
  '🥷 "Hoje tem promoção."',
  '🥷 "Será que você consegue me pegar?"',
  '🥷 "Sou rápido demais!"',
  '🥷 "Cupom secreto comigo..."',
];

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("ninja_session_id");
  if (!id) {
    id = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
    sessionStorage.setItem("ninja_session_id", id);
  }
  return id;
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type NinjaPhase = "waiting" | "active" | "escaped" | "captured" | "reward" | "cooldown";

export default function FloatingNinja() {
  const [phase, setPhase] = useState<NinjaPhase>("waiting");
  const [posX, setPosX] = useState(window.innerWidth - 110);
  const [posY] = useState(window.innerHeight - 180);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [escapeBubble, setEscapeBubble] = useState(false);
  const [reward, setReward] = useState<{ code: string; discount: number; expiresAt: string } | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(ninjaConfig.couponDurationSeconds);

  const mountedRef = useRef(true);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phraseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dodgeCountRef = useRef(0);

  // ─── Spawn logic ───
  useEffect(() => {
    mountedRef.current = true;
    if (!ninjaConfig.enabled) return;

    // Check cooldown
    const lastCapture = parseInt(localStorage.getItem(COOLDOWN_KEY) || "0", 10);
    const cooldownMs = ninjaConfig.cooldownMinutes * 60 * 1000;
    if (Date.now() - lastCapture < cooldownMs) {
      setPhase("cooldown");
      return;
    }

    // Spawn chance (bypass with ?ninja=1)
    const urlParams = new URLSearchParams(window.location.search);
    const forceNinja = urlParams.get("ninja") === "1";
    if (!forceNinja && Math.random() > ninjaConfig.spawnChance) {
      setPhase("cooldown");
      return;
    }

    // Random delay before appearing
    const delay = forceNinja
      ? 800
      : randBetween(ninjaConfig.delayMin * 1000, ninjaConfig.delayMax * 1000);

    const spawnTimer = setTimeout(() => {
      if (mountedRef.current) setPhase("active");
    }, delay);

    return () => {
      mountedRef.current = false;
      clearTimeout(spawnTimer);
    };
  }, []);

  // ─── Movement loop ───
  useEffect(() => {
    if (phase !== "active") return;

    const move = () => {
      const vw = window.innerWidth;
      const newX = randBetween(vw * 0.05, vw * 0.85);
      setPosX(newX);

      const nextDelay = randBetween(ninjaConfig.moveIntervalMin, ninjaConfig.moveIntervalMax);
      moveTimerRef.current = setTimeout(move, nextDelay);
    };

    const initialDelay = randBetween(ninjaConfig.moveIntervalMin, ninjaConfig.moveIntervalMax);
    moveTimerRef.current = setTimeout(move, initialDelay);

    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [phase]);

  // ─── Phrase loop ───
  useEffect(() => {
    if (phase !== "active") return;

    const showPhrase = () => {
      const p = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      setPhrase(p);
      setTimeout(() => {
        if (mountedRef.current) setPhrase(null);
      }, 2000);

      const nextDelay = randBetween(ninjaConfig.phraseIntervalMin, ninjaConfig.phraseIntervalMax);
      phraseTimerRef.current = setTimeout(showPhrase, nextDelay);
    };

    // First phrase after 2s
    phraseTimerRef.current = setTimeout(showPhrase, 2000);

    return () => {
      if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current);
    };
  }, [phase]);

  // ─── Reward countdown ───
  useEffect(() => {
    if (phase !== "reward" || !reward) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("cooldown");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, reward]);

  // ─── Generate coupon via backend ───
  const generateCoupon = useCallback(async () => {
    setRewardLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ninja-coupon", {
        body: {
          product_id: "general",
          session_id: getSessionId(),
          visitor_id: getVisitorId(),
        },
      });

      if (error || !data?.code) {
        // Fallback mock (same 92/8 distribution)
        const discount = Math.random() < 0.08 ? 10 : 5;
        setReward({
          code: `NINJA${discount}`,
          discount,
          expiresAt: new Date(Date.now() + ninjaConfig.couponDurationSeconds * 1000).toISOString(),
          isRare: discount === 10,
        });
      } else {
        setReward({
          code: data.code,
          discount: data.discount_percentage,
          expiresAt: data.expires_at,
          isRare: data.discount_percentage === 10,
        });
      }
    } catch {
      const discount = Math.random() < 0.08 ? 10 : 5;
      setReward({
        code: `NINJA${discount}`,
        discount,
        expiresAt: new Date(Date.now() + ninjaConfig.couponDurationSeconds * 1000).toISOString(),
        isRare: discount === 10,
      });
    } finally {
      setRewardLoading(false);
      setCountdown(ninjaConfig.couponDurationSeconds);
      setPhase("reward");
    }
  }, []);

  // ─── Click handler (dodge or capture) ───
  const handleClick = useCallback(() => {
    if (phase !== "active") return;

    // First 2 clicks: 50% chance to escape
    if (dodgeCountRef.current < 2 && Math.random() < ninjaConfig.escapeChance) {
      dodgeCountRef.current++;
      // Dodge to a random position
      const vw = window.innerWidth;
      setPosX(randBetween(vw * 0.05, vw * 0.85));
      setEscapeBubble(true);
      setTimeout(() => setEscapeBubble(false), 1500);
      return;
    }

    // Captured!
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current);
    setPhrase(null);

    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setPhase("captured");

    // Generate coupon after capture animation
    setTimeout(() => {
      generateCoupon();
    }, 600);
  }, [phase, generateCoupon]);

  const handleCopy = () => {
    if (!reward) return;
    navigator.clipboard.writeText(reward.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Don't render anything during cooldown/waiting
  if (phase === "cooldown") return null;
  if (phase === "waiting") return null;

  return (
    <>
      {/* ─── Active Ninja ─── */}
      {(phase === "active" || phase === "captured") && (
        <div
          style={{
            position: "fixed",
            left: posX,
            bottom: 90,
            width: 90,
            height: 90,
            zIndex: 999999,
            cursor: phase === "active" ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "radial-gradient(circle, #1e3a8a 0%, #020617 70%)",
            boxShadow: "0 0 25px rgba(59,130,246,0.9)",
            border: "2px solid rgba(96,165,250,0.9)",
            transition: "left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s, transform 0.3s",
            opacity: phase === "captured" ? 0 : 1,
            transform: phase === "captured" ? "scale(0.2) rotate(720deg)" : "scale(1)",
            animation: phase === "active" ? "ninjaFloat 2s ease-in-out infinite" : undefined,
          }}
          onClick={handleClick}
        >
          <div
            style={{
              fontSize: 42,
              filter: "drop-shadow(0 0 10px rgba(96,165,250,0.9))",
              transition: "transform 0.15s",
            }}
          >
            🥷
          </div>
        </div>
      )}

      {/* ─── Phrase bubble ─── */}
      {phase === "active" && phrase && (
        <div
          style={{
            position: "fixed",
            left: posX - 30,
            bottom: 190,
            zIndex: 999999,
            background: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(30,58,138,0.85))",
            border: "1px solid rgba(96,165,250,0.5)",
            borderRadius: 12,
            padding: "8px 14px",
            maxWidth: 200,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(191,219,254,1)",
            boxShadow: "0 0 16px rgba(59,130,246,0.3)",
            whiteSpace: "nowrap",
            animation: "ninjaBubbleIn 0.2s ease-out",
            pointerEvents: "none",
          }}
        >
          {phrase}
          <div
            style={{
              position: "absolute",
              bottom: -6,
              left: 40,
              width: 12,
              height: 12,
              background: "rgba(2,6,23,0.95)",
              border: "1px solid rgba(96,165,250,0.5)",
              borderTop: "none",
              borderLeft: "none",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}

      {/* ─── Escape bubble ─── */}
      {escapeBubble && (
        <div
          style={{
            position: "fixed",
            left: posX - 20,
            bottom: 190,
            zIndex: 999999,
            background: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(30,58,138,0.85))",
            border: "1px solid rgba(251,191,36,0.5)",
            borderRadius: 12,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(253,224,71,1)",
            boxShadow: "0 0 16px rgba(251,191,36,0.3)",
            whiteSpace: "nowrap",
            animation: "ninjaBubbleIn 0.2s ease-out",
            pointerEvents: "none",
          }}
        >
          🥷 Você quase me pegou!
        </div>
      )}

      {/* ─── Reward popup ─── */}
      {phase === "reward" && reward && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            animation: "ninjaBubbleIn 0.3s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPhase("cooldown");
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, hsl(220 20% 8%), hsl(220 15% 12%))",
              border: "1px solid rgba(96,165,250,0.4)",
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 340,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 0 60px rgba(59,130,246,0.2), 0 20px 60px rgba(0,0,0,0.5)",
              position: "relative",
              overflow: "hidden",
              animation: "rewardPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Decorative glow */}
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(59,130,246,0.12), transparent)",
                pointerEvents: "none",
              }}
            />

            {/* Close */}
            <button
              onClick={() => setPhase("cooldown")}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid rgba(148,163,184,0.3)",
                background: "transparent",
                color: "rgba(148,163,184,0.7)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              ✕
            </button>

            {/* Ninja icon */}
            <div
              style={{
                width: 70,
                height: 70,
                margin: "0 auto 16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
                border: "1px solid rgba(96,165,250,0.3)",
                boxShadow: "0 0 24px rgba(59,130,246,0.25)",
                fontSize: 36,
                animation: "rewardSpin 0.6s ease-out",
              }}
            >
              {rewardLoading ? "⏳" : "🥷"}
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "rgba(241,245,249,1)",
                margin: "0 0 4px",
              }}
            >
              {rewardLoading ? "Gerando recompensa..." : "Ninja capturado!"}
            </h3>

            {!rewardLoading && (
              <>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(148,163,184,1)",
                    margin: "0 0 16px",
                  }}
                >
                  Cupom secreto desbloqueado!
                </p>

                {/* Discount badge */}
                <div
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "4px 16px",
                    borderRadius: 999,
                    color: "rgba(147,197,253,1)",
                    background: "rgba(59,130,246,0.12)",
                    border: "1px solid rgba(96,165,250,0.25)",
                    marginBottom: 12,
                  }}
                >
                  {reward.discount}% OFF
                </div>

                {/* Coupon code */}
                <div
                  style={{
                    background: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(96,165,250,0.2)",
                    borderRadius: 14,
                    padding: "14px 20px",
                    fontFamily: "monospace",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "0.12em",
                    color: "rgba(191,219,254,1)",
                    marginBottom: 8,
                  }}
                >
                  {reward.code}
                </div>

                {/* Timer */}
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(148,163,184,0.8)",
                    margin: "0 0 16px",
                  }}
                >
                  ⏱ Válido por {formatTime(countdown)}
                </p>

                {/* Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    onClick={handleCopy}
                    style={{
                      width: "100%",
                      padding: "12px 20px",
                      borderRadius: 14,
                      border: "none",
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: "pointer",
                      color: "#fff",
                      background: "linear-gradient(135deg, hsl(200 100% 50%), hsl(200 100% 38%))",
                      boxShadow: "0 0 20px rgba(59,130,246,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {copied ? "✓ Código copiado!" : "📋 Copiar código"}
                  </button>

                  <button
                    onClick={() => {
                      handleCopy();
                      setPhase("cooldown");
                      window.location.href = "/checkout";
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 20px",
                      borderRadius: 14,
                      border: "1px solid rgba(96,165,250,0.3)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      color: "rgba(147,197,253,1)",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "background 0.15s",
                    }}
                  >
                    🛒 Usar agora
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Keyframes ─── */}
      <style>{`
        @keyframes ninjaFloat {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.04); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes ninjaBubbleIn {
          from { opacity: 0; transform: scale(0.9) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rewardPopIn {
          from { opacity: 0; transform: scale(0.7) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rewardSpin {
          from { transform: scale(0) rotate(-180deg); }
          to { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </>
  );
}
