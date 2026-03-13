import { motion } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from './ProductCard';
import { Product } from '@/data/mockData';

interface SimilarProductsProps {
  currentProduct: Product;
}

export function SimilarProducts({ currentProduct }: SimilarProductsProps) {
  const { products } = useStore();

  const similar = products
    .filter(p =>
      p.id !== currentProduct.id &&
      p.status === 'active' &&
      p.categoryId === currentProduct.categoryId
    )
    .slice(0, 4);

  if (similar.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="font-serif font-semibold text-sm text-foreground mb-3">Produtos similares</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible">
        {similar.map(p => (
          <div key={p.id} className="min-w-[160px] snap-start md:min-w-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
