import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { supabase } from '@/integrations/supabase/client';

const COOLDOWN_KEY = 'ninja3d_cooldown_ts';
const SESSION_KEY = 'ninja3d_session_done';
const VISITOR_KEY = 'ninja_visitor_id';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('ninja_session_id');
  if (!id) {
    id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
    sessionStorage.setItem('ninja_session_id', id);
  }
  return id;
}

/* ─── CSS Cyber Ninja (fake 3D, always renders) ─── */
function CSSNinja({ size, idle, dodging }: { size: number; idle?: boolean; dodging?: boolean }) {
  return (
    <div
      style={{ width: size, height: size, position: 'relative', userSelect: 'none' }}
      className="pointer-events-none"
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(18,181,255,0.25) 0%, transparent 70%)',
          filter: 'blur(8px)',
          transform: 'scale(1.4)',
        }}
      />

      {/* Body container with perspective */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: '200px',
          animation: idle ? 'ninja-float 2.5s ease-in-out infinite' : undefined,
        }}
      >
        <div
          style={{
            width: size * 0.6,
            height: size * 0.85,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: dodging ? 'rotateY(180deg) scale(1.1)' : 'rotateY(0deg)',
            transition: dodging ? 'transform 0.3s ease-out' : 'transform 0.6s ease',
          }}
        >
          {/* Head */}
          <div
            className="absolute rounded-full"
            style={{
              width: size * 0.32,
              height: size * 0.32,
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, hsl(220 15% 12%) 0%, hsl(220 20% 8%) 100%)',
              boxShadow: '0 0 12px rgba(18,181,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.5)',
              border: '1px solid rgba(18,181,255,0.15)',
            }}
          >
            {/* Eyes */}
            <div className="absolute flex gap-1" style={{ top: '45%', left: '50%', transform: 'translateX(-50%)' }}>
              <div
                className="rounded-full"
                style={{
                  width: size * 0.06,
                  height: size * 0.035,
                  background: 'hsl(200 100% 75%)',
                  boxShadow: '0 0 8px rgba(18,181,255,0.8), 0 0 16px rgba(18,181,255,0.4)',
                }}
              />
              <div style={{ width: size * 0.04 }} />
              <div
                className="rounded-full"
                style={{
                  width: size * 0.06,
                  height: size * 0.035,
                  background: 'hsl(200 100% 75%)',
                  boxShadow: '0 0 8px rgba(18,181,255,0.8), 0 0 16px rgba(18,181,255,0.4)',
                }}
              />
            </div>
            {/* Headband */}
            <div
              className="absolute"
              style={{
                width: '120%',
                height: size * 0.04,
                top: '35%',
                left: '-10%',
                background: 'linear-gradient(90deg, transparent 0%, hsl(200 100% 50%) 20%, hsl(200 100% 50%) 80%, transparent 100%)',
                boxShadow: '0 0 10px rgba(18,181,255,0.5)',
                borderRadius: 2,
              }}
            />
            {/* Headband tails */}
            <div
              className="absolute"
              style={{
                width: size * 0.18,
                height: size * 0.03,
                top: '36%',
                right: -size * 0.15,
                background: 'hsl(200 100% 50%)',
                borderRadius: '0 4px 4px 0',
                boxShadow: '0 0 6px rgba(18,181,255,0.4)',
                transform: 'rotate(-15deg)',
                transformOrigin: 'left center',
                animation: idle ? 'ninja-tail 2s ease-in-out infinite' : undefined,
              }}
            />
            <div
              className="absolute"
              style={{
                width: size * 0.12,
                height: size * 0.025,
                top: '42%',
                right: -size * 0.1,
                background: 'hsl(200 100% 45%)',
                borderRadius: '0 3px 3px 0',
                boxShadow: '0 0 4px rgba(18,181,255,0.3)',
                transform: 'rotate(-25deg)',
                transformOrigin: 'left center',
                animation: idle ? 'ninja-tail 2s ease-in-out infinite 0.15s' : undefined,
              }}
            />
          </div>

          {/* Torso */}
          <div
            className="absolute"
            style={{
              width: size * 0.35,
              height: size * 0.3,
              top: size * 0.28,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, hsl(220 15% 10%) 0%, hsl(220 20% 7%) 100%)',
              borderRadius: '4px 4px 2px 2px',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
              border: '1px solid rgba(18,181,255,0.1)',
            }}
          >
            {/* Chest stripe */}
            <div
              className="absolute"
              style={{
                width: 2,
                height: '80%',
                top: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(180deg, hsl(200 100% 50%), transparent)',
                boxShadow: '0 0 6px rgba(18,181,255,0.4)',
              }}
            />
            {/* Belt */}
            <div
              className="absolute"
              style={{
                width: '110%',
                height: size * 0.04,
                bottom: 0,
                left: '-5%',
                background: 'hsl(220 20% 14%)',
                borderRadius: 2,
                boxShadow: '0 0 4px rgba(18,181,255,0.2)',
              }}
            >
              <div
                className="absolute"
                style={{
                  width: size * 0.05,
                  height: size * 0.05,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  background: 'hsl(200 100% 50%)',
                  boxShadow: '0 0 8px rgba(18,181,255,0.6)',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Arms */}
          <div
            className="absolute"
            style={{
              width: size * 0.1,
              height: size * 0.25,
              top: size * 0.3,
              left: -size * 0.02,
              background: 'linear-gradient(180deg, hsl(220 15% 11%) 0%, hsl(220 15% 8%) 100%)',
              borderRadius: '4px 4px 6px 6px',
              transform: idle ? 'rotate(8deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s ease',
              transformOrigin: 'top center',
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)',
            }}
          />
          <div
            className="absolute"
            style={{
              width: size * 0.1,
              height: size * 0.25,
              top: size * 0.3,
              right: -size * 0.02,
              background: 'linear-gradient(180deg, hsl(220 15% 11%) 0%, hsl(220 15% 8%) 100%)',
              borderRadius: '4px 4px 6px 6px',
              transform: idle ? 'rotate(-8deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s ease',
              transformOrigin: 'top center',
              boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.3)',
            }}
          />

          {/* Sword on back */}
          <div
            className="absolute"
            style={{
              width: 3,
              height: size * 0.4,
              top: size * 0.08,
              right: -size * 0.04,
              background: 'linear-gradient(180deg, hsl(0 0% 75%), hsl(0 0% 50%))',
              borderRadius: 1,
              transform: 'rotate(-20deg)',
              transformOrigin: 'bottom center',
              boxShadow: '0 0 4px rgba(255,255,255,0.2)',
            }}
          >
            {/* Sword guard */}
            <div
              className="absolute"
              style={{
                width: size * 0.06,
                height: 3,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'hsl(200 100% 50%)',
                boxShadow: '0 0 6px rgba(18,181,255,0.5)',
                borderRadius: 1,
              }}
            />
          </div>

          {/* Legs */}
          <div
            className="absolute flex gap-[2px]"
            style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            <div
              style={{
                width: size * 0.14,
                height: size * 0.25,
                background: 'linear-gradient(180deg, hsl(220 20% 8%) 0%, hsl(220 15% 6%) 100%)',
                borderRadius: '2px 2px 4px 4px',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  width: 2,
                  height: '70%',
                  margin: '15% auto 0',
                  background: 'linear-gradient(180deg, hsl(200 100% 50%), transparent)',
                  boxShadow: '0 0 4px rgba(18,181,255,0.3)',
                  borderRadius: 1,
                }}
              />
            </div>
            <div
              style={{
                width: size * 0.14,
                height: size * 0.25,
                background: 'linear-gradient(180deg, hsl(220 20% 8%) 0%, hsl(220 15% 6%) 100%)',
                borderRadius: '2px 2px 4px 4px',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  width: 2,
                  height: '70%',
                  margin: '15% auto 0',
                  background: 'linear-gradient(180deg, hsl(200 100% 50%), transparent)',
                  boxShadow: '0 0 4px rgba(18,181,255,0.3)',
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ground shadow */}
      <div
        className="absolute"
        style={{
          width: size * 0.5,
          height: size * 0.08,
          bottom: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(18,181,255,0.3) 0%, transparent 70%)',
          filter: 'blur(3px)',
        }}
      />

      {/* Inline keyframes */}
      <style>{`
        @keyframes ninja-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ninja-tail {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(-25deg) scaleX(1.1); }
        }
      `}</style>
    </div>
  );
}

