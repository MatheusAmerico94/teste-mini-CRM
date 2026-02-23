import { getLeads } from '@/lib/actions/leads';
import { KanbanBoard } from '@/components/leads/KanbanBoard';

export default async function LeadsPage() {
    const leads = await getLeads();

    return (
        <div className="flex flex-col h-full animate-in fade-in-50 duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Leads e Pipeline</h2>
                <p className="text-muted-foreground">Gerencie seus leads e acompanhe o funil de vendas (As temperaturas são classificadas pelas suas IAs).</p>
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard initialLeads={leads} />
            </div>
        </div>
    );
}
