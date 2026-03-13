import { motion } from 'framer-motion';
import { Info, Gamepad2, BookOpen, GraduationCap, Layers, ChevronRight, type LucideIcon } from 'lucide-react';
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
      <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-primary/[0.18] bg-card relative overflow-hidden group transition-all duration-300 hover:border-primary/[0.35] hover:shadow-[0_0_26px_rgba(18,181,255,0.12)]"
        style={{ background: 'linear-gradient(135deg, hsl(214 38% 9%), hsl(213 32% 7%))' }}
      >
        {/* Radial glow */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/[0.06] blur-2xl pointer-events-none group-hover:bg-primary/[0.10] transition-all duration-500" />
        {/* Top highlight */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/[0.14] border border-primary/20 flex items-center justify-center shadow-[0_0_14px_rgba(10,132,255,0.08)] group-hover:shadow-[0_0_18px_rgba(10,132,255,0.14)] group-hover:border-primary/30 transition-all duration-300">
            <Icon className="h-4 w-4 text-primary/80 group-hover:text-primary transition-colors duration-300" />
          </div>
          <span className="font-serif font-semibold text-sm text-foreground tracking-wide">{category.name}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors duration-300" />
        </div>
      </div>
    </motion.div>
  );
}
