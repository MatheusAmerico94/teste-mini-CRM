'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAgent, updateAgent, deleteAgent, NewAgent } from '@/lib/actions/agents';
import { useForm } from 'react-hook-form';
import { Bot, Plus, Save, Trash2, BrainCircuit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type Agent = NewAgent & { id: string };

interface Props {
    initialAgents: Agent[];
}

export function AgentsManager({ initialAgents }: Props) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const form = useForm<Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>();

    const onSubmit = async (data: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (editingAgent) {
                await updateAgent(editingAgent.id, data);
                setAgents(agents.map(a => a.id === editingAgent.id ? { ...a, ...data } : a));
                setEditingAgent(null);
            } else {
                const res = await createAgent(data);
                if (res.success) {
                    // Optimistic update, ignoring id/timestamps for simply rendering the list
                    setAgents([{ id: res.agentId, ...data, userId: '', createdAt: new Date() as any, updatedAt: new Date() as any }, ...agents]);
                    setIsCreating(false);
                }
            }
            form.reset();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar agente');
        }
    };

    const handleEdit = (agent: Agent) => {
        setEditingAgent(agent);
        setIsCreating(false);
        form.reset({
            name: agent.name,
            personality: agent.personality,
            provider: agent.provider,
            model: agent.model,
            apiKey: agent.apiKey,
            isActive: agent.isActive,
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este agente?')) {
            await deleteAgent(id);
            setAgents(agents.filter(a => a.id !== id));
        }
    };

    const cancelEdit = () => {
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
                    <Button onClick={() => { setIsCreating(true); form.reset({ provider: 'openai', isActive: true }); }} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Novo Agente
                    </Button>
                )}
            </div>

            {(isCreating || editingAgent) && (
                <Card className="border-blue-500/20 shadow-xl shadow-blue-500/5 animate-in fade-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle className=" flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-blue-500" />
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
                                    <Select onValueChange={(v) => form.setValue('provider', v)} defaultValue={form.getValues('provider') || 'openai'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                            <SelectItem value="groq">Groq</SelectItem>
                                            <SelectItem value="gemini">Google Gemini</SelectItem>
                                            <SelectItem value="anthropic">Anthropic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="model">Modelo Específico (opcional)</Label>
                                    <Input id="model" placeholder="Ex: gpt-4o, llama3-70b-8192" {...form.register('model')} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input id="apiKey" type="password" placeholder="sk-..." {...form.register('apiKey')} />
                                    <p className="text-xs text-muted-foreground">Suas chaves são armazenadas localmente no seu banco de dados isolado.</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label htmlFor="personality">Personalidade / System Prompt</Label>
                                <Textarea
                                    id="personality"
                                    className="min-h-[150px] font-mono text-sm"
                                    placeholder="Você é um vendedor persuasivo mas amigável. Seu objetivo é descobrir a necessidade do cliente e agendar uma call. Responda sempre de forma curta e direta."
                                    {...form.register('personality', { required: true })}
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-4">
                                <Switch
                                    id="isActive"
                                    checked={form.watch('isActive') as boolean}
                                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                                />
                                <Label htmlFor="isActive">Agente Ativo (responderá mensagens no WhatsApp)</Label>
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 bg-muted/50 py-4 mt-4">
                            <Button type="button" variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                                <Save className="mr-2 h-4 w-4" /> Salvar Agente
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {agents.length === 0 && !isCreating && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed">
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                            <Bot className="h-6 w-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhum agente configurado</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">Crie seu primeiro agente de IA para automatizar seu WhatsApp.</p>
                        <Button onClick={() => { setIsCreating(true); form.reset({ provider: 'openai', isActive: true }); }} variant="outline">Criar Agente</Button>
                    </div>
                )}
                {agents.map((agent) => (
                    <Card key={agent.id} className="group hover:border-blue-500/30 transition-all shadow-sm hover:shadow-md">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                        <Bot className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" onClick={() => handleEdit(agent)}>
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
                                {agent.isActive ? (
                                    <span className="flex items-center text-xs text-green-500"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>Ativo</span>
                                ) : (
                                    <span className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-500 mr-1"></span>Inativo</span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                "{agent.personality}"
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
