import { Layers, Info, Gamepad2, BookOpen, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/StoreContext';

interface CategoryGridProps {
  onSelectCategory: (id: string | null) => void;
  selectedCategory: string | null;
}

const categoryIcons: Record<string, typeof Layers> = {
  infos: Info,
  recargas: Gamepad2,
  metodos: BookOpen,
  cursos: GraduationCap,
};

export function CategoryGrid({ onSelectCategory, selectedCategory }: CategoryGridProps) {
  const { categories } = useStore();
  const activeCategories = categories.filter(c => c.active).sort((a, b) => a.order - b.order);

  if (activeCategories.length === 0) return null;

  const allItems = [
    { id: null, name: 'Todos', icon: Layers },
    ...activeCategories.map(cat => ({
      id: cat.id,
      name: cat.name.split(' / ')[0],
      icon: categoryIcons[cat.id] || Layers,
    })),
  ];

  return (
    <div className="container py-5">
      <h3 className="font-serif text-base font-semibold mb-3 text-foreground">Categorias</h3>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
        {allItems.map((item) => {
          const isActive = selectedCategory === item.id;
          return (
            <motion.button
              key={item.id ?? 'all'}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
              onClick={() => onSelectCategory(item.id)}
              aria-pressed={isActive}
              className={`relative flex flex-col items-center gap-2 p-3.5 rounded-2xl text-[10px] font-medium shrink-0 min-w-[76px] border overflow-hidden transition-all duration-300 ${
                isActive
                  ? 'border-primary/[0.35] text-foreground shadow-[0_0_26px_rgba(18,181,255,0.14)]'
                  : 'border-primary/[0.12] text-muted-foreground hover:text-foreground hover:border-primary/[0.25] hover:shadow-[0_0_18px_rgba(18,181,255,0.08)]'
              }`}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, hsl(213 32% 12%), hsl(213 36% 8%))'
                  : 'linear-gradient(135deg, hsl(214 38% 9%), hsl(213 32% 7%))',
              }}
            >
              {/* Radial glow for active */}
              {isActive && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary/[0.08] blur-2xl pointer-events-none" />
              )}
              {/* Top highlight */}
              <div className={`absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent to-transparent transition-opacity duration-300 ${
                isActive ? 'via-primary/25 opacity-100' : 'via-primary/10 opacity-0 group-hover:opacity-100'
              }`} />

              <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isActive
                  ? 'bg-primary/[0.16] border-primary/25 shadow-[0_0_14px_rgba(10,132,255,0.10)]'
                  : 'bg-secondary border-border/30 hover:border-primary/15'
              }`}>
                <item.icon className={`h-4 w-4 transition-colors duration-300 ${isActive ? 'text-primary/90' : ''}`} />
              </div>
              <span className="relative z-10 leading-tight text-center whitespace-nowrap font-semibold">{item.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
