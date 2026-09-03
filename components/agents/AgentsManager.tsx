'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAgent, updateAgent, deleteAgent, AgentInput } from '@/lib/actions/agents';
import { useForm } from 'react-hook-form';
import { Bot, Plus, Save, Trash2, BrainCircuit, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type Agent = { id: string; name: string; personality: string; provider: string; model?: string | null; apiKey?: string; isActive?: boolean | null; role?: string; serviceKey?: string; userId?: string; createdAt?: Date; updatedAt?: Date; hasApiKey?: boolean };

const OPENAI_MODELS = [
    { value: 'gpt-4o-mini', label: 'GPT-4o mini', description: 'Mais econômico para testes' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini', description: 'Melhor em seguir instruções' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Mais completo e mais caro' },
    { value: 'gpt-4.1', label: 'GPT-4.1', description: 'Maior capacidade e custo' },
] as const;

interface Props {
    initialAgents: Agent[];
}

export function AgentsManager({ initialAgents }: Props) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [saveError, setSaveError] = useState('');

    const form = useForm<AgentInput>();
    const personalityLength = form.watch('personality')?.length || 0;

    const onSubmit = async (data: AgentInput) => {
        try {
            setSaveError('');
            if (editingAgent) {
                await updateAgent(editingAgent.id, data);
                setAgents((current) => current.map((agent) => {
                    if (agent.id === editingAgent.id) return {
                        ...agent,
                        ...data,
                        hasApiKey: agent.hasApiKey || Boolean(data.apiKey),
                        apiKey: data.apiKey ? '••••••••••••' : agent.apiKey,
                    };
                    return data.isActive && data.role === 'router' && agent.role === 'router' ? { ...agent, isActive: false } : agent;
                }));
                setEditingAgent(null);
            } else {
                const res = await createAgent(data);
                if (res.success) {
                    // Optimistic update, ignoring id/timestamps for simply rendering the list
                    setAgents((current) => [
                        { id: res.agentId, ...data, provider: 'openai', apiKey: data.apiKey ? '••••••••••••' : '', hasApiKey: Boolean(data.apiKey) },
                        ...current.map((agent) => data.isActive && data.role === 'router' && agent.role === 'router' ? { ...agent, isActive: false } : agent),
                    ]);
                    setIsCreating(false);
                }
            }
            form.reset();
        } catch (error) {
            console.error(error);
            setSaveError('Não foi possível salvar o agente. Confira os campos e tente novamente.');
        }
    };

    const handleEdit = (agent: Agent) => {
        setSaveError('');
        setEditingAgent(agent);
        setIsCreating(false);
        form.reset({
            name: agent.name,
            personality: agent.personality,
            provider: 'openai',
            model: agent.model || 'gpt-4o-mini',
            apiKey: '',
            isActive: Boolean(agent.isActive),
            role: agent.role === 'router' ? 'router' : 'specialist',
            serviceKey: agent.serviceKey === 'photos' || agent.serviceKey === 'sites' ? agent.serviceKey : 'general',
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este agente?')) {
            await deleteAgent(id);
            setAgents(agents.filter(a => a.id !== id));
        }
    };

    const cancelEdit = () => {
        setSaveError('');
        setEditingAgent(null);
        setIsCreating(false);
        form.reset();
    }


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agentes de IA</h2>
                    <p className="text-muted-foreground">Gerencie os assistentes que interagem com seus leads.</p>
                </div>
                {!isCreating && !editingAgent && (
                    <Button onClick={() => { setIsCreating(true); form.reset({ provider: 'openai', model: 'gpt-4o-mini', isActive: true, role: 'specialist', serviceKey: 'general' }); }} className="bg-primary hover:bg-primary/90 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Novo Agente
                    </Button>
                )}
            </div>

            {agents.length > 0 && <Card className="border-primary/20"><CardContent className="p-4"><p className="font-medium">Fluxo de atendimento</p><p className="text-sm text-muted-foreground">O Cérebro identifica a necessidade e encaminha internamente para o especialista ativo de Fotos ou Sites.</p></CardContent></Card>}

            {(isCreating || editingAgent) && (
                <Card className="border-primary/20 shadow-primary/5 animate-in fade-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle className=" flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                            {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
                        </CardTitle>
                        <CardDescription>Defina a personalidade e o provedor do seu assistente IA.</CardDescription>
                    </CardHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Agente</Label>
                                    <Input id="name" placeholder="Ex: Closer Implacável" {...form.register('name', { required: true })} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="provider">Provedor de IA</Label>
                                    <Select onValueChange={() => form.setValue('provider', 'openai')} defaultValue="openai" disabled>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Função no atendimento</Label>
                                    <Select value={form.watch('role') || 'specialist'} onValueChange={(value: 'router' | 'specialist') => form.setValue('role', value, { shouldDirty: true })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="router">Cérebro (identifica o serviço)</SelectItem><SelectItem value="specialist">Especialista</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Área atendida</Label>
                                    <Select value={form.watch('serviceKey') || 'general'} onValueChange={(value: 'general' | 'photos' | 'sites') => form.setValue('serviceKey', value, { shouldDirty: true })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="general">Geral</SelectItem><SelectItem value="photos">Ensaios com IA</SelectItem><SelectItem value="sites">Sites para empresas</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Modelo da OpenAI</Label>
                                    <Select value={form.watch('model') || 'gpt-4o-mini'} onValueChange={(value) => form.setValue('model', value, { shouldDirty: true })}>
                                        <SelectTrigger id="model">
                                            <SelectValue placeholder="Selecione o modelo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OPENAI_MODELS.map((model) => (
                                                <SelectItem key={model.value} value={model.value}>
                                                    {model.label} — {model.description}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input id="apiKey" type="password" placeholder="sk-..." {...form.register('apiKey')} />
                                    {editingAgent?.hasApiKey ? (
                                        <p className="flex items-center gap-1 text-xs text-green-600"><KeyRound className="h-3 w-3" />Chave salva com segurança. Deixe vazio para manter ou digite uma nova para substituir.</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">A chave será criptografada antes de ser salva.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="personality">Personalidade / System Prompt</Label>
                                <Textarea
                                    id="personality"
                                    className="min-h-[150px] font-mono text-sm"
                                    placeholder="Você é um vendedor persuasivo mas amigável. Seu objetivo é descobrir a necessidade do cliente e agendar uma call. Responda sempre de forma curta e direta."
                                    maxLength={20000}
                                    {...form.register('personality', {
                                        required: 'A personalidade é obrigatória.',
                                        minLength: { value: 20, message: 'Use pelo menos 20 caracteres.' },
                                        maxLength: { value: 20000, message: 'O limite é de 20.000 caracteres.' },
                                    })}
                                />
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-red-600">{form.formState.errors.personality?.message}</span>
                                    <span className="ml-auto text-muted-foreground">{personalityLength.toLocaleString('pt-BR')} / 20.000</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-4">
                                <Switch
                                    id="isActive"
                                    checked={form.watch('isActive') as boolean}
                                    onCheckedChange={(checked: boolean) => form.setValue('isActive', checked)}
                                />
                                <Label htmlFor="isActive">Agente ativo</Label>
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 bg-muted/50 py-4 mt-4">
                            {saveError && <p role="alert" className="mr-auto text-sm text-red-600">{saveError}</p>}
                            <Button type="button" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                <Save className="mr-2 h-4 w-4" /> Salvar Agente
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {agents.length === 0 && !isCreating && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhum agente configurado</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">Crie seu primeiro agente de IA para automatizar seu WhatsApp.</p>
                        <Button onClick={() => { setIsCreating(true); form.reset({ provider: 'openai', model: 'gpt-4o-mini', isActive: true, role: 'specialist', serviceKey: 'general' }); }} variant="outline">Criar Agente</Button>
                    </div>
                )}
                {agents.map((agent) => (
                    <Card key={agent.id} className="group hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-primary/10 text-primary' : 'bg-slate-500/10 text-slate-500'}`}>
                                        <Bot className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(agent)}>
                                        <Save className="h-4 w-4" /> {/* Should be an edit icon ideally, using save for simplicity here if no edit is imported */}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(agent.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardTitle className="text-xl mt-4">{agent.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="font-mono text-xs">{agent.provider}</Badge>
                                <Badge variant="secondary" className="text-xs">{agent.role === 'router' ? 'Cérebro' : agent.serviceKey === 'photos' ? 'Fotos' : agent.serviceKey === 'sites' ? 'Sites' : 'Geral'}</Badge>
                                {agent.isActive ? (
                                    <span className="flex items-center text-xs text-green-500"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>Ativo</span>
                                ) : (
                                    <span className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500 mr-1"></span>Inativo</span>
                                )}
                            </CardDescription>
                            <div className="mt-2">
                                <Badge variant="secondary" className={agent.hasApiKey ? 'text-green-700' : ''}>
                                    <KeyRound className="mr-1 h-3 w-3" />{agent.hasApiKey ? 'API configurada' : 'Chave geral do servidor'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                &ldquo;{agent.personality}&rdquo;
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
