import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const COOLDOWN_KEY = 'ninja_last_seen';
const CLICK_KEY = 'ninja_clicked';

function NinjaSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
      {/* Body */}
      <rect x="16" y="20" width="16" height="18" rx="4" fill="hsl(240 10% 12%)" />
      {/* Head */}
      <circle cx="24" cy="14" r="10" fill="hsl(240 10% 15%)" />
      {/* Mask band */}
      <rect x="14" y="10" width="20" height="6" rx="3" fill="hsl(200 100% 50%)" />
      {/* Eyes */}
      <ellipse cx="20" cy="13" rx="2.5" ry="2" fill="white" />
      <ellipse cx="28" cy="13" rx="2.5" ry="2" fill="white" />
      <circle cx="20.5" cy="13" r="1" fill="hsl(240 10% 8%)" />
      <circle cx="28.5" cy="13" r="1" fill="hsl(240 10% 8%)" />
      {/* Mask tails */}
      <path d="M34 12 Q38 10 42 14" stroke="hsl(200 100% 50%)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M34 14 Q37 13 40 17" stroke="hsl(200 100% 50%)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Belt */}
      <rect x="16" y="28" width="16" height="3" rx="1.5" fill="hsl(200 100% 45%)" />
      {/* Legs */}
      <rect x="18" y="38" width="4" height="6" rx="2" fill="hsl(240 10% 12%)" />
      <rect x="26" y="38" width="4" height="6" rx="2" fill="hsl(240 10% 12%)" />
      {/* Arms */}
      <rect x="10" y="22" width="6" height="3" rx="1.5" fill="hsl(240 10% 12%)" />
      <rect x="32" y="22" width="6" height="3" rx="1.5" fill="hsl(240 10% 12%)" />
      {/* Sword on back */}
      <rect x="33" y="6" width="2" height="20" rx="1" fill="hsl(0 0% 60%)" transform="rotate(15 34 16)" />
      <rect x="32" y="5" width="4" height="3" rx="1" fill="hsl(200 100% 40%)" transform="rotate(15 34 6)" />
    </svg>
  );
}

export function NinjaMascot() {
  const { settings } = useStore();
  const ninja = (settings as any).ninjaSettings;
  const [visible, setVisible] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rewardCode, setRewardCode] = useState('');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = ninja?.enabled ?? true;
  const freqMin = ninja?.frequencyMin ?? 3;
  const freqMax = ninja?.frequencyMax ?? 5;
  const cooldown = ninja?.cooldownMinutes ?? 10;
  const codes = ninja?.discountCodes ?? ['NINJA5'];
  const message = ninja?.rewardMessage ?? '🥷 Você capturou o Ninja! Aqui está seu cupom de desconto:';
  const showReward = ninja?.showReward ?? true;

  const scheduleNext = useCallback(() => {
    if (!enabled) return;
    const mins = freqMin + Math.random() * (freqMax - freqMin);
    const ms = mins * 60 * 1000;
    timerRef.current = setTimeout(() => {
      // Check cooldown
      const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
      if (Date.now() - last < cooldown * 60 * 1000) {
        scheduleNext();
        return;
      }
      // Check if already clicked this session
      if (localStorage.getItem(CLICK_KEY) === 'true') {
        scheduleNext();
        return;
      }
      setDirection(Math.random() > 0.5 ? 'ltr' : 'rtl');
      setVisible(true);
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      // Auto-hide after animation
      setTimeout(() => setVisible(false), 4000);
      scheduleNext();
    }, ms);
  }, [enabled, freqMin, freqMax, cooldown]);

  useEffect(() => {
    if (!enabled) return;
    // First appearance after 30-60s
    const initial = (30 + Math.random() * 30) * 1000;
    timerRef.current = setTimeout(() => {
      setDirection(Math.random() > 0.5 ? 'ltr' : 'rtl');
      setVisible(true);
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      setTimeout(() => setVisible(false), 4000);
      scheduleNext();
    }, initial);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, scheduleNext]);

  // Clear session click on mount
  useEffect(() => {
    // Reset per page load (not per session)
    localStorage.removeItem(CLICK_KEY);
  }, []);

  const handleClick = () => {
    setVisible(false);
    localStorage.setItem(CLICK_KEY, 'true');
    if (showReward && codes.length > 0) {
      const code = codes[Math.floor(Math.random() * codes.length)];
      setRewardCode(code);
      setRewardOpen(true);
      setTimeout(() => setRewardOpen(false), 10000);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rewardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!enabled) return null;

  return (
    <>
      {/* Running ninja */}
      <AnimatePresence>
        {visible && (
          <div
            className="fixed bottom-16 left-0 right-0 z-[60] pointer-events-none"
            style={{ height: '52px', overflow: 'hidden' }}
          >
            <div
              className="pointer-events-auto cursor-pointer"
              onClick={handleClick}
              style={{
                position: 'absolute',
                bottom: 0,
                animation: direction === 'ltr' ? 'ninja-run 3.5s linear forwards' : 'ninja-run-reverse 3.5s linear forwards',
              }}
            >
              <NinjaSVG />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Reward popup */}
      <AnimatePresence>
        {rewardOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-[70] max-w-sm mx-auto"
          >
            <div className="glass-card rounded-2xl p-5 border border-primary/20 neon-glow">
              <button
                onClick={() => setRewardOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-center space-y-3">
                <div className="text-3xl">🥷</div>
                <p className="text-sm text-foreground font-medium">{message}</p>
                <div className="bg-secondary rounded-xl px-4 py-3 font-mono text-lg font-bold text-primary tracking-wider">
                  {rewardCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 gold-gradient text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                >
                  {copied ? <><Check className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar código</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
