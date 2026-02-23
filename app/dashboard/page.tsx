import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart, FunnelBarChart, SourcePieChart } from "@/components/dashboard/charts";
import { DollarSign, TrendingUp, Users, Activity, Flame, Bot, Smartphone } from "lucide-react";
import { getLeads } from '@/lib/actions/leads';
import { getAgents } from '@/lib/actions/agents';
import { getConnectionStatus } from '@/lib/actions/whatsapp';
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
    const [leads, agents, whatsapp] = await Promise.all([
        getLeads().catch(() => []), // Ignore auth error if they are somehow not signed in but viewing this
        getAgents().catch(() => []),
        getConnectionStatus().catch(() => null)
    ]);

    // Calculate metrics
    const totalLeads = leads.length;

    const revenue = leads
        .filter(l => l.status === 'fechado')
        .reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

    const activeProposals = leads.filter(l => l.status === 'proposta');
    const pipelineValue = activeProposals.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

    // Calculate funnel dynamically
    const funnelCounts = {
        'novo': leads.filter(l => l.status === 'novo').length,
        'contato': leads.filter(l => l.status === 'contato').length,
        'proposta': activeProposals.length,
        'negociacao': leads.filter(l => l.status === 'negociacao').length,
        'fechado': leads.filter(l => l.status === 'fechado').length,
    };

    // Calculate hot leads
    const hotLeads = leads.filter(l => l.temperature === 'quente').length;

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-none text-white shadow-lg shadow-orange-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><DollarSign className="w-24 h-24" /></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Receita Fechada</CardTitle>
                        <DollarSign className="h-4 w-4 opacity-75" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-red-500"><Flame className="w-24 h-24" /></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                            <Flame className="w-4 h-4" /> Leads Quentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">{hotLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">Identificados por I.A.</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Propostas Ativas</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">{activeProposals.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pipeline: R$ {pipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-800">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">Base completa</p>
                    </CardContent>
                </Card>
            </div>

            {/* AI & Integration Status Row */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm border-primary/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" /> Seus Agentes de IA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {agents.length > 0 ? (
                            <div className="space-y-3">
                                {agents.map(agent => (
                                    <div key={agent.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border">
                                        <div>
                                            <p className="font-medium text-sm text-slate-800">{agent.name}</p>
                                            <p className="text-xs text-slate-500">{agent.provider} • {agent.model || 'Padrão'}</p>
                                        </div>
                                        <Badge variant={agent.isActive ? 'default' : 'secondary'} className={agent.isActive ? 'bg-primary hover:bg-primary/90' : ''}>
                                            {agent.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 py-4 text-center">Nenhum Agente configurado ainda.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-green-500/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-green-500" /> WhatsApp Conectado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 h-[140px]">
                        {whatsapp?.status === 'connected' ? (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                    <Smartphone className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="font-medium text-green-700">Sessão Ativa e Monitorando</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <Smartphone className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="font-medium text-slate-600">WhatsApp Desconectado</p>
                                <p className="text-xs text-slate-400">Vá em WhatsApp para conectar.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Funnel Row */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Funil de Vendas Atual</CardTitle>
                        <CardDescription>Visualização de todas as etapas do Pipeline</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* We pass dynamically calculated properties or wrap charts if needed. For now, using mock charts for aesthetics */}
                        <div className="h-[300px] w-full bg-slate-50 rounded-lg flex items-center justify-center border-dashed border-2 border-slate-200">
                            <FunnelBarChart />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
