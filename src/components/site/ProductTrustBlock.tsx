import { motion } from 'framer-motion';
import { Zap, Shield, CreditCard } from 'lucide-react';

const trustItems = [
  {
    icon: Zap,
    title: 'Entrega imediata',
    description: 'Receba seu pacote rapidamente após confirmação.',
    color: 'hsl(200, 100%, 50%)',
    bg: 'hsl(200, 100%, 50%, 0.12)',
  },
  {
    icon: Shield,
    title: 'Segurança total',
    description: 'Seus dados são protegidos durante todo o processo.',
    color: 'hsl(160, 70%, 45%)',
    bg: 'hsl(160, 70%, 45%, 0.12)',
  },
  {
    icon: CreditCard,
    title: 'Pagamento via Pix',
    description: 'Pagamento simples, rápido e sem complicação.',
    color: 'hsl(210, 100%, 55%)',
    bg: 'hsl(210, 100%, 55%, 0.12)',
  },
];

export function ProductTrustBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      <h3 className="font-serif font-semibold text-sm text-foreground">Por que comprar aqui</h3>
      <div className="grid gap-2.5">
        {trustItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-card rounded-xl p-3.5 flex items-start gap-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${item.color}20` }}
            >
              <item.icon className="h-4.5 w-4.5" style={{ color: item.color }} />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
