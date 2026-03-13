import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity as ActivityIcon, X, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export function FloatingNotifications() {
  const { activities } = useStore();
  const notifications = activities.filter(a => a.active && a.showAsNotification);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const showNext = useCallback(() => {
    if (notifications.length === 0 || dismissed) return;
    setVisible(true);
    const current = notifications[currentIndex % notifications.length];
    const duration = (current.duration || 5) * 1000;

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % notifications.length);
      }, 400);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [currentIndex, notifications, dismissed]);

  useEffect(() => {
    if (notifications.length === 0 || dismissed) return;

    const initialDelay = setTimeout(() => {
      showNext();
    }, 15000);

    return () => clearTimeout(initialDelay);
  }, [dismissed, notifications.length]);

  useEffect(() => {
    if (!visible && notifications.length > 0 && !dismissed) {
      const current = notifications[currentIndex % notifications.length];
      const interval = (current.interval || 8) * 1000;
      const timer = setTimeout(() => {
        showNext();
      }, interval);
      return () => clearTimeout(timer);
    }
  }, [visible, currentIndex, showNext, dismissed]);

  if (notifications.length === 0) return null;

  const current = notifications[currentIndex % notifications.length];
  const hasProduct = !!current.productId;
  const NotifIcon = hasProduct ? ShoppingBag : ActivityIcon;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-6 md:bottom-20 md:max-w-xs pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="pointer-events-auto glass-card rounded-xl px-4 py-3 flex items-center gap-3 border-primary/25 shadow-[0_4px_24px_hsl(43_74%_49%/0.15)]"
          >
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <NotifIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-xs text-foreground/90 flex-1 leading-relaxed">
              {current.displayName && (
                <span className="font-semibold text-primary">{current.displayName} </span>
              )}
              {current.message}
            </p>
            <button
              onClick={() => { setVisible(false); setDismissed(true); }}
              className="shrink-0 p-1 rounded-md hover:bg-secondary text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
