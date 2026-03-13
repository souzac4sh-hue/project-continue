import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { NinjaRewardTier } from '@/data/mockData';

const SESSION_COUNT_KEY = 'ninja_session_count';
const SESSION_CLICK_KEY = 'ninja_session_clicked';
const COOLDOWN_KEY = 'ninja_cooldown_ts';

/* ─── Premium 3D-style Ninja SVG ─── */
function NinjaCharacter({ size = 72, idle = false }: { size?: number; idle?: boolean }) {
  const scale = size / 72;
  return (
    <div style={{ width: size, height: size, position: 'relative' }} className="select-none">
      {/* Shadow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-black/40 blur-sm"
        style={{ width: size * 0.6, height: size * 0.1 }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,168,255,0.3))' }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(240 10% 18%)" />
            <stop offset="100%" stopColor="hsl(240 10% 8%)" />
          </linearGradient>
          <linearGradient id="neonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(200 100% 55%)" />
            <stop offset="100%" stopColor="hsl(200 100% 40%)" />
          </linearGradient>
          <linearGradient id="swordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 80%)" />
            <stop offset="100%" stopColor="hsl(0 0% 45%)" />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Legs */}
        <rect x="25" y="52" width="7" height="12" rx="3.5" fill="url(#bodyGrad)" />
        <rect x="40" y="52" width="7" height="12" rx="3.5" fill="url(#bodyGrad)" />
        {/* Leg neon strips */}
        <rect x="27" y="54" width="1.5" height="8" rx="0.75" fill="url(#neonGrad)" opacity="0.5" />
        <rect x="43.5" y="54" width="1.5" height="8" rx="0.75" fill="url(#neonGrad)" opacity="0.5" />

        {/* Body / torso */}
        <path d="M23 28 Q22 32 22 40 Q22 52 28 54 L44 54 Q50 52 50 40 Q50 32 49 28 Z" fill="url(#bodyGrad)" />
        {/* Chest armor plate */}
        <path d="M28 32 L36 30 L44 32 L42 44 L36 46 L30 44 Z" fill="hsl(240 10% 14%)" stroke="url(#neonGrad)" strokeWidth="0.6" opacity="0.8" />
        {/* Center neon line */}
        <line x1="36" y1="30" x2="36" y2="46" stroke="url(#neonGrad)" strokeWidth="1" filter="url(#neonGlow)" opacity="0.7" />

        {/* Belt */}
        <rect x="24" y="46" width="24" height="4" rx="2" fill="hsl(240 10% 10%)" />
        <rect x="32" y="46.5" width="8" height="3" rx="1.5" fill="url(#neonGrad)" filter="url(#neonGlow)" />

        {/* Arms */}
        <g className={idle ? 'animate-[ninja-breathe_2s_ease-in-out_infinite]' : ''}>
          <path d="M22 30 Q16 34 14 40 Q13 43 16 43 L22 40 Z" fill="url(#bodyGrad)" />
          <circle cx="15" cy="42" r="3" fill="hsl(240 10% 12%)" />
        </g>
        <g className={idle ? 'animate-[ninja-breathe_2s_ease-in-out_infinite_0.3s]' : ''}>
          <path d="M50 30 Q56 34 58 40 Q59 43 56 43 L50 40 Z" fill="url(#bodyGrad)" />
          <circle cx="57" cy="42" r="3" fill="hsl(240 10% 12%)" />
        </g>

        {/* Sword on back */}
        <g transform="rotate(-20 50 20)">
          <rect x="50" y="8" width="2.5" height="28" rx="1.25" fill="url(#swordGrad)" />
          <rect x="47" y="7" width="8.5" height="3.5" rx="1.5" fill="url(#neonGrad)" filter="url(#neonGlow)" />
          <rect x="49" y="4" width="4.5" height="4" rx="1" fill="hsl(240 10% 20%)" />
        </g>

        {/* Head */}
        <ellipse cx="36" cy="20" rx="13" ry="14" fill="url(#bodyGrad)" />
        {/* Mask / headband */}
        <rect x="23" y="14" width="26" height="8" rx="4" fill="url(#neonGrad)" filter="url(#neonGlow)" />
        {/* Eyes */}
        <ellipse cx="30" cy="18" rx="3.5" ry="2.5" fill="white" opacity="0.95" />
        <ellipse cx="42" cy="18" rx="3.5" ry="2.5" fill="white" opacity="0.95" />
        {/* Pupils */}
        <circle cx="31" cy="18" r="1.5" fill="hsl(240 10% 6%)" />
        <circle cx="43" cy="18" r="1.5" fill="hsl(240 10% 6%)" />
        {/* Eye glow */}
        <circle cx="31.5" cy="17.5" r="0.6" fill="hsl(200 100% 80%)" />
        <circle cx="43.5" cy="17.5" r="0.6" fill="hsl(200 100% 80%)" />

        {/* Mask tails flowing */}
        <path d="M49 17 Q55 14 62 18" stroke="url(#neonGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" filter="url(#neonGlow)">
          {idle && <animateTransform attributeName="transform" type="rotate" values="0 49 17;3 49 17;-2 49 17;0 49 17" dur="3s" repeatCount="indefinite" />}
        </path>
        <path d="M49 19 Q54 17 60 22" stroke="url(#neonGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6">
          {idle && <animateTransform attributeName="transform" type="rotate" values="0 49 19;-2 49 19;3 49 19;0 49 19" dur="3.5s" repeatCount="indefinite" />}
        </path>

        {/* Mouth area (mask) */}
        <path d="M28 22 Q36 26 44 22" stroke="hsl(240 10% 12%)" strokeWidth="1" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
}

/* ─── Smoke particles ─── */
function SmokeEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-muted-foreground/20"
          initial={{
            x: 30 + Math.random() * 12,
            y: 40 + Math.random() * 10,
            width: 6,
            height: 6,
            opacity: 0.6,
          }}
          animate={{
            x: 20 + Math.random() * 30 - 15,
            y: 10 + Math.random() * 20 - 20,
            width: 16 + Math.random() * 12,
            height: 16 + Math.random() * 12,
            opacity: 0,
          }}
          transition={{ duration: 0.6 + Math.random() * 0.3, delay: i * 0.05, ease: 'easeOut' }}
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

/* ─── Main Component ─── */
export function NinjaMascot() {
  const { settings, setSettings, saveAll } = useStore();
  const ninja = settings.ninjaSettings;

  const [phase, setPhase] = useState<'hidden' | 'running' | 'idle' | 'smoke'>('hidden');
  const [rewardOpen, setRewardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rewardCode, setRewardCode] = useState('');
  const [rewardLabel, setRewardLabel] = useState('');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const {
    enabled = true,
    frequencyMin = 1.5,
    frequencyMax = 3,
    cooldownMinutes = 2,
    maxPerSession = 2,
    positionPreference = 'random',
    ninjaSize = 72,
    animationSpeed = 4,
    rewardTiers = [],
    discountCodes = [],
    rewardMessage = '🥷 Você encontrou o Ninja da C4SH!',
    showReward = true,
  } = ninja;

  const getSessionCount = () => parseInt(sessionStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  const incrementSession = () => sessionStorage.setItem(SESSION_COUNT_KEY, String(getSessionCount() + 1));
  const hasClicked = () => sessionStorage.getItem(SESSION_CLICK_KEY) === 'true';
  const markClicked = () => sessionStorage.setItem(SESSION_CLICK_KEY, 'true');

  const canAppear = useCallback(() => {
    if (!enabled) return false;
    if (getSessionCount() >= maxPerSession) return false;
    if (hasClicked()) return false;
    const lastTs = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
    if (Date.now() - lastTs < cooldownMinutes * 60 * 1000) return false;
    return true;
  }, [enabled, maxPerSession, cooldownMinutes]);

  const getDirection = useCallback(() => {
    if (positionPreference === 'left') return 'ltr';
    if (positionPreference === 'right') return 'rtl';
    return Math.random() > 0.5 ? 'ltr' : 'rtl';
  }, [positionPreference]);

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
    // Don't await saveAll here to avoid blocking — will save on next admin save
  }, [setSettings]);

  const triggerAppearance = useCallback(() => {
    if (!mountedRef.current || !canAppear()) return;

    setDirection(getDirection());
    setPhase('running');
    incrementSession();
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    incrementStat('totalAppearances');

    // After run animation → idle
    hideTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('idle');

      // Auto-disappear after idle
      hideTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase('smoke');
        setTimeout(() => {
          if (mountedRef.current) setPhase('hidden');
        }, 700);
      }, 3000);
    }, animationSpeed * 1000 * 0.6); // stop at ~60% across screen
  }, [canAppear, getDirection, animationSpeed, incrementStat]);

  const scheduleNext = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    const mins = frequencyMin + Math.random() * (frequencyMax - frequencyMin);
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        triggerAppearance();
        scheduleNext();
      }
    }, mins * 60 * 1000);
  }, [enabled, frequencyMin, frequencyMax, triggerAppearance]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    // First appearance after 30-60s
    const initialDelay = (30 + Math.random() * 30) * 1000;
    timerRef.current = setTimeout(() => {
      triggerAppearance();
      scheduleNext();
    }, initialDelay);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [enabled, triggerAppearance, scheduleNext]);

  const handleClick = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setPhase('smoke');
    markClicked();
    incrementStat('totalClicks');

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
        }

        if (code) {
          setRewardCode(code);
          setRewardLabel(label);
          setRewardOpen(true);
          incrementStat('couponsGenerated');
          setTimeout(() => { if (mountedRef.current) setRewardOpen(false); }, 12000);
        }
      }
    }, 600);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rewardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!enabled) return null;

  // Calculate stop position for idle (60% across)
  const stopPosition = direction === 'ltr'
    ? `calc(60vw - ${ninjaSize / 2}px)`
    : `calc(40vw - ${ninjaSize / 2}px)`;

  return (
    <>
      {/* Ninja on screen */}
      <AnimatePresence>
        {phase !== 'hidden' && (
          <div
            className="fixed bottom-20 left-0 right-0 z-[60] pointer-events-none"
            style={{ height: ninjaSize + 8 }}
          >
            {phase === 'running' && (
              <motion.div
                className="absolute bottom-0 pointer-events-auto cursor-pointer"
                initial={{
                  left: direction === 'ltr' ? -ninjaSize : undefined,
                  right: direction === 'rtl' ? -ninjaSize : undefined,
                }}
                animate={{
                  left: direction === 'ltr' ? stopPosition : undefined,
                  right: direction === 'rtl' ? stopPosition : undefined,
                }}
                transition={{ duration: animationSpeed * 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={handleClick}
                style={{ transform: direction === 'rtl' ? 'scaleX(-1)' : undefined }}
              >
                <NinjaCharacter size={ninjaSize} />
              </motion.div>
            )}

            {phase === 'idle' && (
              <motion.div
                className="absolute bottom-0 pointer-events-auto cursor-pointer"
                style={{
                  left: direction === 'ltr' ? stopPosition : undefined,
                  right: direction === 'rtl' ? stopPosition : undefined,
                  transform: direction === 'rtl' ? 'scaleX(-1)' : undefined,
                }}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                onClick={handleClick}
              >
                <NinjaCharacter size={ninjaSize} idle />
              </motion.div>
            )}

            {phase === 'smoke' && (
              <div
                className="absolute bottom-0"
                style={{
                  left: direction === 'ltr' ? stopPosition : undefined,
                  right: direction === 'rtl' ? stopPosition : undefined,
                  width: ninjaSize,
                  height: ninjaSize,
                }}
              >
                <SmokeEffect />
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Reward popup */}
      <AnimatePresence>
        {rewardOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-4 right-4 z-[70] max-w-sm mx-auto"
          >
            <div className="glass-card rounded-2xl p-6 border border-primary/25 neon-glow relative overflow-hidden">
              {/* Decorative glow circle */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />

              <button
                onClick={() => setRewardOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary text-muted-foreground z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center space-y-3 relative z-10">
                {/* Mini ninja icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  <span className="text-2xl">🥷</span>
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
                    className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full"
                  >
                    {rewardLabel}
                  </motion.span>
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-secondary/80 rounded-xl px-5 py-3.5 font-mono text-xl font-black text-primary tracking-[0.15em] border border-primary/10"
                >
                  {rewardCode}
                </motion.div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center justify-center gap-2 gold-gradient text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  >
                    {copied ? <><Check className="h-4 w-4" /> Código copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                  </button>
                  <button
                    onClick={() => { handleCopyCode(); setRewardOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="inline-flex items-center justify-center gap-2 text-xs text-primary hover:text-foreground transition-colors py-1.5"
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
