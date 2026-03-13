import { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Loader2, Save } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Category } from '@/data/mockData';

const ICON_OPTIONS = [
  { value: 'Info', label: 'ℹ️ Info' },
  { value: 'Gamepad2', label: '🎮 Gamepad' },
  { value: 'BookOpen', label: '📖 Book' },
  { value: 'GraduationCap', label: '🎓 Graduation' },
  { value: 'Layers', label: '📚 Layers' },
];

const COLOR_OPTIONS = [
  { value: '#a855f7', label: '💜 Roxo' },
  { value: '#3b82f6', label: '💙 Azul' },
  { value: '#f59e0b', label: '🟡 Dourado' },
  { value: '#10b981', label: '💚 Verde' },
  { value: '#ef4444', label: '❤️ Vermelho' },
  { value: '#ec4899', label: '💗 Rosa' },
];

export function AdminCategories() {
  const { categories, setCategories, saveAll } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Category>>({});
  const [saving, setSaving] = useState(false);

  const openNew = () => { setCurrent({ name: '', active: true, order: categories.length + 1, icon: 'Layers', color: '#a855f7', description: '' }); setEditOpen(true); };
  const openEdit = (c: Category) => { setCurrent({ ...c }); setEditOpen(true); };

  const save = () => {
    if (!current.name?.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    if (current.id) {
      setCategories(prev => prev.map(c => c.id === current.id ? { ...c, ...current } as Category : c));
    } else {
      setCategories(prev => [...prev, { ...current, id: Date.now().toString() } as Category]);
    }
    setEditOpen(false);
    toast({ title: '✅ Categoria salva!' });
  };

  const remove = (id: string) => { setCategories(prev => prev.filter(c => c.id !== id)); toast({ title: 'Categoria removida' }); };

  const handlePersist = async () => {
    setSaving(true);
    try { await saveAll(); toast({ title: '✅ Categorias salvas no banco!' }); }
    catch { toast({ title: '❌ Erro ao salvar', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={openNew} className="gold-gradient text-primary-foreground flex-1"><Plus className="h-4 w-4 mr-2" /> Nova Categoria</Button>
        <Button onClick={handlePersist} disabled={saving} variant="outline" className="border-primary/30 text-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
        </Button>
      </div>
      <div className="grid gap-2">
        {sorted.map(c => (
          <div key={c.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color || '#a855f7' }} />
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.active ? 'Ativa' : 'Inativa'} · {c.icon || 'Layers'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-destructive/20"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-serif">{current.id ? 'Editar' : 'Nova'} Categoria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={current.name || ''} onChange={e => setCurrent(c => ({ ...c, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Descrição</Label><Input value={current.description || ''} onChange={e => setCurrent(c => ({ ...c, description: e.target.value }))} className="mt-1" placeholder="Breve descrição da categoria" /></div>
            <div>
              <Label>Ícone</Label>
              <Select value={current.icon || 'Layers'} onValueChange={v => setCurrent(c => ({ ...c, icon: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ICON_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor do destaque</Label>
              <Select value={current.color || '#a855f7'} onValueChange={v => setCurrent(c => ({ ...c, color: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{COLOR_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Ordem</Label><Input type="number" value={current.order || 1} onChange={e => setCurrent(c => ({ ...c, order: Number(e.target.value) }))} className="mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={current.active ?? true} onCheckedChange={v => setCurrent(c => ({ ...c, active: v }))} /><Label>Ativa</Label></div>
            <Button onClick={save} className="w-full gold-gradient text-primary-foreground font-bold">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
