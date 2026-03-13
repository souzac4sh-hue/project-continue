import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { SiteHeader } from '@/components/site/SiteHeader';
import { HeroCarousel } from '@/components/site/HeroCarousel';
import { HeroCTAButtons } from '@/components/site/HeroCTAButtons';
import { TrustBar } from '@/components/site/TrustBar';
import { AuthoritySection } from '@/components/site/AuthoritySection';
import { ProductSearch } from '@/components/site/ProductSearch';
import { CategoryGrid } from '@/components/site/CategoryGrid';
import { CategorySectionHeader } from '@/components/site/CategorySectionHeader';
import { ProductCard } from '@/components/site/ProductCard';
import { SocialProofSection } from '@/components/site/SocialProofSection';
import { ReferencesPreview } from '@/components/site/ReferencesPreview';
import { VipCTA } from '@/components/site/VipCTA';
import { SiteFooter } from '@/components/site/SiteFooter';
import { FloatingButtons } from '@/components/site/FloatingButtons';
import { FloatingNotifications } from '@/components/site/FloatingNotifications';
import { StoreModeBanner } from '@/components/site/StoreModeBanner';
import { MaintenanceScreen } from '@/components/site/MaintenanceScreen';
import { AnimatedSection } from '@/components/site/AnimatedSection';
import { NinjaMascot } from '@/components/site/NinjaMascot';
import { Flame } from 'lucide-react';

export default function ShopPage() {
  const { products, categories, settings, settingsLoaded } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Show maintenance screen if enabled
  if (settingsLoaded && settings.maintenanceMode) {
    return <MaintenanceScreen />;
  }

  const activeProducts = products.filter(p => p.status === 'active');
  const bestSellers = activeProducts.filter(p => p.bestSeller || p.featured);
  const activeCategories = categories.filter(c => c.active).sort((a, b) => a.order - b.order);

  const filteredProducts = selectedCategory
    ? activeProducts.filter(p => p.categoryId === selectedCategory)
    : null;

  const selectedCat = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <StoreModeBanner />
      <HeroCarousel />
      <HeroCTAButtons />
      <TrustBar />
      <AuthoritySection />
      <ProductSearch />
      <CategoryGrid onSelectCategory={setSelectedCategory} selectedCategory={selectedCategory} />

      <div className="container pb-24" id="loja">
        {selectedCategory && selectedCat ? (
          <AnimatedSection className="mb-10">
            <CategorySectionHeader category={selectedCat} />
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts?.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {filteredProducts?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto nesta categoria</p>
            )}
          </AnimatedSection>
        ) : (
          <>
            {bestSellers.length > 0 && (
              <AnimatedSection className="mb-8">
                <h2 className="font-serif text-lg font-bold mb-1 flex items-center gap-2 text-foreground">
                  <Flame className="h-5 w-5 text-orange-500" /> Mais procurados da C4SH STORE
                </h2>
                <p className="text-xs text-muted-foreground mb-4">Os conteúdos e métodos mais acessados pelos clientes.</p>
                <div className="grid grid-cols-2 gap-3">
                  {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </AnimatedSection>
            )}

            {activeCategories.map(cat => {
              const catProducts = activeProducts.filter(p => p.categoryId === cat.id);
              if (catProducts.length === 0) return null;
              return (
                <AnimatedSection key={cat.id} className="mb-8">
                  <CategorySectionHeader category={cat} />
                  <div className="grid grid-cols-2 gap-3">
                    {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </AnimatedSection>
              );
            })}
          </>
        )}
      </div>

      <SocialProofSection />
      <ReferencesPreview />
      <VipCTA />
      <SiteFooter />
      <FloatingButtons />
      <FloatingNotifications />
    </div>
  );
}
