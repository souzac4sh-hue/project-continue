import { motion } from 'framer-motion';
import { Info, Gamepad2, BookOpen, GraduationCap, Layers, type LucideIcon } from 'lucide-react';
import { Category } from '@/data/mockData';

const iconMap: Record<string, LucideIcon> = {
  Info,
  Gamepad2,
  BookOpen,
  GraduationCap,
  Layers,
};

export function CategorySectionHeader({ category }: { category: Category }) {
  const Icon = iconMap[category.icon || ''] || Layers;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-4"
    >
      <div
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-border/60"
        style={{
          boxShadow: '0 0 14px rgba(0,178,255,0.06)',
        }}
      >
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary/80" />
        </div>
        <span className="font-serif font-semibold text-sm text-foreground">{category.name}</span>
      </div>
    </motion.div>
  );
}
