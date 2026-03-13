import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { Ninja3D } from './Ninja3D';
import { NinjaBubble } from './NinjaBubble';
import { NinjaRewardTier } from '@/data/mockData';

type NinjaState = 'idle' | 'promo' | 'coupon_hunter' | 'checkout_helper' | 'rare_event';

const SESSION_PROMO_KEY = 'ninja_promo_count';
const SESSION_COUPON_KEY = 'ninja_coupon_session';
const DAY_COUPON_KEY = 'ninja_coupon_day';
const CHECKOUT_APPEAR_KEY = 'ninja_checkout_count';

function getSessionCount(key: string): number {
  return parseInt(sessionStorage.getItem(key) || '0', 10);
}
function incrementSessionCount(key: string) {
  sessionStorage.setItem(key, String(getSessionCount(key) + 1));
}
function getDayCount(key: string): number {
  const stored = localStorage.getItem(key);
  if (!stored) return 0;
  try {
    const { date, count } = JSON.parse(stored);
    if (date === new Date().toISOString().split('T')[0]) return count;
    return 0;
  } catch { return 0; }
}
function incrementDayCount(key: string) {
  const today = new Date().toISOString().split('T')[0];
  const current = getDayCount(key);
  localStorage.setItem(key, JSON.stringify({ date: today, count: current + 1 }));
}

interface NinjaAssistantProps {
  context?: 'homepage' | 'product' | 'checkout';
  productId?: string;
}

