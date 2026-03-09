'use client';

import { useState, useEffect, useRef } from 'react';
import { getLeadMessages } from '@/lib/actions/leads';
import { UserCircle2, Search, MoreVertical, MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function WhatsAppChatClient({ initialLeads, initialSelectedLeadId }: { initialLeads: any[], initialSelectedLeadId?: string }) {
    const [leads, setLeads] = useState<any[]>(initialLeads);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialSelectedLeadId || null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter leads based on search
    const filteredLeads = leads.filter(l =>
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone?.includes(searchQuery)
    );

    const selectedLead = leads.find(l => l.id === selectedLeadId);

    // Fetch messages when a lead is selected
    useEffect(() => {
        if (selectedLeadId) {
            setIsLoadingMsgs(true);
            getLeadMessages(selectedLeadId).then(msgs => {
                setMessages(msgs);
                setIsLoadingMsgs(false);
            });
        } else {
            setMessages([]);
        }
    }, [selectedLeadId]);

    // Auto scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getTemperatureColor = (temp: string) => {
        if (temp === 'quente') return 'bg-red-500';
        if (temp === 'morno') return 'bg-orange-500';
        return 'bg-blue-500';
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
                                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <UserCircle2 className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${getTemperatureColor(lead.temperature)}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">{lead.name || lead.phone}</h3>
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

                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                    <UserCircle2 className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{selectedLead.name}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedLead.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`${getTemperatureColor(selectedLead.temperature)} text-white border-transparent`}>
                                    {selectedLead.temperature}
                                </Badge>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 w-full p-4 md:p-6 z-10">
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
                        </ScrollArea>

                        {/* Message Input Mockup (Read-only for now since AI handles it) */}
                        <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center px-4 z-10 gap-2">
                            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg h-10 flex items-center px-4">
                                <span className="text-slate-400 dark:text-slate-500 text-sm">
                                    A IA está gerenciando esta conversa. Você pode acompanhar...
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State for Main Area */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
                        <img
                            src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png"
                            alt="WhatsApp Web"
                            className="w-72 md:w-80 opacity-60 mb-8 max-w-full"
                        />
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
