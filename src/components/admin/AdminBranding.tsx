import { useStore } from '@/context/StoreContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export function AdminBranding() {
  const { settings, setSettings, saveAll } = useStore();
  const { brand } = settings;
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      brand: { ...prev.brand, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAll();
      toast({ title: '✅ Branding salvo!' });
    } catch {
      toast({ title: '❌ Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Identidade da Marca</h3>
        <div>
          <Label>Nome da marca</Label>
          <Input value={brand.brandName} onChange={e => update('brandName', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Slogan</Label>
          <Input value={brand.slogan} onChange={e => update('slogan', e.target.value)} className="mt-1" placeholder="Ex: Operação consolidada no mercado black" />
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Logo</h3>
        <ImageUpload
          value={brand.logoUrl}
          onChange={(url) => update('logoUrl', url)}
          folder="branding"
          label="Imagem da logo"
        />
        <div className="flex items-center gap-2">
          <Switch checked={brand.logoAnimation} onCheckedChange={v => update('logoAnimation', v)} />
          <Label>Animação da logo no header</Label>
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Mascote / Personagem</h3>
        <ImageUpload
          value={brand.mascotUrl}
          onChange={(url) => update('mascotUrl', url)}
          folder="branding"
          label="Imagem do mascote ninja"
        />
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full gold-gradient text-primary-foreground font-bold">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Branding'}
      </Button>
    </div>
  );
}
