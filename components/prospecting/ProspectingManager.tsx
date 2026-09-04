'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Upload, Send, CheckCircle2, Building2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { extractProspectsFromFile, importProspects, sendProspectMessage, setProspectApproval } from '@/lib/actions/prospecting';

type Prospect = { id: string; businessName: string; contactName: string | null; phone: string; city: string | null; niche: string | null; websiteUrl: string | null; websiteStatus: string; personalizedMessage: string; status: string; contactApproved: boolean; lastContactedAt: Date | null };

export function ProspectingManager({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState(initialProspects);
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = async (file?: File) => {
    if (!file) return; setBusy(true); setError(''); setNotice('');
    try { const data = new FormData(); data.set('file', file); const extracted = await extractProspectsFromFile(data); const result = await importProspects(extracted.rows); setNotice(`${result.count} contato(s) de ${extracted.fileName} foram importados. Atualize a página para ver a lista.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível importar a planilha'); } finally { setBusy(false); }
  };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); upload(event.dataTransfer.files?.[0]); };
  const approve = async (item: Prospect, value: boolean) => { setError(''); try { await setProspectApproval(item.id, value); setProspects((items) => items.map((current) => current.id === item.id ? { ...current, contactApproved: value, status: value ? 'reviewed' : 'draft' } : current)); } catch { setError('Não foi possível atualizar o contato'); } };
  const send = async (item: Prospect) => { setBusy(true); setError(''); try { await sendProspectMessage(item.id); setProspects((items) => items.map((current) => current.id === item.id ? { ...current, status: 'sent' } : current)); setNotice('Mensagem enviada. Quando houver resposta, o agente de Sites continuará a conversa.'); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível enviar'); } finally { setBusy(false); } };
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Prospecção de sites</h1><p className="text-muted-foreground">Importe contatos que você já pesquisou, revise a mensagem e envie um por vez.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Importar contatos</CardTitle><CardDescription>Envie CSV, TXT, Word (.docx) ou PDF. A IA lê nome, telefone, site e mensagem personalizada para cada contato.</CardDescription></CardHeader><CardContent><input ref={inputRef} className="hidden" type="file" accept=".csv,.txt,.docx,.pdf,text/csv,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} /><div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={drop} className={`flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}><FileUp className="mb-3 h-9 w-9 text-primary" /><p className="font-medium">Arraste o arquivo aqui</p><p className="mt-1 text-sm text-muted-foreground">ou escolha no seu computador</p><Button type="button" className="mt-4" disabled={busy} onClick={() => inputRef.current?.click()}>Selecionar arquivo</Button><p className="mt-4 text-xs text-muted-foreground">Até 8 MB. Formatos: CSV, TXT, DOCX e PDF.</p></div><p className="mt-3 text-xs text-muted-foreground">Não há disparo automático: cada mensagem exige sua revisão e seu clique.</p></CardContent></Card>
    {error && <p className="text-sm text-destructive">{error}</p>}{notice && <p className="text-sm text-green-700">{notice}</p>}
    <div className="grid gap-4">{prospects.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Sua lista aparecerá aqui após importar a planilha.</CardContent></Card> : prospects.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="space-y-2"><p className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" />{item.businessName}</p><p className="text-sm text-muted-foreground">{item.contactName || 'Sem nome'} · {item.phone} · {item.websiteUrl ? 'Possui site' : 'Sem site'}</p><p className="max-w-3xl rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{item.personalizedMessage}</p></div><div className="flex min-w-[220px] flex-col gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.contactApproved} disabled={item.status === 'sent'} onChange={(event) => approve(item, event.target.checked)} />Revisei e posso iniciar contato</label><Button disabled={!item.contactApproved || item.status === 'sent' || busy} onClick={() => send(item)}><Send className="mr-2 h-4 w-4" />{item.status === 'sent' ? 'Enviada' : 'Enviar mensagem'}</Button>{item.status === 'sent' && <span className="flex items-center text-xs text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" />Aguardando resposta</span>}</div></div></CardContent></Card>)}</div>
  </div>;
}
