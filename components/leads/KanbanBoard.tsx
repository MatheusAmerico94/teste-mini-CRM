'use client';

import { useState } from 'react';
import { updateLeadStatus } from '@/lib/actions/leads';
import { LeadCard } from './LeadCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const COLUMNS = [
    { id: 'novo', label: 'Novo Lead', color: 'bg-slate-50', border: 'border-slate-200' },
    { id: 'contato', label: 'Contato Feito', color: 'bg-orange-50/30', border: 'border-orange-200/50' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'bg-slate-50', border: 'border-slate-200' },
    { id: 'negociacao', label: 'Negociação', color: 'bg-orange-50', border: 'border-orange-200' },
    { id: 'fechado', label: 'Fechado', color: 'bg-green-50', border: 'border-green-200' },
];

export function KanbanBoard({ initialLeads }: { initialLeads: any[] }) {
    const [leads, setLeads] = useState(initialLeads);

    // In a real implementation with @dnd-kit installed, we would use DndContext, useDroppable, useDraggable.
    // Since we are mocking due to environment constraints, we will build the visual structure 
    // and provide a simple click-to-move as a fallback if drag fails.

    const handleMove = async (leadId: string, newStatus: string) => {
        // Optimistic Update
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        await updateLeadStatus(leadId, newStatus);
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-4 h-full snap-x">
            {COLUMNS.map((column) => {
                const columnLeads = leads.filter((l) => l.status === column.id);
                const totalValue = columnLeads.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

                // Count temperatures
                const hot = columnLeads.filter(l => l.temperature === 'quente').length;

                return (
                    <div key={column.id} className="flex-shrink-0 w-[350px] flex flex-col snap-start">
                        <div className={`rounded-xl border ${column.border} ${column.color} p-4 flex-1 flex flex-col shadow-sm`}>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        {column.label}
                                        <span className="bg-white/60 text-slate-600 text-xs px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                                    </h3>
                                    {hot > 0 && <span className="text-xs text-red-500 font-medium">🔥 {hot} Quentes</span>}
                                </div>
                                <span className="text-sm font-medium text-slate-600 bg-white/50 px-2 py-1 rounded-md">
                                    R$ {totalValue.toLocaleString('pt-BR')}
                                </span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto min-h-[500px]">
                                {columnLeads.map((lead) => (
                                    <div key={lead.id} className="relative group">
                                        {/* Temporary manual move buttons since DND might not be installed */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 z-10 flex gap-1 transition-opacity">
                                            {column.id !== 'novo' && <Button size="icon" variant="secondary" className="h-6 w-6 text-xs" onClick={() => handleMove(lead.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) - 1].id)}>←</Button>}
                                            {column.id !== 'fechado' && <Button size="icon" variant="secondary" className="h-6 w-6 text-xs" onClick={() => handleMove(lead.id, COLUMNS[COLUMNS.findIndex(c => c.id === column.id) + 1].id)}>→</Button>}
                                        </div>
                                        <LeadCard lead={lead} />
                                    </div>
                                ))}

                                {columnLeads.length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-slate-300/50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                                        Solte leads aqui
                                    </div>
                                )}
                            </div>

                            {column.id === 'novo' && (
                                <Button variant="outline" className="w-full mt-4 bg-white/50 hover:bg-white border-dashed">
                                    <Plus className="w-4 h-4 mr-2" /> Adicionar Lead
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
