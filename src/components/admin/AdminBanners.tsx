import { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Edit2, Loader2, Save } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { HeroBanner } from '@/data/mockData';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from '@/hooks/use-toast';

export function AdminBanners() {
  const { heroBanners, setHeroBanners, settings, setSettings, saveAll } = useStore();
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', link: '', image: '' });
  const [saving, setSaving] = useState(false);

  const sorted = [...heroBanners].sort((a, b) => a.order - b.order);

  const startEdit = (banner: HeroBanner) => {
    setEditing(banner);
    setForm({ title: banner.title, subtitle: banner.subtitle || '', link: banner.link || '', image: banner.image || '' });
  };

  const startNew = () => {
    setEditing({ id: '', image: '', title: '', subtitle: '', link: '', active: true, order: heroBanners.length + 1 });
    setForm({ title: '', subtitle: '', link: '', image: '' });
  };

  const save = () => {
    if (!editing || !form.title.trim()) return;
    if (editing.id) {
      setHeroBanners(prev => prev.map(b => b.id === editing.id ? { ...b, ...form } : b));
    } else {
      const newBanner: HeroBanner = {
        id: String(Date.now()), image: form.image, title: form.title,
        subtitle: form.subtitle, link: form.link, active: true, order: heroBanners.length + 1,
      };
      setHeroBanners(prev => [...prev, newBanner]);
    }
    setEditing(null);
    toast({ title: '✅ Banner salvo!' });
  };

  const remove = (id: string) => setHeroBanners(prev => prev.filter(b => b.id !== id));
  const toggleActive = (id: string) => setHeroBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));

  const moveUp = (id: string) => {
    const idx = sorted.findIndex(b => b.id === id);
    if (idx <= 0) return;
    const n = [...sorted];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    setHeroBanners(n.map((b, i) => ({ ...b, order: i + 1 })));
  };

  const moveDown = (id: string) => {
    const idx = sorted.findIndex(b => b.id === id);
    if (idx >= sorted.length - 1) return;
    const n = [...sorted];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    setHeroBanners(n.map((b, i) => ({ ...b, order: i + 1 })));
  };

  const handlePersist = async () => {
    setSaving(true);
    try { await saveAll(); toast({ title: '✅ Banners salvos no banco!' }); }
    catch { toast({ title: '❌ Erro ao salvar', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <h3 className="font-serif font-semibold">{editing.id ? 'Editar Banner' : 'Novo Banner'}</h3>
        <ImageUpload value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} folder="banners" label="Imagem do banner" aspectRatio="aspect-[21/9]" />
        <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
        <div><Label>Subtítulo</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="mt-1" /></div>
        <div><Label>Link</Label><Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="#loja ou /referencias" className="mt-1" /></div>
        <div className="flex gap-2">
          <Button onClick={save} className="gold-gradient text-primary-foreground">Salvar</Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Autoplay</span>
            <Switch checked={settings.heroAutoplay} onCheckedChange={(v) => setSettings(prev => ({ ...prev, heroAutoplay: v }))} />
          </div>
          {settings.heroAutoplay && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Intervalo</span>
              <Input type="number" min={2} max={15} value={settings.autoplayInterval || 5}
                onChange={e => setSettings(prev => ({ ...prev, autoplayInterval: Number(e.target.value) }))} className="w-16 h-8 text-xs" />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={startNew} size="sm" className="gold-gradient text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
          <Button onClick={handlePersist} disabled={saving} variant="outline" size="sm" className="border-primary/30 text-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map(banner => (
          <div key={banner.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
            {banner.image && <img src={banner.image} alt="" className="h-10 w-16 rounded-lg object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className={`font-medium text-sm ${banner.active ? 'text-foreground' : 'text-muted-foreground'}`}>{banner.title}</p>
              {banner.subtitle && <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Switch checked={banner.active} onCheckedChange={() => toggleActive(banner.id)} />
              <button onClick={() => moveUp(banner.id)} className="p-1.5 hover:bg-secondary rounded"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveDown(banner.id)} className="p-1.5 hover:bg-secondary rounded"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => startEdit(banner)} className="p-1.5 hover:bg-secondary rounded"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(banner.id)} className="p-1.5 hover:bg-destructive/20 rounded text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
