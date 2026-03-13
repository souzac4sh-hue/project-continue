import { useStore } from '@/context/StoreContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AuthorityStat, TrustBarItem } from '@/data/mockData';

export function AdminSiteTexts() {
  const { settings, setSettings, saveAll } = useStore();
  const [saving, setSaving] = useState(false);
  const ct = settings.checkoutTexts;

  const updateCt = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      checkoutTexts: { ...prev.checkoutTexts, [key]: value },
    }));
  };

  const updateStat = (index: number, field: keyof AuthorityStat, value: any) => {
    setSettings(prev => {
      const stats = [...prev.authorityStats];
      stats[index] = { ...stats[index], [field]: field === 'value' ? Number(value) : value };
      return { ...prev, authorityStats: stats };
    });
  };

  const updateTrustItem = (index: number, text: string) => {
    setSettings(prev => {
      const items = [...prev.trustBarItems];
      items[index] = { text };
      return { ...prev, trustBarItems: items };
    });
  };

  const addTrustItem = () => {
    setSettings(prev => ({
      ...prev,
      trustBarItems: [...prev.trustBarItems, { text: 'Novo item' }],
    }));
  };

  const removeTrustItem = (index: number) => {
    setSettings(prev => ({
      ...prev,
      trustBarItems: prev.trustBarItems.filter((_, i) => i !== index),
    }));
  };

  const updateSocialProof = (index: number, value: string) => {
    setSettings(prev => {
      const names = [...prev.socialProofNames];
      names[index] = value;
      return { ...prev, socialProofNames: names };
    });
  };

  const addSocialProof = () => {
    setSettings(prev => ({
      ...prev,
      socialProofNames: [...prev.socialProofNames, 'No** de XX'],
    }));
  };

  const removeSocialProof = (index: number) => {
    setSettings(prev => ({
      ...prev,
      socialProofNames: prev.socialProofNames.filter((_, i) => i !== index),
    }));
  };

  const updateReview = (index: number, field: string, value: any) => {
    setSettings(prev => {
      const reviews = [...prev.fakeReviews];
      reviews[index] = { ...reviews[index], [field]: field === 'rating' ? Number(value) : value };
      return { ...prev, fakeReviews: reviews };
    });
  };

  const addReview = () => {
    setSettings(prev => ({
      ...prev,
      fakeReviews: [...prev.fakeReviews, { name: 'Novo**', text: 'Ótimo produto!', rating: 5, time: 'há 1 dia' }],
    }));
  };

  const removeReview = (index: number) => {
    setSettings(prev => ({
      ...prev,
      fakeReviews: prev.fakeReviews.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAll();
      toast({ title: '✅ Textos salvos!' });
    } catch {
      toast({ title: '❌ Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Authority Stats */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Estatísticas de Autoridade</h3>
        <p className="text-xs text-muted-foreground">Números exibidos na seção de autoridade da home.</p>
        {settings.authorityStats.map((stat, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Valor</Label>
              <Input type="number" value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)} className="mt-0.5 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Sufixo</Label>
              <Input value={stat.suffix} onChange={e => updateStat(i, 'suffix', e.target.value)} className="mt-0.5 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px]">Label</Label>
              <Input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} className="mt-0.5 h-8 text-xs" />
            </div>
          </div>
        ))}
      </section>

      {/* Trust Bar */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold">Barra de Confiança</h3>
          <Button variant="outline" size="sm" onClick={addTrustItem} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Textos que rolam na barra de confiança.</p>
        {settings.trustBarItems.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item.text} onChange={e => updateTrustItem(i, e.target.value)} className="h-8 text-xs" />
            <Button variant="ghost" size="sm" onClick={() => removeTrustItem(i)} className="h-8 w-8 p-0 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </section>

      {/* Social Proof Names */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold">Prova Social (Checkout)</h3>
          <Button variant="outline" size="sm" onClick={addSocialProof} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Nomes exibidos nas notificações do checkout Pix.</p>
        <div className="grid grid-cols-2 gap-2">
          {settings.socialProofNames.map((name, i) => (
            <div key={i} className="flex gap-1">
              <Input value={name} onChange={e => updateSocialProof(i, e.target.value)} className="h-7 text-[11px]" />
              <Button variant="ghost" size="sm" onClick={() => removeSocialProof(i)} className="h-7 w-7 p-0 text-destructive shrink-0">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Fake Reviews */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold">Avaliações de Clientes</h3>
          <Button variant="outline" size="sm" onClick={addReview} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Avaliações exibidas na página de produto.</p>
        {settings.fakeReviews.map((review, i) => (
          <div key={i} className="space-y-2 border-b border-border/30 pb-3 last:border-0">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-[10px]">Nome</Label>
                <Input value={review.name} onChange={e => updateReview(i, 'name', e.target.value)} className="mt-0.5 h-7 text-xs" />
              </div>
              <div className="w-20">
                <Label className="text-[10px]">Tempo</Label>
                <Input value={review.time} onChange={e => updateReview(i, 'time', e.target.value)} className="mt-0.5 h-7 text-xs" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeReview(i)} className="h-7 w-7 p-0 text-destructive self-end">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Textarea value={review.text} onChange={e => updateReview(i, 'text', e.target.value)} rows={2} className="text-xs" />
          </div>
        ))}
      </section>

      {/* Checkout Texts */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Mensagens do Checkout Pix</h3>
        <p className="text-xs text-muted-foreground">Todos os textos exibidos na tela de pagamento Pix.</p>

        <div className="space-y-3">
          <div><Label className="text-[10px]">Título aguardando</Label><Input value={ct.waitingTitle} onChange={e => updateCt('waitingTitle', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Subtítulo aguardando</Label><Textarea value={ct.waitingSubtitle} onChange={e => updateCt('waitingSubtitle', e.target.value)} rows={2} className="mt-0.5 text-xs" /></div>
          <div><Label className="text-[10px]">Mensagem de urgência</Label><Input value={ct.urgencyMessage} onChange={e => updateCt('urgencyMessage', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Nota variação centavos</Label><Textarea value={ct.centVariationNote} onChange={e => updateCt('centVariationNote', e.target.value)} rows={2} className="mt-0.5 text-xs" /></div>
          <div><Label className="text-[10px]">Texto pagamento seguro</Label><Input value={ct.paymentSecureText} onChange={e => updateCt('paymentSecureText', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Alerta gateway</Label><Textarea value={ct.gatewayAlertText} onChange={e => updateCt('gatewayAlertText', e.target.value)} rows={2} className="mt-0.5 text-xs" /></div>
          <div><Label className="text-[10px]">Texto "transferir mesmo assim"</Label><Input value={ct.transferAnywayText} onChange={e => updateCt('transferAnywayText', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Bloco de Orientação</h3>
        <div className="space-y-3">
          <div><Label className="text-[10px]">Título</Label><Input value={ct.guidanceTitle} onChange={e => updateCt('guidanceTitle', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Descrição</Label><Textarea value={ct.guidanceDescription} onChange={e => updateCt('guidanceDescription', e.target.value)} rows={3} className="mt-0.5 text-xs" /></div>
          <div><Label className="text-[10px]">Texto bloqueio</Label><Input value={ct.guidanceBlockedText} onChange={e => updateCt('guidanceBlockedText', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Dica 1</Label><Input value={ct.guidanceTip1} onChange={e => updateCt('guidanceTip1', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Dica 2</Label><Input value={ct.guidanceTip2} onChange={e => updateCt('guidanceTip2', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Dica 3</Label><Input value={ct.guidanceTip3} onChange={e => updateCt('guidanceTip3', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Texto suporte</Label><Textarea value={ct.guidanceSupportText} onChange={e => updateCt('guidanceSupportText', e.target.value)} rows={2} className="mt-0.5 text-xs" /></div>
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Alerta 60s e Status</h3>
        <div className="space-y-3">
          <div><Label className="text-[10px]">Título nudge (60s)</Label><Input value={ct.nudgeTitle} onChange={e => updateCt('nudgeTitle', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Nudge dica 1</Label><Input value={ct.nudgeTip1} onChange={e => updateCt('nudgeTip1', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Nudge dica 2</Label><Input value={ct.nudgeTip2} onChange={e => updateCt('nudgeTip2', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Nudge dica 3</Label><Input value={ct.nudgeTip3} onChange={e => updateCt('nudgeTip3', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Título pagamento confirmado</Label><Input value={ct.paidTitle} onChange={e => updateCt('paidTitle', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Texto redirecionamento</Label><Input value={ct.paidRedirectText} onChange={e => updateCt('paidRedirectText', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Título expirado</Label><Input value={ct.expiredTitle} onChange={e => updateCt('expiredTitle', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Texto expirado</Label><Input value={ct.expiredText} onChange={e => updateCt('expiredText', e.target.value)} className="mt-0.5 h-8 text-xs" /></div>
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Timer do Pix</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">Tempo total (minutos)</Label>
            <Input type="number" value={ct.pixTimerMinutes} onChange={e => updateCt('pixTimerMinutes', Number(e.target.value))} className="mt-0.5 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Urgência em (minutos)</Label>
            <Input type="number" value={ct.pixUrgencyMinutes} onChange={e => updateCt('pixUrgencyMinutes', Number(e.target.value))} className="mt-0.5 h-8 text-xs" />
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full gold-gradient text-primary-foreground font-bold">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Textos do Site'}
      </Button>
    </div>
  );
}