export function NinjaAssistant({ context = 'homepage', productId }: NinjaAssistantProps) {
  const { settings, setSettings } = useStore();
  const ninja = settings.ninjaSettings;

  const [activeState, setActiveState] = useState<NinjaState | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const [bubbleCoupon, setBubbleCoupon] = useState<string | undefined>();
  const [showCouponHunter, setShowCouponHunter] = useState(false);
  const mountedRef = useRef(true);
  const promoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkoutInactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkoutAppearCountRef = useRef(0);

  // Determine page visibility
  const pageAllowed = (
    (context === 'homepage' && ninja.showOnHomepage) ||
    (context === 'product' && ninja.showOnProductPage) ||
    (context === 'checkout' && ninja.showOnCheckout)
  );

  const incrementStat = useCallback((key: keyof typeof ninja.stats) => {
    setSettings(prev => ({
      ...prev,
      ninjaSettings: {
        ...prev.ninjaSettings,
        stats: { ...prev.ninjaSettings.stats, [key]: (prev.ninjaSettings.stats[key] || 0) + 1 },
      },
    }));
  }, [setSettings]);

  const pickPromoMessage = useCallback(() => {
    const active = ninja.promoMessages.filter(m => m.active);
    if (active.length === 0) return null;
    return active[Math.floor(Math.random() * active.length)];
  }, [ninja.promoMessages]);

  const pickCheckoutMessage = useCallback(() => {
    const active = ninja.checkoutMessages.filter(m => m.active);
    if (active.length === 0) return null;
    return active[Math.floor(Math.random() * active.length)];
  }, [ninja.checkoutMessages]);

  const pickCoupon = useCallback((): { code: string; label: string } | null => {
    if (ninja.rewardTiers?.length > 0) {
      const totalWeight = ninja.rewardTiers.reduce((s: number, t: NinjaRewardTier) => s + t.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const tier of ninja.rewardTiers) {
        roll -= tier.weight;
        if (roll <= 0) return { code: tier.code, label: tier.label };
      }
      const last = ninja.rewardTiers[ninja.rewardTiers.length - 1];
      return { code: last.code, label: last.label };
    }
    if (ninja.discountCodes?.length > 0) {
      const code = ninja.discountCodes[Math.floor(Math.random() * ninja.discountCodes.length)];
      return { code, label: '' };
    }
    return null;
  }, [ninja.rewardTiers, ninja.discountCodes]);

  // ─── PROMO ALERT SYSTEM ───
  useEffect(() => {
    if (!ninja.enabled || !ninja.promoEnabled || !ninja.statePromo || !pageAllowed) return;
    if (context === 'checkout') return; // Don't run promo in checkout
    mountedRef.current = true;

    const promoCooldownKey = 'ninja_promo_cooldown';
    const lastPromo = parseInt(localStorage.getItem(promoCooldownKey) || '0', 10);
    const cooldownMs = ninja.promoCooldownMinutes * 60 * 1000;
    if (Date.now() - lastPromo < cooldownMs) return;

    const delay = ninja.promoFrequencySeconds * 1000;

    promoTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      const msg = pickPromoMessage();
      if (!msg) return;

      setActiveState('promo');
      setBubbleMessage(msg.text);
      if (ninja.promoIncludesCoupon) {
        const coupon = pickCoupon();
        setBubbleCoupon(coupon?.code);
      } else {
        setBubbleCoupon(undefined);
      }
      setBubbleVisible(true);
      incrementStat('promoAlertsShown');
      incrementSessionCount(SESSION_PROMO_KEY);
      localStorage.setItem(promoCooldownKey, String(Date.now()));

      // Auto-hide after 10s
      setTimeout(() => {
        if (mountedRef.current) {
          setBubbleVisible(false);
          setActiveState(null);
        }
      }, 10000);
    }, delay);

    return () => {
      mountedRef.current = false;
      if (promoTimerRef.current) clearTimeout(promoTimerRef.current);
    };
  }, [ninja.enabled, ninja.promoEnabled, ninja.statePromo, ninja.promoFrequencySeconds, ninja.promoCooldownMinutes, pageAllowed, context, pickPromoMessage, pickCoupon, ninja.promoIncludesCoupon, incrementStat]);

  // ─── CHECKOUT HELPER SYSTEM ───
  useEffect(() => {
    if (context !== 'checkout') return;
    if (!ninja.enabled || !ninja.checkoutEnabled || !ninja.stateCheckoutHelper) return;
    mountedRef.current = true;

    const delay = ninja.checkoutDelaySeconds * 1000;

    checkoutTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      if (checkoutAppearCountRef.current >= ninja.checkoutMaxAppearances) return;

      const msg = pickCheckoutMessage();
      if (!msg) return;

      checkoutAppearCountRef.current++;
      setActiveState('checkout_helper');
      setBubbleMessage(msg.text);

      // If the message is the "click me" type and coupon is allowed
      if (ninja.checkoutCanRevealCoupon && msg.text.includes('clicar')) {
        setBubbleCoupon(undefined); // reveal on click
      } else {
        setBubbleCoupon(undefined);
      }
      setBubbleVisible(true);
      incrementStat('checkoutAppearances');
      incrementSessionCount(CHECKOUT_APPEAR_KEY);

      // Auto-hide after 12s
      setTimeout(() => {
        if (mountedRef.current) {
          setBubbleVisible(false);
          setActiveState(null);
        }
      }, 12000);
    }, delay);

    // Inactivity re-trigger
    const setupInactivity = () => {
      if (checkoutInactivityRef.current) clearTimeout(checkoutInactivityRef.current);
      checkoutInactivityRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        if (checkoutAppearCountRef.current >= ninja.checkoutMaxAppearances) return;
        if (activeState) return; // Already showing

        const msg = pickCheckoutMessage();
        if (!msg) return;

        checkoutAppearCountRef.current++;
        setActiveState('checkout_helper');
        setBubbleMessage(msg.text);
        setBubbleCoupon(undefined);
        setBubbleVisible(true);
        incrementStat('checkoutAppearances');

        setTimeout(() => {
          if (mountedRef.current) {
            setBubbleVisible(false);
            setActiveState(null);
          }
        }, 12000);
      }, ninja.checkoutInactivitySeconds * 1000);
    };

    // Reset inactivity timer on user interaction
    const events = ['click', 'scroll', 'touchstart', 'mousemove'];
    const handler = () => setupInactivity();
    events.forEach(e => document.addEventListener(e, handler, { passive: true }));
    setupInactivity();

    return () => {
      mountedRef.current = false;
      events.forEach(e => document.removeEventListener(e, handler));
      if (checkoutTimerRef.current) clearTimeout(checkoutTimerRef.current);
      if (checkoutInactivityRef.current) clearTimeout(checkoutInactivityRef.current);
    };
  }, [context, ninja.enabled, ninja.checkoutEnabled, ninja.stateCheckoutHelper, ninja.checkoutDelaySeconds, ninja.checkoutInactivitySeconds, ninja.checkoutMaxAppearances, ninja.checkoutCanRevealCoupon, pickCheckoutMessage, incrementStat, activeState]);

  // ─── COUPON HUNTER (existing Ninja3D behavior) ───
  useEffect(() => {
    if (!ninja.enabled || !ninja.stateCouponHunter || !pageAllowed) return;
    if (context === 'checkout') return; // Not in checkout

    const sessionCount = getSessionCount(SESSION_COUPON_KEY);
    const dayCount = getDayCount(DAY_COUPON_KEY);

    if (sessionCount >= ninja.couponMaxPerSession) return;
    if (dayCount >= ninja.couponMaxPerDay) return;

    setShowCouponHunter(true);
  }, [ninja.enabled, ninja.stateCouponHunter, ninja.couponMaxPerSession, ninja.couponMaxPerDay, pageAllowed, context]);

  const handleBubbleClose = useCallback(() => {
    setBubbleVisible(false);
    setActiveState(null);
  }, []);

  const handleBubbleCheckoutClick = useCallback(() => {
    if (activeState === 'checkout_helper' && ninja.checkoutCanRevealCoupon) {
      incrementStat('checkoutClicks');
      const coupon = pickCoupon();
      if (coupon) {
        setBubbleMessage('🥷 Cupom de desconto revelado!');
        setBubbleCoupon(coupon.code);
        incrementStat('couponsGenerated');
        incrementSessionCount(SESSION_COUPON_KEY);
        incrementDayCount(DAY_COUPON_KEY);
      }
    }
  }, [activeState, ninja.checkoutCanRevealCoupon, pickCoupon, incrementStat]);

  const handleCouponCopy = useCallback((code: string) => {
    if (ninja.couponAutoCopy) {
      // Already copied by the bubble component
    }
  }, [ninja.couponAutoCopy]);

  if (!ninja.enabled || !pageAllowed) return null;

  return (
    <>
      {/* Coupon Hunter (3D Ninja mascot) */}
      {showCouponHunter && context !== 'checkout' && <Ninja3D />}

      {/* Promo / Checkout bubble */}
      <NinjaBubble
        message={bubbleMessage}
        couponCode={bubbleCoupon}
        visible={bubbleVisible}
        onClose={handleBubbleClose}
        onCouponCopy={handleCouponCopy}
        position={context === 'checkout' ? 'bottom-left' : 'bottom-right'}
      />

      {/* Checkout: clickable mini ninja for coupon reveal */}
      {context === 'checkout' && activeState === 'checkout_helper' && ninja.checkoutCanRevealCoupon && !bubbleCoupon && bubbleVisible && (
        <button
          onClick={handleBubbleCheckoutClick}
          className="fixed z-[71] bottom-[140px] left-4 w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(18,181,255,0.15), rgba(18,181,255,0.05))',
            border: '1px solid rgba(18,181,255,0.25)',
            boxShadow: '0 0 16px rgba(18,181,255,0.2)',
          }}
        >
          <span className="text-lg">🥷</span>
        </button>
      )}
    </>
  );
}