/* ─── Motion Trail ─── */
function MotionTrail({ positions, size }: { positions: { x: number; y: number }[]; size: number }) {
  return (
    <>
      {positions.map((p, i) => (
        <motion.div
          key={`trail-${i}`}
          className="fixed pointer-events-none z-[64] rounded-full"
          style={{
            width: size * 0.5, height: size * 0.5,
            left: p.x - size * 0.25, top: p.y - size * 0.25,
            background: 'radial-gradient(circle, rgba(18,181,255,0.2), transparent 70%)',
          }}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.02, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function SmokeEffect({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <div className="fixed pointer-events-none z-[80]" style={{ left: x - size / 2, top: y - size / 2, width: size * 2, height: size * 2 }}>
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(18,181,255,0.3), rgba(18,181,255,0) 70%)' }}
          initial={{ x: size / 2 + (Math.random() - 0.5) * 20, y: size / 2 + (Math.random() - 0.5) * 20, width: 8, height: 8, opacity: 0.8 }}
          animate={{ x: size / 2 + (Math.random() - 0.5) * size, y: size / 2 + (Math.random() - 0.5) * size - 30, width: 30 + Math.random() * 20, height: 30 + Math.random() * 20, opacity: 0 }}
          transition={{ duration: 0.6 + Math.random() * 0.4, delay: i * 0.03, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function getRandomPosition(s: number) {
  const vw = window.innerWidth; const vh = window.innerHeight;
  return { x: s + Math.random() * (vw - s * 2), y: s + Math.random() * (vh - s * 2) };
}

function getDodgePosition(cx: number, cy: number, s: number) {
  const vw = window.innerWidth; const vh = window.innerHeight;
  const ox = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 150);
  const oy = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 120);
  return { x: Math.max(s, Math.min(vw - s, cx + ox)), y: Math.max(s, Math.min(vh - s, cy + oy)) };
}

interface Ninja3DProps {
  productId?: string;
}

/* ─── Main Component ─── */
export function Ninja3D({ productId }: Ninja3DProps) {
  const { settings, setSettings } = useStore();
  const ninja = settings.ninjaSettings;
  const enabled = ninja.enabled ?? true;
  const testMode = ninja.testMode ?? false;
  const ninjaSize = ninja.ninjaSize || 80;
  const cooldownMinutes = ninja.cooldownMinutes ?? 2;

  const [phase, setPhase] = useState<'hidden' | 'active' | 'smoke'>('hidden');
  const [pos, setPos] = useState({ x: -200, y: 300 });
  const [isIdle, setIsIdle] = useState(false);
  const [isDodging, setIsDodging] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rewardCode, setRewardCode] = useState('');
  const [rewardLabel, setRewardLabel] = useState('');
  const [rewardLoading, setRewardLoading] = useState(false);
  const [smokePos, setSmokePos] = useState({ x: 0, y: 0 });
  const [trailPositions, setTrailPositions] = useState<{ x: number; y: number }[]>([]);
  const [trailKey, setTrailKey] = useState(0);
  const dodgeCountRef = useRef(0);
  const maxDodgesRef = useRef(2 + Math.floor(Math.random() * 3));
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const posRef = useRef(pos);
  posRef.current = pos;

  const settingsRef = useRef(ninja);
  settingsRef.current = ninja;

  const incrementStat = useCallback((key: 'totalAppearances' | 'totalClicks' | 'couponsGenerated') => {
    setSettings(prev => ({
      ...prev,
      ninjaSettings: { ...prev.ninjaSettings, stats: { ...prev.ninjaSettings.stats, [key]: (prev.ninjaSettings.stats[key] || 0) + 1 } },
    }));
  }, [setSettings]);

  const emitTrail = useCallback((from: { x: number; y: number }) => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 5; i++) {
      points.push({ x: from.x + (Math.random() - 0.5) * 15, y: from.y + (Math.random() - 0.5) * 15 });
    }
    setTrailPositions(points);
    setTrailKey(k => k + 1);
  }, []);

  // Single entry effect — always runs in testMode
  useEffect(() => {
    mountedRef.current = true;
    if (startedRef.current) return;
    if (!enabled) return;

    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('ninja') === '1' || testMode;
    if (!debugMode) {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') return;
      const lastTs = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
      if (Date.now() - lastTs < cooldownMinutes * 60 * 1000) return;
    }

    startedRef.current = true;
    const delay = debugMode ? 1500 : (3000 + Math.random() * 3000);

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      if (!debugMode) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      }
      incrementStat('totalAppearances');

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const side = Math.floor(Math.random() * 4);
      const starts = [
        { x: -ninjaSize, y: vh * 0.6 },
        { x: vw + ninjaSize, y: vh * 0.6 },
        { x: vw / 2, y: -ninjaSize },
        { x: vw / 2, y: vh + ninjaSize },
      ];
      setPos(starts[side]);
      setPhase('active');

      setTimeout(() => {
        if (!mountedRef.current) return;
        const first = getRandomPosition(ninjaSize);
        emitTrail(starts[side]);
        setPos(first);
        posRef.current = first;
        setTimeout(() => { if (mountedRef.current) setIsIdle(true); }, 1500);
      }, 50);

      moveIntervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        setIsIdle(false);
        emitTrail(posRef.current);
        const next = getRandomPosition(ninjaSize);
        setPos(next);
        posRef.current = next;
        setTimeout(() => { if (mountedRef.current) setIsIdle(true); }, 1200);
      }, 3500);

      autoHideRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
        setSmokePos(posRef.current);
        setPhase('smoke');
        setTimeout(() => { if (mountedRef.current) setPhase('hidden'); }, 800);
      }, 25000);
    }, delay);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, testMode]);

  const generateRewardFromBackend = useCallback(async () => {
    setRewardLoading(true);
    try {
      const pid = productId || 'general';
      const sessionId = getSessionId();
      const visitorId = getVisitorId();

      const { data, error } = await supabase.functions.invoke('generate-ninja-coupon', {
        body: { product_id: pid, session_id: sessionId, visitor_id: visitorId },
      });

      if (error || !data?.code) {
        console.error('Ninja coupon generation failed:', error || data?.error);
        setRewardCode('');
        setRewardLabel(data?.error || 'Tente novamente mais tarde');
        setRewardOpen(true);
        setTimeout(() => { if (mountedRef.current) setRewardOpen(false); }, 8000);
        return;
      }

      setRewardCode(data.code);
      setRewardLabel(data.label || `${data.discount_percentage}% OFF`);
      setRewardOpen(true);
      incrementStat('couponsGenerated');
      setTimeout(() => { if (mountedRef.current) setRewardOpen(false); }, 20000);
    } catch (err) {
      console.error('Ninja reward error:', err);
    } finally {
      setRewardLoading(false);
    }
  }, [productId, incrementStat]);

  const handleClick = useCallback(() => {
    if (phase !== 'active') return;

    if (dodgeCountRef.current < maxDodgesRef.current) {
      dodgeCountRef.current++;
      setIsDodging(true);
      emitTrail(posRef.current);
      const dodge = getDodgePosition(posRef.current.x, posRef.current.y, ninjaSize);
      setPos(dodge);
      posRef.current = dodge;
      setTimeout(() => setIsDodging(false), 600);
      return;
    }

    // Caught!
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    if (autoHideRef.current) clearTimeout(autoHideRef.current);
    incrementStat('totalClicks');
    setSmokePos(posRef.current);
    setPhase('smoke');

    setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('hidden');

      const s = settingsRef.current;
      const showReward = s.showReward ?? true;
      if (showReward) {
        generateRewardFromBackend();
      }
    }, 700);
  }, [phase, ninjaSize, incrementStat, emitTrail, generateRewardFromBackend]);

  const handleCopyCode = () => {
    if (!rewardCode) return;
    navigator.clipboard.writeText(rewardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!enabled) return null;

  return (
    <>
      <AnimatePresence>
        {phase === 'active' && (
          <motion.div
            className="fixed z-[65] cursor-pointer"
            style={{ width: ninjaSize, height: ninjaSize, pointerEvents: 'auto', filter: 'drop-shadow(0 0 12px rgba(18,181,255,0.4))' }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: isDodging ? 1.15 : 1, x: pos.x - ninjaSize / 2, y: pos.y - ninjaSize / 2 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              x: { type: 'spring', stiffness: isDodging ? 300 : 120, damping: isDodging ? 15 : 20 },
              y: { type: 'spring', stiffness: isDodging ? 300 : 120, damping: isDodging ? 15 : 20 },
              scale: { type: 'spring', stiffness: 200, damping: 15 },
              opacity: { duration: 0.3 },
            }}
            onClick={handleClick}
          >
            <CSSNinja size={ninjaSize} idle={isIdle} dodging={isDodging} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'active' && trailPositions.length > 0 && (
        <MotionTrail key={trailKey} positions={trailPositions} size={ninjaSize} />
      )}

      <AnimatePresence>
        {phase === 'smoke' && <SmokeEffect x={smokePos.x} y={smokePos.y} size={ninjaSize} />}
      </AnimatePresence>

      <AnimatePresence>
        {rewardOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 left-4 right-4 z-[80] max-w-sm mx-auto"
          >
            <div className="rounded-2xl p-6 border relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsl(220 20% 8%), hsl(220 15% 12%))', borderColor: 'rgba(18,181,255,0.25)', boxShadow: '0 0 40px rgba(18,181,255,0.12), 0 12px 40px rgba(0,0,0,0.5)' }}
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(18,181,255,0.08), transparent)' }} />
              <button onClick={() => setRewardOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary text-muted-foreground z-10"><X className="h-4 w-4" /></button>
              <div className="text-center space-y-3 relative z-10">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: 'radial-gradient(circle, rgba(18,181,255,0.15), rgba(18,181,255,0.05))', border: '1px solid rgba(18,181,255,0.25)', boxShadow: '0 0 20px rgba(18,181,255,0.2)' }}
                >
                  {rewardLoading ? <Loader2 className="h-7 w-7 text-primary animate-spin" /> : <Sparkles className="h-7 w-7 text-primary" />}
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {rewardLoading ? 'Gerando recompensa...' : (ninja.rewardMessage || '🥷 Ninja capturado!')}
                  </p>
                  {!rewardLoading && rewardCode && (
                    <p className="text-xs text-muted-foreground mt-1">Cupom válido por 30 minutos.</p>
                  )}
                  {!rewardLoading && !rewardCode && rewardLabel && (
                    <p className="text-xs text-muted-foreground mt-1">{rewardLabel}</p>
                  )}
                </div>
                {rewardLabel && rewardCode && !rewardLoading && (
                  <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="inline-block text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{ color: 'hsl(200, 100%, 70%)', background: 'rgba(18,181,255,0.1)', border: '1px solid rgba(18,181,255,0.2)' }}
                  >{rewardLabel}</motion.span>
                )}
                {rewardCode && !rewardLoading && (
                  <>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                      className="rounded-xl px-5 py-3.5 font-mono text-xl font-black tracking-[0.15em]"
                      style={{ background: 'rgba(18,181,255,0.06)', border: '1px solid rgba(18,181,255,0.15)', color: 'hsl(200, 100%, 85%)' }}
                    >{rewardCode}</motion.div>
                    <div className="flex flex-col gap-2 pt-1">
                      <button onClick={handleCopyCode}
                        className="inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, hsl(200, 100%, 50%), hsl(200, 100%, 38%))', color: 'white', boxShadow: '0 0 20px rgba(18,181,255,0.3)' }}
                      >
                        {copied ? <><Check className="h-4 w-4" /> Código copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                      </button>
                      <button onClick={() => { handleCopyCode(); setRewardOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="inline-flex items-center justify-center gap-2 text-xs transition-colors py-1.5" style={{ color: 'hsl(200, 100%, 65%)' }}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Usar desconto agora
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
