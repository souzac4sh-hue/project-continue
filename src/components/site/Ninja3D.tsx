import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, ShoppingBag, Sparkles } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/context/StoreContext';
import { NinjaRewardTier } from '@/data/mockData';

const COOLDOWN_KEY = 'ninja3d_cooldown_ts';
const SESSION_KEY = 'ninja3d_session_done';

/* ─── Procedural 3D Cyber Ninja Model ─── */
function CyberNinjaModel({ idle }: { idle?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Neon blue emissive material
  const neonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(200, 100%, 50%)'),
    emissive: new THREE.Color('hsl(200, 100%, 40%)'),
    emissiveIntensity: 1.2,
    metalness: 0.8,
    roughness: 0.2,
  }), []);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(220, 15%, 10%)'),
    metalness: 0.6,
    roughness: 0.4,
  }), []);

  const armorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(220, 20%, 14%)'),
    metalness: 0.7,
    roughness: 0.3,
  }), []);

  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(200, 100%, 85%)'),
    emissive: new THREE.Color('hsl(200, 100%, 70%)'),
    emissiveIntensity: 2,
  }), []);

  const swordMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('hsl(0, 0%, 70%)'),
    metalness: 0.9,
    roughness: 0.1,
  }), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Idle breathing / bobbing
    if (idle) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.05;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={0.9}>
      {/* Body / Torso */}
      <mesh position={[0, 0.2, 0]} material={bodyMat}>
        <boxGeometry args={[0.6, 0.7, 0.35]} />
      </mesh>

      {/* Chest armor plate */}
      <mesh position={[0, 0.25, 0.18]} material={armorMat}>
        <boxGeometry args={[0.45, 0.5, 0.05]} />
      </mesh>

      {/* Center neon line on chest */}
      <mesh position={[0, 0.25, 0.21]} material={neonMat}>
        <boxGeometry args={[0.03, 0.4, 0.02]} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, -0.12, 0]} material={armorMat}>
        <boxGeometry args={[0.65, 0.1, 0.38]} />
      </mesh>
      {/* Belt buckle (neon) */}
      <mesh position={[0, -0.12, 0.2]} material={neonMat}>
        <boxGeometry args={[0.18, 0.07, 0.03]} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.8, 0]} material={bodyMat}>
        <sphereGeometry args={[0.28, 16, 16]} />
      </mesh>

      {/* Headband (neon) */}
      <mesh position={[0, 0.82, 0]} material={neonMat}>
        <cylinderGeometry args={[0.29, 0.29, 0.08, 16]} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 0.78, 0.22]} material={eyeMat}>
        <sphereGeometry args={[0.055, 8, 8]} />
      </mesh>
      <mesh position={[0.1, 0.78, 0.22]} material={eyeMat}>
        <sphereGeometry args={[0.055, 8, 8]} />
      </mesh>

      {/* Mask tail ribbons */}
      <mesh position={[-0.35, 0.85, -0.1]} rotation={[0, 0, -0.5]} material={neonMat}>
        <boxGeometry args={[0.3, 0.04, 0.02]} />
      </mesh>
      <mesh position={[-0.42, 0.82, -0.12]} rotation={[0, 0, -0.7]} material={neonMat}>
        <boxGeometry args={[0.22, 0.03, 0.02]} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.42, 0.2, 0]} rotation={[0, 0, 0.3]} material={bodyMat}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.5, -0.02, 0]} material={armorMat}>
        <sphereGeometry args={[0.08, 8, 8]} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.42, 0.2, 0]} rotation={[0, 0, -0.3]} material={bodyMat}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.5, -0.02, 0]} material={armorMat}>
        <sphereGeometry args={[0.08, 8, 8]} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.15, -0.5, 0]} material={bodyMat}>
        <boxGeometry args={[0.17, 0.55, 0.17]} />
      </mesh>
      {/* Left leg neon strip */}
      <mesh position={[-0.15, -0.5, 0.09]} material={neonMat}>
        <boxGeometry args={[0.03, 0.4, 0.02]} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.15, -0.5, 0]} material={bodyMat}>
        <boxGeometry args={[0.17, 0.55, 0.17]} />
      </mesh>
      {/* Right leg neon strip */}
      <mesh position={[0.15, -0.5, 0.09]} material={neonMat}>
        <boxGeometry args={[0.03, 0.4, 0.02]} />
      </mesh>

      {/* Sword on back */}
      <group position={[0.2, 0.4, -0.2]} rotation={[0, 0, -0.35]}>
        <mesh material={swordMat}>
          <boxGeometry args={[0.04, 0.7, 0.02]} />
        </mesh>
        {/* Sword guard (neon) */}
        <mesh position={[0, -0.35, 0]} material={neonMat}>
          <boxGeometry args={[0.15, 0.04, 0.06]} />
        </mesh>
        {/* Sword handle */}
        <mesh position={[0, -0.45, 0]} material={armorMat}>
          <boxGeometry args={[0.05, 0.15, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Animated Ninja in a Canvas ─── */
function NinjaCanvas({ size, idle }: { size: number; idle?: boolean }) {
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
        <CyberNinjaModel idle={idle} />
      </Canvas>
    </div>
  );
}

/* ─── Smoke Particles ─── */
function SmokeEffect({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <div className="fixed pointer-events-none z-[80]" style={{ left: x - size / 2, top: y - size / 2, width: size * 2, height: size * 2 }}>
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(18,181,255,0.3), rgba(18,181,255,0) 70%)' }}
          initial={{
            x: size / 2 + (Math.random() - 0.5) * 20,
            y: size / 2 + (Math.random() - 0.5) * 20,
            width: 8,
            height: 8,
            opacity: 0.8,
          }}
          animate={{
            x: size / 2 + (Math.random() - 0.5) * size,
            y: size / 2 + (Math.random() - 0.5) * size - 30,
            width: 30 + Math.random() * 20,
            height: 30 + Math.random() * 20,
            opacity: 0,
          }}
          transition={{ duration: 0.6 + Math.random() * 0.4, delay: i * 0.03, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Weighted random pick ─── */
function pickWeightedReward(tiers: NinjaRewardTier[]): NinjaRewardTier {
  const totalWeight = tiers.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const tier of tiers) {
    roll -= tier.weight;
    if (roll <= 0) return tier;
  }
  return tiers[tiers.length - 1];
}

/* ─── Movement targets ─── */
function getRandomPosition(ninjaSize: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = ninjaSize;
  return {
    x: margin + Math.random() * (vw - margin * 2),
    y: margin + Math.random() * (vh - margin * 2),
  };
}

function getDodgePosition(currentX: number, currentY: number, ninjaSize: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const offsetX = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 150);
  const offsetY = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 120);
  return {
    x: Math.max(ninjaSize, Math.min(vw - ninjaSize, currentX + offsetX)),
    y: Math.max(ninjaSize, Math.min(vh - ninjaSize, currentY + offsetY)),
  };
}

/* ─── Main Component ─── */
export function Ninja3D() {
  const { settings, setSettings } = useStore();
  const ninja = settings.ninjaSettings;

  const {
    enabled = true,
    cooldownMinutes = 1440, // 24 hours
    ninjaSize = 80,
    rewardTiers = [],
    discountCodes = [],
    rewardMessage = '🥷 Ninja encontrado!',
    showReward = true,
  } = ninja;

  const [phase, setPhase] = useState<'hidden' | 'entering' | 'moving' | 'idle' | 'dodging' | 'smoke' | 'caught'>('hidden');
  const [pos, setPos] = useState({ x: -200, y: 300 });
  const [rewardOpen, setRewardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rewardCode, setRewardCode] = useState('');
  const [rewardLabel, setRewardLabel] = useState('');
  const [smokePos, setSmokePos] = useState({ x: 0, y: 0 });
  const dodgeCountRef = useRef(0);
  const maxDodges = 2 + Math.floor(Math.random() * 3); // 2-4
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const canAppear = useCallback(() => {
    if (!enabled) return false;
    if (sessionStorage.getItem(SESSION_KEY) === 'true') return false;
    const lastTs = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
    if (Date.now() - lastTs < cooldownMinutes * 60 * 1000) return false;
    return true;
  }, [enabled, cooldownMinutes]);

  // Increment ninja stats
  const incrementStat = useCallback((key: 'totalAppearances' | 'totalClicks' | 'couponsGenerated') => {
    setSettings(prev => ({
      ...prev,
      ninjaSettings: {
        ...prev.ninjaSettings,
        stats: {
          ...prev.ninjaSettings.stats,
          [key]: (prev.ninjaSettings.stats[key] || 0) + 1,
        },
      },
    }));
  }, [setSettings]);

  // Start moving to random positions
  const startMoving = useCallback(() => {
    if (!mountedRef.current) return;
    const target = getRandomPosition(ninjaSize);
    setPos(target);
    setPhase('moving');

    moveTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('idle');

      // After idle pause, move again
      moveTimerRef.current = setTimeout(() => {
        if (mountedRef.current && phase !== 'caught') startMoving();
      }, 1500 + Math.random() * 2000);
    }, 1200 + Math.random() * 800);
  }, [ninjaSize]);

  // Entry sequence
  useEffect(() => {
    mountedRef.current = true;
    if (!canAppear()) return;

    const delay = 3000 + Math.random() * 3000; // 3-6s
    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      sessionStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      incrementStat('totalAppearances');

      // Enter from a random edge
      const side = Math.floor(Math.random() * 4);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let startPos = { x: -ninjaSize, y: vh / 2 };
      if (side === 1) startPos = { x: vw + ninjaSize, y: vh / 2 };
      if (side === 2) startPos = { x: vw / 2, y: -ninjaSize };
      if (side === 3) startPos = { x: vw / 2, y: vh + ninjaSize };

      setPos(startPos);
      setPhase('entering');

      // Move to first position
      setTimeout(() => {
        if (!mountedRef.current) return;
        const target = getRandomPosition(ninjaSize);
        setPos(target);

        setTimeout(() => {
          if (mountedRef.current) startMoving();
        }, 1000);
      }, 100);
    }, delay);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    };
  }, [canAppear, incrementStat, ninjaSize, startMoving]);

  // Auto-disappear after 20s
  useEffect(() => {
    if (phase === 'hidden' || phase === 'caught' || phase === 'smoke') return;
    if (phase === 'entering') return;

    const autoHide = setTimeout(() => {
      if (!mountedRef.current) return;
      setSmokePos(pos);
      setPhase('smoke');
      setTimeout(() => {
        if (mountedRef.current) setPhase('hidden');
      }, 800);
    }, 20000);

    return () => clearTimeout(autoHide);
  }, [phase]);

  const handleClick = useCallback(() => {
    if (phase === 'hidden' || phase === 'smoke' || phase === 'caught') return;
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);

    // Dodge mechanic
    if (dodgeCountRef.current < maxDodges) {
      dodgeCountRef.current++;
      const dodgeTarget = getDodgePosition(pos.x, pos.y, ninjaSize);
      setPos(dodgeTarget);
      setPhase('dodging');

      setTimeout(() => {
        if (mountedRef.current) startMoving();
      }, 600);
      return;
    }

    // Caught!
    incrementStat('totalClicks');
    setSmokePos(pos);
    setPhase('caught');

    setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('smoke');

      setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase('hidden');

        if (showReward) {
          let code = '';
          let label = '';

          if (rewardTiers.length > 0) {
            const tier = pickWeightedReward(rewardTiers);
            code = tier.code;
            label = tier.label;
          } else if (discountCodes.length > 0) {
            code = discountCodes[Math.floor(Math.random() * discountCodes.length)];
          } else {
            // Default codes
            const isRare = Math.random() < 0.1;
            code = isRare ? 'C4NINJA10' : 'C4NINJA5';
            label = isRare ? '🔥 10% Raro!' : '5% desconto';
          }

          if (code) {
            setRewardCode(code);
            setRewardLabel(label);
            setRewardOpen(true);
            incrementStat('couponsGenerated');
            setTimeout(() => { if (mountedRef.current) setRewardOpen(false); }, 15000);
          }
        }
      }, 700);
    }, 300);
  }, [phase, pos, ninjaSize, maxDodges, showReward, rewardTiers, discountCodes, startMoving, incrementStat]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rewardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!enabled) return null;

  const isVisible = phase !== 'hidden';
  const isMoving = phase === 'entering' || phase === 'moving' || phase === 'dodging';

  return (
    <>
      {/* Ninja character */}
      <AnimatePresence>
        {isVisible && phase !== 'smoke' && phase !== 'caught' && (
          <motion.div
            className="fixed z-[65] cursor-pointer"
            style={{
              width: ninjaSize,
              height: ninjaSize,
              pointerEvents: 'auto',
              filter: 'drop-shadow(0 0 12px rgba(18,181,255,0.4))',
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: 1,
              scale: phase === 'dodging' ? 1.15 : 1,
              x: pos.x - ninjaSize / 2,
              y: pos.y - ninjaSize / 2,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              x: {
                type: 'spring',
                stiffness: phase === 'dodging' ? 300 : 120,
                damping: phase === 'dodging' ? 15 : 20,
              },
              y: {
                type: 'spring',
                stiffness: phase === 'dodging' ? 300 : 120,
                damping: phase === 'dodging' ? 15 : 20,
              },
              scale: { type: 'spring', stiffness: 200, damping: 15 },
              opacity: { duration: 0.3 },
            }}
            onClick={handleClick}
          >
            <NinjaCanvas size={ninjaSize} idle={phase === 'idle'} />

            {/* Neon glow ring underneath */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width: ninjaSize * 0.6,
                height: ninjaSize * 0.12,
                background: 'radial-gradient(ellipse, rgba(18,181,255,0.35) 0%, transparent 70%)',
                filter: 'blur(3px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smoke effect */}
      <AnimatePresence>
        {(phase === 'smoke' || phase === 'caught') && (
          <SmokeEffect x={smokePos.x} y={smokePos.y} size={ninjaSize} />
        )}
      </AnimatePresence>

      {/* Reward popup */}
      <AnimatePresence>
        {rewardOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 left-4 right-4 z-[80] max-w-sm mx-auto"
          >
            <div
              className="rounded-2xl p-6 border relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(220 20% 8%), hsl(220 15% 12%))',
                borderColor: 'rgba(18,181,255,0.25)',
                boxShadow: '0 0 40px rgba(18,181,255,0.12), 0 12px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Decorative glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(18,181,255,0.08), transparent)' }} />

              <button
                onClick={() => setRewardOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary text-muted-foreground z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-3 relative z-10">
                {/* Sparkle icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(18,181,255,0.15), rgba(18,181,255,0.05))',
                    border: '1px solid rgba(18,181,255,0.25)',
                    boxShadow: '0 0 20px rgba(18,181,255,0.2)',
                  }}
                >
                  <Sparkles className="h-7 w-7 text-primary" />
                </motion.div>

                <div>
                  <p className="text-sm font-bold text-foreground">{rewardMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">Você desbloqueou um desconto secreto.</p>
                </div>

                {rewardLabel && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{
                      color: 'hsl(200, 100%, 70%)',
                      background: 'rgba(18,181,255,0.1)',
                      border: '1px solid rgba(18,181,255,0.2)',
                    }}
                  >
                    {rewardLabel}
                  </motion.span>
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl px-5 py-3.5 font-mono text-xl font-black tracking-[0.15em]"
                  style={{
                    background: 'rgba(18,181,255,0.06)',
                    border: '1px solid rgba(18,181,255,0.15)',
                    color: 'hsl(200, 100%, 85%)',
                  }}
                >
                  {rewardCode}
                </motion.div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, hsl(200, 100%, 50%), hsl(200, 100%, 38%))',
                      color: 'white',
                      boxShadow: '0 0 20px rgba(18,181,255,0.3)',
                    }}
                  >
                    {copied ? <><Check className="h-4 w-4" /> Código copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                  </button>
                  <button
                    onClick={() => { handleCopyCode(); setRewardOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="inline-flex items-center justify-center gap-2 text-xs transition-colors py-1.5"
                    style={{ color: 'hsl(200, 100%, 65%)' }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Usar desconto agora
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
