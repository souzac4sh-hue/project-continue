import { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Link as LinkIcon, Loader2, Save } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Product, BADGE_OPTIONS, generateSlug } from '@/data/mockData';
import { ImageUpload } from '@/components/admin/ImageUpload';

export function AdminProducts() {
  const { products, setProducts, categories, saveAll } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setCurrent({ name: '', description: '', price: 0, categoryId: categories[0]?.id || '', status: 'active', image: '', badge: null, slug: '' });
    setEditOpen(true);
  };

  const openEdit = (p: Product) => {
    setCurrent({ ...p });
    setEditOpen(true);
  };

  const save = () => {
    if (!current.name?.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    const slug = current.slug || generateSlug(current.name!);
    if (current.id) {
      setProducts(prev => prev.map(p => p.id === current.id ? { ...p, ...current, slug } as Product : p));
    } else {
      const newP: Product = { ...current, id: Date.now().toString(), slug } as Product;
      setProducts(prev => [...prev, newP]);
    }
    setEditOpen(false);
    toast({ title: '✅ Produto salvo!' });
  };

  const remove = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Produto removido' });
  };

  const copyLink = (product: Product) => {
    const url = `${window.location.origin}/produto/${product.slug || product.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: '🔗 Link copiado!' });
  };

  const handlePersist = async () => {
    setSaving(true);
    try {
      await saveAll();
      toast({ title: '✅ Produtos salvos no banco!' });
    } catch {
      toast({ title: '❌ Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={openNew} className="gold-gradient text-primary-foreground flex-1">
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
        <Button onClick={handlePersist} disabled={saving} variant="outline" className="border-primary/30 text-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
        </Button>
      </div>

      <div className="grid gap-3">
        {products.map(p => (
          <div key={p.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
            {p.image && (
              <img src={p.image} alt={p.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                R$ {p.price.toFixed(2)} · {p.status === 'active' ? 'Ativo' : 'Inativo'}
                {p.badge && ` · ${BADGE_OPTIONS.find(b => b.value === p.badge)?.label}`}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => copyLink(p)} className="p-2 rounded-lg hover:bg-secondary" title="Copiar link"><LinkIcon className="h-4 w-4 text-primary" /></button>
              <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-destructive/20"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">{current.id ? 'Editar' : 'Novo'} Produto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              value={current.image || ''}
              onChange={url => setCurrent(c => ({ ...c, image: url }))}
              folder="products"
              label="Imagem do produto"
            />
            <div><Label>Nome</Label><Input value={current.name || ''} onChange={e => setCurrent(c => ({ ...c, name: e.target.value, slug: generateSlug(e.target.value) }))} className="mt-1" /></div>
            <div><Label>Categoria</Label>
              <Select value={current.categoryId || ''} onValueChange={v => setCurrent(c => ({ ...c, categoryId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição curta</Label><Input value={current.description || ''} onChange={e => setCurrent(c => ({ ...c, description: e.target.value }))} className="mt-1" /></div>
            <div><Label>Descrição completa</Label><Textarea value={current.fullDescription || ''} onChange={e => setCurrent(c => ({ ...c, fullDescription: e.target.value }))} className="mt-1" /></div>
            <div><Label>Preço (R$)</Label><Input type="number" value={current.price || 0} onChange={e => setCurrent(c => ({ ...c, price: Number(e.target.value) }))} className="mt-1" /></div>
            
            <div>
              <Label>Selo do produto</Label>
              <Select value={current.badge || 'none'} onValueChange={v => setCurrent(c => ({ ...c, badge: v === 'none' ? null : v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {BADGE_OPTIONS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2"><Switch checked={current.featured || false} onCheckedChange={v => setCurrent(c => ({ ...c, featured: v }))} /><Label>Destaque</Label></div>
              <div className="flex items-center gap-2"><Switch checked={current.bestSeller || false} onCheckedChange={v => setCurrent(c => ({ ...c, bestSeller: v }))} /><Label>Mais vendido</Label></div>
              <div className="flex items-center gap-2"><Switch checked={current.promotion || false} onCheckedChange={v => setCurrent(c => ({ ...c, promotion: v }))} /><Label>Promo</Label></div>
            </div>
            {current.promotion && <div><Label>Preço promo (R$)</Label><Input type="number" value={current.promotionPrice || 0} onChange={e => setCurrent(c => ({ ...c, promotionPrice: Number(e.target.value) }))} className="mt-1" /></div>}
            <div><Label>URL do vídeo</Label><Input value={current.videoUrl || ''} onChange={e => setCurrent(c => ({ ...c, videoUrl: e.target.value }))} className="mt-1" /></div>
            <div><Label>Observações</Label><Textarea value={current.notes || ''} onChange={e => setCurrent(c => ({ ...c, notes: e.target.value }))} className="mt-1" /></div>
            <div><Label>Status</Label>
              <Select value={current.status || 'active'} onValueChange={v => setCurrent(c => ({ ...c, status: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={save} className="w-full gold-gradient text-primary-foreground font-bold">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
