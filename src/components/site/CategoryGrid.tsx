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
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
        {allItems.map((item) => {
          const isActive = selectedCategory === item.id;
          return (
            <motion.button
              key={item.id ?? 'all'}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(item.id)}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-[10px] font-medium transition-all duration-300 shrink-0 min-w-[72px] ${
                isActive
                  ? 'gold-gradient text-primary-foreground shadow-md shadow-primary/20'
                  : 'glass-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              <span className="leading-tight text-center whitespace-nowrap">{item.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
