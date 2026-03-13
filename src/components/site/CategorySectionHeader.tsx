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
  const color = category.color || 'hsl(var(--primary))';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-4"
    >
      <div
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border backdrop-blur-sm"
        style={{
          borderColor: `${color}40`,
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          boxShadow: `0 0 20px ${color}15, inset 0 1px 0 ${color}20`,
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: `${color}25` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="font-serif font-semibold text-sm text-foreground">{category.name}</span>
      </div>
    </motion.div>
  );
}
