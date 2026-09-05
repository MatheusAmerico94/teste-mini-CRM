'use client';

import { useState, useEffect, useRef, type UIEvent } from 'react';
import { confirmManualPayment, getLeadMessages, getLeads, setLeadAutomation } from '@/lib/actions/leads';
import { sendManualMessage } from '@/lib/actions/whatsapp';
import { UserCircle2, Search, MoreVertical, MessageSquare, ArrowLeft, Bot, UserRoundCheck, BadgeCheck, Send, Smartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

function displayPhone(phone?: string | null) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 13 && digits.startsWith('55')) return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    if (digits.length === 12 && digits.startsWith('55')) return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    return digits ? `+${digits}` : 'Número não disponível';
}

function LeadAvatar({ lead, size = 'large' }: { lead: any; size?: 'large' | 'small' }) {
    const dimensions = size === 'large' ? 'w-12 h-12' : 'w-10 h-10';
    return (
        <div className={`${dimensions} rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0`}>
            {lead.avatarUrl ? <Image src={lead.avatarUrl} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserCircle2 className={size === 'large' ? 'w-8 h-8 text-slate-400' : 'w-6 h-6 text-slate-400'} />}
        </div>
    );
}

export function WhatsAppChatClient({ initialLeads, initialSelectedLeadId }: { initialLeads: any[], initialSelectedLeadId?: string }) {
    const [leads, setLeads] = useState<any[]>(initialLeads);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialSelectedLeadId || null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const [manualMessage, setManualMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isNearMessagesBottomRef = useRef(true);
    const shouldScrollOnNextMessagesRef = useRef(true);

    // Filter leads based on search
    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone?.includes(searchQuery)
    );

    const selectedLead = leads.find(l => l.id === selectedLeadId);

    // Keep the inbox and the selected chat synchronized with WhatsApp.
    useEffect(() => {
        let active = true;
        let timer: number | undefined;
        const refreshLeads = async () => {
            try {
                if (document.visibilityState === 'visible') {
                    const latestLeads = await getLeads();
                    if (active) setLeads(latestLeads);
                }
            } catch (error) {
                console.error('Falha ao atualizar conversas', error);
            } finally {
                if (active) timer = window.setTimeout(refreshLeads, 10000);
            }
        };
        void refreshLeads();
        return () => {
            active = false;
            if (timer) window.clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (!selectedLeadId) {
            setMessages([]);
            setIsLoadingMsgs(false);
            return;
        }
        let active = true;
        let timer: number | undefined;
        setIsLoadingMsgs(true);
        setMessages([]);
        isNearMessagesBottomRef.current = true;
        shouldScrollOnNextMessagesRef.current = true;
        const refreshMessages = async () => {
            try {
                if (document.visibilityState === 'visible') {
                    const latestMessages = await getLeadMessages(selectedLeadId);
                    if (active) setMessages(latestMessages);
                }
            } catch (error) {
                console.error('Falha ao atualizar mensagens', error);
            } finally {
                if (active) {
                    setIsLoadingMsgs(false);
                    timer = window.setTimeout(refreshMessages, 3000);
                }
            }
        };
        void refreshMessages();
        return () => {
            active = false;
            if (timer) window.clearTimeout(timer);
        };
    }, [selectedLeadId]);

    // Only follow new messages while the person is already reading the end of the chat.
    useEffect(() => {
        if (!messages.length) return;
        if (shouldScrollOnNextMessagesRef.current || isNearMessagesBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            shouldScrollOnNextMessagesRef.current = false;
        }
    }, [messages]);

    const handleMessagesScroll = (event: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        isNearMessagesBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    };

    const getTemperatureColor = (temp: string) => {
        if (temp === 'quente') return 'bg-red-500';
        if (temp === 'morno') return 'bg-orange-500';
        return 'bg-blue-500';
    };

    const updateSelectedLead = (data: Record<string, unknown>) => setLeads((current) => current.map((lead) => lead.id === selectedLeadId ? { ...lead, ...data } : lead));

    const toggleAutomation = async () => {
        if (!selectedLead) return;
        const enabled = !selectedLead.aiEnabled;
        await setLeadAutomation(selectedLead.id, enabled);
        updateSelectedLead({ aiEnabled: enabled });
    };

    const confirmPayment = async () => {
        if (!selectedLead) return;
        await confirmManualPayment(selectedLead.id);
        updateSelectedLead({ aiEnabled: false, status: 'pago', paidAt: new Date() });
    };

    const sendMessage = async () => {
        if (!selectedLead || !manualMessage.trim()) return;
        await sendManualMessage(selectedLead.id, manualMessage);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: manualMessage, createdAt: new Date() }]);
        setManualMessage('');
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-slate-950 overflow-hidden">
            {/* Sidebar (Chat List) - Hidden on mobile if chat is open */}
            <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 flex flex-col border-r border-border transition-transform ${selectedLeadId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-16 flex border-b items-center px-4 bg-slate-50 dark:bg-slate-900 justify-between">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-500" /> Conversas
                    </h2>
                    <Button variant="ghost" size="icon" className="text-slate-500">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-3 border-b bg-white dark:bg-slate-950">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Pesquisar ou começar nova conversa..."
                            className="pl-9 bg-slate-100 dark:bg-slate-900 border-none rounded-xl"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1 bg-white dark:bg-slate-950">
                    <div className="flex flex-col">
                        {filteredLeads.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                Nenhum contato encontrado.
                            </div>
                        ) : (
                            filteredLeads.map(lead => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLeadId(lead.id)}
                                    className={`flex items-center gap-3 p-3 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b border-slate-50 dark:border-slate-800/50 ${selectedLeadId === lead.id ? 'bg-slate-100 dark:bg-slate-800/80' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <LeadAvatar lead={lead} />
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${getTemperatureColor(lead.temperature)}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{lead.name && lead.name !== lead.phone ? lead.name : displayPhone(lead.phone)}</h3>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate pr-2">
                                                {lead.status === 'novo' ? 'Novo lead' : lead.status}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex col flex-col bg-[#efeae2] dark:bg-[#111b21] relative w-full ${!selectedLeadId ? 'hidden md:flex' : 'flex'}`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QOtdN2k0j.png')]" />

                {selectedLead ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 flex items-center px-4 bg-slate-50 dark:bg-slate-900 border-b justify-between z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={() => setSelectedLeadId(null)}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>

                                <LeadAvatar lead={selectedLead} size="small" />
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{selectedLead.name && selectedLead.name !== selectedLead.phone ? selectedLead.name : displayPhone(selectedLead.phone)}</h3>
                                    <p className="text-xs text-muted-foreground">{displayPhone(selectedLead.phone)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`${getTemperatureColor(selectedLead.temperature)} text-white border-transparent`}>
                                    {selectedLead.temperature}
                                </Badge>
                                <Button size="sm" variant={selectedLead.aiEnabled ? 'destructive' : 'outline'} disabled={selectedLead.status === 'pago' && !selectedLead.aiEnabled} onClick={toggleAutomation}>
                                    {selectedLead.aiEnabled ? <><UserRoundCheck className="mr-1 h-4 w-4" />Assumir</> : <><Bot className="mr-1 h-4 w-4" />Ativar IA</>}
                                </Button>
                                <Button size="sm" variant="outline" disabled={selectedLead.status === 'pago'} onClick={confirmPayment}><BadgeCheck className="mr-1 h-4 w-4" />Pix pago</Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 w-full overflow-y-auto p-4 md:p-6 z-10" onScroll={handleMessagesScroll}>
                            {isLoadingMsgs ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur text-sm px-4 py-2 rounded-full shadow-sm">
                                        Carregando histórico...
                                    </div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm px-4 py-2 rounded-lg shadow-sm text-center max-w-xs">
                                        As mensagens deste contato aparecerão aqui quando a IA começar a responder.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-3xl mx-auto w-full flex flex-col pt-4">
                                    {/* Date separator mockup */}
                                    <div className="flex justify-center mb-6">
                                        <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-3 py-1 rounded-md shadow-sm">
                                            Histórico de Conversa
                                        </span>
                                    </div>

                                    {messages.map((msg, idx) => {
                                        const isCustomer = msg.role === 'user';
                                        return (
                                            <div key={idx} className={`flex w-full ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                                                <div
                                                    className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-[15px] shadow-sm relative ${isCustomer
                                                            ? 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                                                            : 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap leading-snug pb-3">{msg.content}</p>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400/80 absolute bottom-1 right-2 flex items-center gap-1">
                                                        {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center px-4 z-10 gap-2">
                            <Input value={manualMessage} onChange={(e) => setManualMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} placeholder={selectedLead.aiEnabled ? 'Assuma a conversa para responder manualmente' : 'Digite sua mensagem'} disabled={selectedLead.aiEnabled} className="flex-1 bg-white dark:bg-[#2a3942]" />
                            <Button size="icon" onClick={sendMessage} disabled={selectedLead.aiEnabled || !manualMessage.trim()}><Send className="h-4 w-4" /></Button>
                        </div>
                    </>
                ) : (
                    /* Empty State for Main Area */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
                        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white/70 dark:bg-slate-800/70"><Smartphone className="h-16 w-16 text-[#667781]" /></div>
                        <h2 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">
                            Mini CRM Web
                        </h2>
                        <p className="text-[#667781] dark:text-[#8696a0] text-sm max-w-md">
                            Selecione uma conversa na lateral esquerda para ler o histórico de mensagens feitas pela sua IA.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
