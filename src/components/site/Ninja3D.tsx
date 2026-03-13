import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
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

/* ─── Procedural 3D Cyber Ninja Model ─── */
function CyberNinjaModel({ idle, dodging }: { idle?: boolean; dodging?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const spinRef = useRef(0);

  const neonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(200, 100%, 50%)'),
    emissive: new THREE.Color('hsl(200, 100%, 40%)'),
    emissiveIntensity: 1.2, metalness: 0.8, roughness: 0.2,
  }), []);
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(220, 15%, 10%)'),
    metalness: 0.6, roughness: 0.4,
  }), []);
  const armorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(220, 20%, 14%)'),
    metalness: 0.7, roughness: 0.3,
  }), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(200, 100%, 85%)'),
    emissive: new THREE.Color('hsl(200, 100%, 70%)'),
    emissiveIntensity: 2,
  }), []);
  const swordMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(0, 0%, 70%)'),
    metalness: 0.9, roughness: 0.1,
  }), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (dodging) {
      spinRef.current += delta * 14;
      groupRef.current.rotation.y = spinRef.current;
      groupRef.current.position.y = Math.sin(Math.min(spinRef.current / 3, Math.PI)) * 0.4;
    } else {
      spinRef.current = 0;
      if (idle) {
        groupRef.current.position.y = Math.sin(t * 2) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
      } else {
        groupRef.current.position.y *= 0.9;
        groupRef.current.rotation.y *= 0.9;
      }
    }
  });

  return (
    <group ref={groupRef} scale={0.9}>
      <mesh position={[0, 0.2, 0]} material={bodyMat}><boxGeometry args={[0.6, 0.7, 0.35]} /></mesh>
      <mesh position={[0, 0.25, 0.18]} material={armorMat}><boxGeometry args={[0.45, 0.5, 0.05]} /></mesh>
      <mesh position={[0, 0.25, 0.21]} material={neonMat}><boxGeometry args={[0.03, 0.4, 0.02]} /></mesh>
      <mesh position={[0, -0.12, 0]} material={armorMat}><boxGeometry args={[0.65, 0.1, 0.38]} /></mesh>
      <mesh position={[0, -0.12, 0.2]} material={neonMat}><boxGeometry args={[0.18, 0.07, 0.03]} /></mesh>
      <mesh position={[0, 0.8, 0]} material={bodyMat}><sphereGeometry args={[0.28, 16, 16]} /></mesh>
      <mesh position={[0, 0.82, 0]} material={neonMat}><cylinderGeometry args={[0.29, 0.29, 0.08, 16]} /></mesh>
      <mesh position={[-0.1, 0.78, 0.22]} material={eyeMat}><sphereGeometry args={[0.055, 8, 8]} /></mesh>
      <mesh position={[0.1, 0.78, 0.22]} material={eyeMat}><sphereGeometry args={[0.055, 8, 8]} /></mesh>
      <mesh position={[-0.35, 0.85, -0.1]} rotation={[0, 0, -0.5]} material={neonMat}><boxGeometry args={[0.3, 0.04, 0.02]} /></mesh>
      <mesh position={[-0.42, 0.82, -0.12]} rotation={[0, 0, -0.7]} material={neonMat}><boxGeometry args={[0.22, 0.03, 0.02]} /></mesh>
      <mesh position={[-0.42, 0.2, 0]} rotation={[0, 0, 0.3]} material={bodyMat}><boxGeometry args={[0.15, 0.5, 0.15]} /></mesh>
      <mesh position={[-0.5, -0.02, 0]} material={armorMat}><sphereGeometry args={[0.08, 8, 8]} /></mesh>
      <mesh position={[0.42, 0.2, 0]} rotation={[0, 0, -0.3]} material={bodyMat}><boxGeometry args={[0.15, 0.5, 0.15]} /></mesh>
      <mesh position={[0.5, -0.02, 0]} material={armorMat}><sphereGeometry args={[0.08, 8, 8]} /></mesh>
      <mesh position={[-0.15, -0.5, 0]} material={bodyMat}><boxGeometry args={[0.17, 0.55, 0.17]} /></mesh>
      <mesh position={[-0.15, -0.5, 0.09]} material={neonMat}><boxGeometry args={[0.03, 0.4, 0.02]} /></mesh>
      <mesh position={[0.15, -0.5, 0]} material={bodyMat}><boxGeometry args={[0.17, 0.55, 0.17]} /></mesh>
      <mesh position={[0.15, -0.5, 0.09]} material={neonMat}><boxGeometry args={[0.03, 0.4, 0.02]} /></mesh>
      <group position={[0.2, 0.4, -0.2]} rotation={[0, 0, -0.35]}>
        <mesh material={swordMat}><boxGeometry args={[0.04, 0.7, 0.02]} /></mesh>
        <mesh position={[0, -0.35, 0]} material={neonMat}><boxGeometry args={[0.15, 0.04, 0.06]} /></mesh>
        <mesh position={[0, -0.45, 0]} material={armorMat}><boxGeometry args={[0.05, 0.15, 0.05]} /></mesh>
      </group>
    </group>
  );
}

function NinjaCanvas({ size, idle, dodging }: { size: number; idle?: boolean; dodging?: boolean }) {
  return (
    <div style={{ width: size, height: size, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0.3, 2.8], fov: 35 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} color="#ffffff" />
        <pointLight position={[0, 1, 2]} intensity={0.6} color="hsl(200, 100%, 55%)" distance={5} />
        <pointLight position={[-1, 0, 1]} intensity={0.3} color="hsl(200, 100%, 40%)" distance={4} />
        <CyberNinjaModel idle={idle} dodging={dodging} />
      </Canvas>
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
  const testMode = (ninja as any).testMode ?? false;
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

  // Single entry effect
  useEffect(() => {
    mountedRef.current = true;
    if (startedRef.current) return;
    if (!enabled) return;

    // Check cooldowns — testMode or ?ninja=1 bypasses
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('ninja') === '1' || testMode;
    if (!debugMode) {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') return;
      const lastTs = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
      if (Date.now() - lastTs < cooldownMinutes * 60 * 1000) return;
    }

    startedRef.current = true;
    const delay = testMode ? 1500 : (3000 + Math.random() * 3000);

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      if (!testMode) {
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
        // Fallback: show generic message if backend fails
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
        // Generate reward from backend (secure)
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
            <NinjaCanvas size={ninjaSize} idle={isIdle} dodging={isDodging} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: ninjaSize * 0.6, height: ninjaSize * 0.12, background: 'radial-gradient(ellipse, rgba(18,181,255,0.35) 0%, transparent 70%)', filter: 'blur(3px)' }}
            />
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
