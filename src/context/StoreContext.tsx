import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  products as mockProducts,
  categories as mockCategories,
  methods as mockMethods,
  references as mockReferences,
  orders as mockOrders,
  activities as mockActivities,
  heroBanners as mockHeroBanners,
  heroButtons as mockHeroButtons,
  defaultSettings,
  Product, Category, Method, Reference, Order, Activity, Settings, HeroBanner, HeroButton,
} from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

interface StoreContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  methods: Method[];
  setMethods: React.Dispatch<React.SetStateAction<Method[]>>;
  references: Reference[];
  setReferences: React.Dispatch<React.SetStateAction<Reference[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  heroBanners: HeroBanner[];
  setHeroBanners: React.Dispatch<React.SetStateAction<HeroBanner[]>>;
  heroButtons: HeroButton[];
  setHeroButtons: React.Dispatch<React.SetStateAction<HeroButton[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Order;
  saveAll: () => Promise<void>;
  settingsLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Full state shape stored in DB
interface StoredData {
  settings: Settings;
  products: Product[];
  categories: Category[];
  methods: Method[];
  references: Reference[];
  activities: Activity[];
  heroBanners: HeroBanner[];
  heroButtons: HeroButton[];
  orders: Order[];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [methods, setMethods] = useState<Method[]>(mockMethods);
  const [references, setReferences] = useState<Reference[]>(mockReferences);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(mockHeroBanners);
  const [heroButtons, setHeroButtons] = useState<HeroButton[]>(mockHeroButtons);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load all data from DB on mount
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('site_config')
          .select('settings')
          .eq('id', 'main')
          .maybeSingle();

        if (!error && data?.settings) {
          const saved = data.settings as unknown as Partial<StoredData>;
          if (saved.settings) setSettings(deepMerge(defaultSettings, saved.settings) as Settings);
          if (saved.products?.length) setProducts(saved.products);
          if (saved.categories?.length) setCategories(saved.categories);
          if (saved.methods?.length) setMethods(saved.methods);
          if (saved.references?.length) setReferences(saved.references);
          if (saved.activities?.length) setActivities(saved.activities);
          if (saved.heroBanners?.length) setHeroBanners(saved.heroBanners);
          if (saved.heroButtons?.length) setHeroButtons(saved.heroButtons);
          if (saved.orders?.length) setOrders(saved.orders);
        }
      } catch {
        // Use defaults silently
      } finally {
        setSettingsLoaded(true);
      }
    };
    load();
  }, []);

  // Use refs to get latest state in saveAll without re-creating the callback
  const stateRef = useRef<StoredData>({
    settings, products, categories, methods, references,
    activities, heroBanners, heroButtons, orders,
  });
  useEffect(() => {
    stateRef.current = {
      settings, products, categories, methods, references,
      activities, heroBanners, heroButtons, orders,
    };
  }, [settings, products, categories, methods, references, activities, heroBanners, heroButtons, orders]);

  const saveAll = useCallback(async () => {
    const payload = JSON.parse(JSON.stringify(stateRef.current));

    // ── STRIP SENSITIVE CREDENTIALS ──
    // Remove payment provider secrets from the publicly-readable settings JSONB
    const SENSITIVE_KEYS = ['pixToken', 'pixKey', 'pixWebhook'];
    if (payload.settings && typeof payload.settings === 'object') {
      for (const key of SENSITIVE_KEYS) {
        if (key in payload.settings) {
          delete payload.settings[key];
        }
      }
    }

    try {
      // Check if row exists
      const { data: existing } = await supabase
        .from('site_config')
        .select('id')
        .eq('id', 'main')
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('site_config')
          .update({ settings: payload, updated_at: new Date().toISOString() })
          .eq('id', 'main');
        error = result.error;
      } else {
        const result = await supabase
          .from('site_config')
          .insert([{ id: 'main', settings: payload }]);
        error = result.error;
      }
      if (error) throw error;
    } catch (err) {
      console.error('Failed to save store data:', err);
      throw err;
    }
  }, []);

  const addOrder = (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `PED${String(orders.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'new',
    };
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  return (
    <StoreContext.Provider value={{
      products, setProducts,
      categories, setCategories,
      methods, setMethods,
      references, setReferences,
      orders, setOrders,
      activities, setActivities,
      heroBanners, setHeroBanners,
      heroButtons, setHeroButtons,
      settings, setSettings,
      addOrder,
      saveAll,
      settingsLoaded,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
    return source;
  }
  if (Array.isArray(source)) return source;
  const result = { ...(target as Record<string, unknown>) };
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const sv = (source as Record<string, unknown>)[key];
    if (key in result && typeof result[key] === 'object' && typeof sv === 'object' && !Array.isArray(sv) && sv !== null) {
      result[key] = deepMerge(result[key], sv);
    } else {
      result[key] = sv;
    }
  }
  return result;
}
