/**
 * ⚠️ TEMPORARY MVP AUTH GUARD - NOT FOR PRODUCTION ⚠️
 * Uses sessionStorage check only. Replace with real backend auth before launch.
 */

import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ShoppingBag, Layers, BookOpen, Star, ClipboardList,
  Bell, Settings, ArrowLeft, ChevronRight, Image, LogOut,
  TrendingUp, Calendar, CalendarDays, Award, DollarSign, FileText,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { AdminProducts } from '@/components/admin/AdminProducts';
import { AdminCategories } from '@/components/admin/AdminCategories';
import { AdminMethods } from '@/components/admin/AdminMethods';
import { AdminReferences } from '@/components/admin/AdminReferences';
import { AdminOrders } from '@/components/admin/AdminOrders';
import { AdminActivities } from '@/components/admin/AdminActivities';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminBanners } from '@/components/admin/AdminBanners';
import { AdminBranding } from '@/components/admin/AdminBranding';
import { AdminPixOrders } from '@/components/admin/AdminPixOrders';
import { AdminSiteTexts } from '@/components/admin/AdminSiteTexts';

const modules = [
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'categories', label: 'Categorias', icon: Layers },
  { id: 'banners', label: 'Banners Hero', icon: Image },
  { id: 'methods', label: 'Métodos', icon: BookOpen },
  { id: 'references', label: 'Referências', icon: Star },
  { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  { id: 'pix_orders', label: 'Financeiro Pix', icon: DollarSign },
  { id: 'activities', label: 'Atividade', icon: Bell },
  { id: 'branding', label: 'Branding', icon: Award },
  { id: 'site_texts', label: 'Textos do Site', icon: FileText },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function AdminPage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const store = useStore();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const ordersToday = store.orders.filter(o => o.date >= today).length;
    const ordersWeek = store.orders.filter(o => o.date >= weekAgo).length;
    const ordersMonth = store.orders.filter(o => o.date >= monthAgo).length;

    const productCounts: Record<string, number> = {};
    store.orders.forEach(o => {
      productCounts[o.productName] = (productCounts[o.productName] || 0) + 1;
    });
    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return { ordersToday, ordersWeek, ordersMonth, topProduct };
  }, [store.orders]);

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    clearAdminSession();
    window.location.href = '/admin/login';
  };




  const renderModule = () => {
    switch (activeModule) {
      case 'products': return <AdminProducts />;
      case 'categories': return <AdminCategories />;
      case 'banners': return <AdminBanners />;
      case 'methods': return <AdminMethods />;
      case 'references': return <AdminReferences />;
      case 'orders': return <AdminOrders />;
      case 'pix_orders': return <AdminPixOrders />;
      case 'activities': return <AdminActivities />;
      case 'branding': return <AdminBranding />;
      case 'site_texts': return <AdminSiteTexts />;
      case 'settings': return <AdminSettings />;
      default: return null;
    }
  };

  if (activeModule) {
    const mod = modules.find(m => m.id === activeModule);
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center gap-3">
            <button onClick={() => setActiveModule(null)} className="p-2 rounded-lg hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-serif font-bold text-lg">{mod?.label}</h1>
          </div>
        </header>
        <div className="container py-6 pb-20">
          {renderModule()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-lg">Painel Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Ver site</Link>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoje</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.ordersToday}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Semana</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.ordersWeek}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mês</p>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.ordersMonth}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top produto</p>
            </div>
            <p className="text-sm font-bold text-primary truncate">{stats.topProduct}</p>
          </div>
        </div>

        <h2 className="font-serif text-lg font-semibold mb-4">Módulos</h2>
        <div className="grid gap-2">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className="flex items-center justify-between p-4 rounded-xl glass-card hover:border-primary/30 transition-colors w-full text-left"
            >
              <div className="flex items-center gap-3">
                <mod.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{mod.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
