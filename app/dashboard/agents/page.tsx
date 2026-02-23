import { getAgents } from '@/lib/actions/agents';
import { AgentsManager } from '@/components/agents/AgentsManager';

export default async function AgentsPage() {
    try {
        const agents = await getAgents();

        return (
            <div className="max-w-5xl mx-auto animate-in fade-in-50 duration-500">
                <AgentsManager initialAgents={agents} />
            </div>
        );
    } catch (error) {
        console.error('Page Error:', error);
        return (
            <div className="p-8 text-center border rounded-xl bg-destructive/5 text-destructive border-destructive/20">
                <h3 className="text-lg font-bold">Erro ao carregar agentes</h3>
                <p className="text-sm opacity-80">Ocorreu uma falha no servidor ao buscar seus dados. Por favor, tente novamente em instantes.</p>
            </div>
        );
    }
}
