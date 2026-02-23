import { getAgents } from '@/lib/actions/agents';
import { AgentsManager } from '@/components/agents/AgentsManager';

export default async function AgentsPage() {
    const agents = await getAgents();

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in-50 duration-500">
            <AgentsManager initialAgents={agents} />
        </div>
    );
}
