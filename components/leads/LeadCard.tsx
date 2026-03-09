'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Building2, UserCircle2, Thermometer, ThermometerSun, Flame, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getLeadMessages } from '@/lib/actions/leads';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LeadCard({ lead, attributes, listeners, setNodeRef, transform, isDragging }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getLeadMessages(lead.id).then(msgs => {
                setMessages(msgs);
                setIsLoading(false);
            });
        }
    }, [isOpen, lead.id]);
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    const getTemperatureBadge = (temp: string) => {
        switch (temp) {
            case 'quente':
                return <Badge variant="default" className="bg-red-500 hover:bg-red-600 border-none"><Flame className="w-3 h-3 mr-1" /> Quente</Badge>;
            case 'morno':
                return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 border-none text-white"><ThermometerSun className="w-3 h-3 mr-1" /> Morno</Badge>;
            case 'frio':
            default:
                return <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none"><Thermometer className="w-3 h-3 mr-1" /> Frio</Badge>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`touch-none cursor-grab active:cursor-grabbing mb-3 `}
        >
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer ${lead.temperature === 'quente' ? 'border-l-red-500' :
                        lead.temperature === 'morno' ? 'border-l-orange-500' : 'border-l-slate-300'
                        }`}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start mb-2">
                                {getTemperatureBadge(lead.temperature)}
                                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    R$ {Number(lead.estimatedValue).toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                                {lead.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-1">
                            {lead.company && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Building2 className="mr-2 h-3 w-3" />
                                    {lead.company}
                                </div>
                            )}
                            {lead.phone && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <Phone className="mr-2 h-3 w-3" />
                                    {lead.phone}
                                </div>
                            )}
                            <div className="flex items-center text-xs text-primary font-medium mt-2 pt-2 border-t">
                                <MessageSquare className="mr-1 h-3 w-3" />
                                Ver Conversa
                            </div>
                        </CardContent>
                    </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCircle2 className="w-5 h-5" />
                            Conversa com {lead.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 mt-2 h-[400px] flex flex-col">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                Carregando mensagens...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                                Nenhuma mensagem registrada ainda.
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                                ? 'bg-white dark:bg-slate-800 border shadow-sm text-slate-800 dark:text-slate-200 rounded-tl-sm'
                                                : 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm'}`}>
                                                {msg.content}
                                                <div className={`text-[10px] mt-1 opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
