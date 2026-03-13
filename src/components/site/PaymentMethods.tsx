import { motion } from 'framer-motion';

export function PaymentMethods() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4"
    >
      <h3 className="font-serif font-semibold text-sm text-foreground mb-3">Formas de pagamento</h3>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold gold-text">₱</span>
          </div>
          <span className="text-sm font-medium text-foreground">Pix</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Pagamento instantâneo e sem taxas adicionais.</p>
    </motion.div>
  );
}
