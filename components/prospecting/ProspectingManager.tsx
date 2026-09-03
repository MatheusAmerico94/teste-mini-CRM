'use client';

import { useState } from 'react';
import { Upload, Send, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { importProspects, sendProspectMessage, setProspectApproval } from '@/lib/actions/prospecting';

type Prospect = { id: string; businessName: string; contactName: string | null; phone: string; city: string | null; niche: string | null; websiteUrl: string | null; websiteStatus: string; personalizedMessage: string; status: string; contactApproved: boolean; lastContactedAt: Date | null };

function parseCsv(raw: string) {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const head = lines[0].split(sep).map((value) => value.trim().toLowerCase());
  const valueFor = (cells: string[], names: string[]) => cells[head.findIndex((h) => names.includes(h))] || '';
  return lines.slice(1).map((line) => {
    const cells = line.split(sep).map((value) => value.trim().replace(/^"|"$/g, ''));
    const site = valueFor(cells, ['site', 'website', 'url']);
    return { businessName: valueFor(cells, ['empresa', 'negocio', 'business']), contactName: valueFor(cells, ['nome', 'contato', 'responsavel']), phone: valueFor(cells, ['telefone', 'whatsapp', 'phone']), city: valueFor(cells, ['cidade', 'city']), niche: valueFor(cells, ['nicho', 'segmento']), websiteUrl: site, websiteStatus: site ? 'has_site' : 'no_site', websiteNotes: valueFor(cells, ['observacoes', 'anotacoes', 'site_notas']), personalizedMessage: valueFor(cells, ['mensagem', 'mensagem_personalizada', 'message']), contactApproved: false };
  }).filter((row) => row.businessName && row.phone && row.personalizedMessage);
}

export function ProspectingManager({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState(initialProspects);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return; setBusy(true); setError(''); setNotice('');
    try { const rows = parseCsv(await file.text()); const result = await importProspects(rows); setNotice(`${result.count} contato(s) importado(s). Atualize a página para ver a lista.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível importar a planilha'); } finally { setBusy(false); }
  };
  const approve = async (item: Prospect, value: boolean) => { setError(''); try { await setProspectApproval(item.id, value); setProspects((items) => items.map((current) => current.id === item.id ? { ...current, contactApproved: value, status: value ? 'reviewed' : 'draft' } : current)); } catch { setError('Não foi possível atualizar o contato'); } };
  const send = async (item: Prospect) => { setBusy(true); setError(''); try { await sendProspectMessage(item.id); setProspects((items) => items.map((current) => current.id === item.id ? { ...current, status: 'sent' } : current)); setNotice('Mensagem enviada. Quando houver resposta, o agente de Sites continuará a conversa.'); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível enviar'); } finally { setBusy(false); } };
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Prospecção de sites</h1><p className="text-muted-foreground">Importe contatos que você já pesquisou, revise a mensagem e envie um por vez.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Importar planilha CSV</CardTitle><CardDescription>Colunas aceitas: empresa, nome, telefone, cidade, nicho, site, observacoes e mensagem. Use uma mensagem personalizada por linha.</CardDescription></CardHeader><CardContent><input type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} /><p className="mt-3 text-xs text-muted-foreground">Não há disparo automático: cada mensagem exige sua revisão e seu clique.</p></CardContent></Card>
    {error && <p className="text-sm text-destructive">{error}</p>}{notice && <p className="text-sm text-green-700">{notice}</p>}
    <div className="grid gap-4">{prospects.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Sua lista aparecerá aqui após importar a planilha.</CardContent></Card> : prospects.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="space-y-2"><p className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" />{item.businessName}</p><p className="text-sm text-muted-foreground">{item.contactName || 'Sem nome'} · {item.phone} · {item.websiteUrl ? 'Possui site' : 'Sem site'}</p><p className="max-w-3xl rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{item.personalizedMessage}</p></div><div className="flex min-w-[220px] flex-col gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.contactApproved} disabled={item.status === 'sent'} onChange={(event) => approve(item, event.target.checked)} />Revisei e posso iniciar contato</label><Button disabled={!item.contactApproved || item.status === 'sent' || busy} onClick={() => send(item)}><Send className="mr-2 h-4 w-4" />{item.status === 'sent' ? 'Enviada' : 'Enviar mensagem'}</Button>{item.status === 'sent' && <span className="flex items-center text-xs text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" />Aguardando resposta</span>}</div></div></CardContent></Card>)}</div>
  </div>;
}
