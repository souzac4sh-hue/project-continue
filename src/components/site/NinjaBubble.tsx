import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface NinjaBubbleProps {
  message: string;
  couponCode?: string;
  visible: boolean;
  onClose: () => void;
  onCouponCopy?: (code: string) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
  variant?: 'bubble' | 'banner';
}

export function NinjaBubble({
  message,
  couponCode,
  visible,
  onClose,
  onCouponCopy,
  position = 'bottom-right',
  variant = 'bubble',
}: NinjaBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    onCouponCopy?.(couponCode);
    setTimeout(() => setCopied(false), 2500);
  };

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`fixed z-[70] ${positionClasses[position]} max-w-[280px]`}
        >
          <div
            className="rounded-2xl p-4 border relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(220 20% 8% / 0.97), hsl(220 15% 12% / 0.97))',
              borderColor: 'rgba(18,181,255,0.2)',
              boxShadow: '0 0 30px rgba(18,181,255,0.08), 0 8px 32px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Glow accent */}
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(18,181,255,0.06), transparent)' }}
            />

            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary/50 text-muted-foreground z-10"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-3">
              {/* Ninja icon */}
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(18,181,255,0.12), rgba(18,181,255,0.04))',
                  border: '1px solid rgba(18,181,255,0.2)',
                  boxShadow: '0 0 12px rgba(18,181,255,0.15)',
                }}
              >
                <span className="text-sm">🥷</span>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-xs font-medium text-foreground leading-relaxed pr-4">
                  {message}
                </p>

                {couponCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <div
                      className="rounded-lg px-3 py-2 font-mono text-sm font-bold tracking-wider text-center"
                      style={{
                        background: 'rgba(18,181,255,0.06)',
                        border: '1px solid rgba(18,181,255,0.15)',
                        color: 'hsl(200, 100%, 80%)',
                      }}
                    >
                      {couponCode}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, hsl(200, 100%, 50%), hsl(200, 100%, 38%))',
                        color: 'white',
                        boxShadow: '0 0 12px rgba(18,181,255,0.2)',
                      }}
                    >
                      {copied ? (
                        <><Check className="h-3 w-3" /> Copiado!</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copiar código</>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
