'use client';

import { useState } from 'react';
import { addPortfolioItem, deletePackage, deletePortfolioItem, saveBusinessSettings, savePackage } from '@/lib/actions/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Package, Plus, Save, Trash2 } from 'lucide-react';

type Configuration = { settings: any; packages: any[]; portfolio: any[] };

export function BusinessSettingsManager({ initialConfiguration }: { initialConfiguration: Configuration }) {
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const [settings, setSettings] = useState(initialConfiguration.settings || {});
  const [packageDraft, setPackageDraft] = useState({ name: '', description: '', price: 0, imageCount: 10, deliveryDays: 0, deliveryHours: 2, isActive: true });
  const [portfolioDraft, setPortfolioDraft] = useState({ title: '', category: '', mediaUrl: '' });
  const [message, setMessage] = useState('');

  const saveSettings = async () => {
    await saveBusinessSettings({
      businessName: settings.businessName || 'Estúdio de Ensaios com IA',
      pixKey: settings.pixKey || '', pixRecipient: settings.pixRecipient || '', pixInstitution: settings.pixInstitution || '',
      defaultGreeting: settings.defaultGreeting || '', salesInstructions: settings.salesInstructions || '',
      paymentInstructions: settings.paymentInstructions || '', humanHandoffMessage: settings.humanHandoffMessage || '',
    });
    setMessage('Configurações salvas.');
  };

  const createPackage = async () => {
    const result = await savePackage(packageDraft);
    setConfiguration((current) => ({ ...current, packages: [...current.packages, { ...packageDraft, id: result.packageId }] }));
    setPackageDraft({ name: '', description: '', price: 0, imageCount: 10, deliveryDays: 0, deliveryHours: 2, isActive: true });
  };

  const createPortfolio = async () => {
    const result = await addPortfolioItem(portfolioDraft);
    setConfiguration((current) => ({ ...current, portfolio: [...current.portfolio, { ...portfolioDraft, id: result.id }] }));
    setPortfolioDraft({ title: '', category: '', mediaUrl: '' });
  };

  return <div className="space-y-8">
    <div><h2 className="text-3xl font-bold">Configuração comercial</h2><p className="text-muted-foreground">Estas informações limitam o que a IA pode oferecer e cobrar.</p></div>
    <Card><CardHeader><CardTitle>Negócio e Pix manual</CardTitle><CardDescription>A IA enviará estes dados, mas a confirmação continuará sendo feita por você.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Nome do negócio"><Input value={settings.businessName || ''} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} /></Field>
        <Field label="Nome do favorecido"><Input value={settings.pixRecipient || ''} onChange={(e) => setSettings({ ...settings, pixRecipient: e.target.value })} /></Field>
        <Field label="Banco do Pix"><Input value={settings.pixInstitution || ''} onChange={(e) => setSettings({ ...settings, pixInstitution: e.target.value })} placeholder="Ex.: Banco Inter" /></Field>
        <Field label="Chave Pix"><Input value={settings.pixKey || ''} onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })} /></Field>
        <Field label="Saudação inicial"><Input value={settings.defaultGreeting || ''} onChange={(e) => setSettings({ ...settings, defaultGreeting: e.target.value })} /></Field>
        <Field label="Regras de venda" wide><Textarea className="min-h-32" value={settings.salesInstructions || ''} onChange={(e) => setSettings({ ...settings, salesInstructions: e.target.value })} /></Field>
        <Field label="Instruções para pagamento" wide><Textarea value={settings.paymentInstructions || ''} onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })} /></Field>
        <Field label="Mensagem ao assumir o atendimento" wide><Textarea value={settings.humanHandoffMessage || ''} onChange={(e) => setSettings({ ...settings, humanHandoffMessage: e.target.value })} /></Field>
        <div className="md:col-span-2 flex items-center gap-3"><Button onClick={saveSettings}><Save className="mr-2 h-4 w-4" />Salvar configurações</Button>{message && <span className="text-sm text-green-600">{message}</span>}</div>
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Pacotes</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 md:grid-cols-6"><Input placeholder="Nome" value={packageDraft.name} onChange={(e) => setPackageDraft({ ...packageDraft, name: e.target.value })} /><Input placeholder="Descrição" value={packageDraft.description} onChange={(e) => setPackageDraft({ ...packageDraft, description: e.target.value })} /><Input type="number" placeholder="Preço" value={packageDraft.price} onChange={(e) => setPackageDraft({ ...packageDraft, price: Number(e.target.value) })} /><Input type="number" placeholder="Imagens" value={packageDraft.imageCount} onChange={(e) => setPackageDraft({ ...packageDraft, imageCount: Number(e.target.value) })} /><Input type="number" placeholder="Prazo (horas)" value={packageDraft.deliveryHours} onChange={(e) => setPackageDraft({ ...packageDraft, deliveryHours: Number(e.target.value) })} /><Button disabled={!packageDraft.name} onClick={createPackage}><Plus className="mr-2 h-4 w-4" />Adicionar</Button></div>
      <div className="grid gap-3 md:grid-cols-2">{configuration.packages.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-4"><div><div className="font-medium">{item.name} <Badge variant="secondary">{item.imageCount} imagens</Badge></div><p className="text-sm text-muted-foreground">R$ {Number(item.price).toLocaleString('pt-BR')} · {item.deliveryHours ? `${item.deliveryHours} horas` : `${item.deliveryDays} dias`}</p></div><Button variant="ghost" size="icon" onClick={async () => { await deletePackage(item.id); setConfiguration((c) => ({ ...c, packages: c.packages.filter((p) => p.id !== item.id) })); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>)}</div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Portfólio</CardTitle><CardDescription>Use URLs públicas de imagens hospedadas no Supabase Storage ou outro serviço.</CardDescription></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4"><Input placeholder="Título" value={portfolioDraft.title} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, title: e.target.value })} /><Input placeholder="Categoria" value={portfolioDraft.category} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, category: e.target.value })} /><Input className="md:col-span-1" placeholder="https://..." value={portfolioDraft.mediaUrl} onChange={(e) => setPortfolioDraft({ ...portfolioDraft, mediaUrl: e.target.value })} /><Button disabled={!portfolioDraft.title || !portfolioDraft.mediaUrl} onClick={createPortfolio}><Plus className="mr-2 h-4 w-4" />Adicionar</Button></div>
      <div className="grid gap-3 md:grid-cols-3">{configuration.portfolio.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-3"><div className="min-w-0"><p className="font-medium truncate">{item.title}</p><a className="text-xs text-primary" href={item.mediaUrl} target="_blank" rel="noreferrer">Abrir imagem</a></div><Button variant="ghost" size="icon" onClick={async () => { await deletePortfolioItem(item.id); setConfiguration((c) => ({ ...c, portfolio: c.portfolio.filter((p) => p.id !== item.id) })); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>)}</div>
    </CardContent></Card>
  </div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}><Label>{label}</Label>{children}</div>;
}
