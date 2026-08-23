'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, RefreshCcw, LogOut, CheckCircle2 } from 'lucide-react';
import { connectWhatsApp, getConnectionStatus, disconnectWhatsApp } from '@/lib/actions/whatsapp';
import Image from 'next/image';

export function WhatsAppManager() {
    const [status, setStatus] = useState<'disconnected' | 'qr' | 'connected' | 'loading'>('loading');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [error, setError] = useState('');
    const handleConnect = async () => {
        setStatus('loading');
        try {
            setError('');
            await connectWhatsApp();
        } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao iniciar conexão'); }
        await fetchStatus();
    };

    const fetchStatus = async () => {
        try {
            const conn = await getConnectionStatus();
            if (conn) {
                setStatus(conn.status as any);
                setQrCode(conn.qrCode);
                if (conn.lastError) setError(conn.lastError);
            } else {
                setStatus('disconnected');
            }
        } catch (error) {
            console.error(error);
            setStatus('disconnected');
        }
    };

    useEffect(() => {
        fetchStatus();

        // Poll every 5 seconds, using ref to always have fresh status
        const interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);
    }, []); // Run once on mount only

    const handleDisconnect = async () => {
        setStatus('loading');
        await disconnectWhatsApp();
        await fetchStatus();
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Conexão WhatsApp</h2>
                <p className="text-muted-foreground">Conecte seu número para que a IA possa atender seus leads automaticamente.</p>
            </div>

            <Card className="border-green-500/20 shadow-xl shadow-green-500/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Smartphone className="w-48 h-48" />
                </div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-500" />
                        Status da Conexão
                        {status === 'connected' && <Badge variant="default" className="bg-green-500 hover:bg-green-600 ml-2">Conectado</Badge>}
                        {status === 'disconnected' && <Badge variant="secondary" className="ml-2">Desconectado</Badge>}
                        {status === 'qr' && <Badge variant="outline" className="border-yellow-500 text-yellow-600 ml-2">Aguardando Leitura</Badge>}
                        {status === 'loading' && <Badge variant="secondary" className="ml-2 animate-pulse">Carregando...</Badge>}
                    </CardTitle>
                    <CardDescription>
                        {status === 'connected'
                            ? 'Sua IA está pronta para enviar e receber mensagens.'
                            : 'Escaneie o QR Code abaixo com o seu WhatsApp (Aparelhos Conectados) para vincular.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 min-h-[300px]">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                            <RefreshCcw className="h-10 w-10 animate-spin mb-4 text-green-500/50" />
                            <p>Verificando status...</p>
                        </div>
                    )}

                    {status === 'disconnected' && (
                        <div className="flex flex-col items-center text-center max-w-sm">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                <Smartphone className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">WhatsApp não conectado</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                O QR Code será gerado assim que o servidor iniciar o cliente do WhatsApp. Atualize a página ou aguarde.
                            </p>
                            <Button onClick={handleConnect} size="lg" className="bg-primary hover:bg-primary/90">
                                <RefreshCcw className="mr-2 h-4 w-4" /> Tentar Conectar
                            </Button>
                            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                        </div>
                    )}

                    {status === 'qr' && qrCode && (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
                                {/* Normally use a QR Code library here or render the base64 image (from pupeteer) */}
                                {qrCode.startsWith('data:image') ? (
                                    <Image src={qrCode} alt="WhatsApp QR Code" width={256} height={256} unoptimized />
                                ) : (
                                    <div className="w-64 h-64 border-4 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                        {/* Fallback pattern mimicking QR code if only raw string is passed initially without image generator */}
                                        <div className="absolute inset-4 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-transparent patterned"></div>
                                        <p className="text-xs text-slate-400 text-center px-4 relative z-10 break-all">{qrCode.substring(0, 60)}...</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-medium animate-pulse text-green-600">
                                Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar um aparelho
                            </p>
                        </div>
                    )}

                    {status === 'qr' && !qrCode && <div className="text-center text-muted-foreground"><RefreshCcw className="mx-auto mb-3 h-8 w-8 animate-spin" /><p>Gerando QR Code real no serviço da Render…</p></div>}

                    {status === 'connected' && (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Sessão Ativa</h3>
                            <p className="text-muted-foreground max-w-md">
                                O seu número está conectado e os seus Agentes de IA estão escutando novas mensagens dos seus Leads.
                            </p>
                        </div>
                    )}
                </CardContent>
                {status === 'connected' && (
                    <CardFooter className="bg-muted/50 border-t flex justify-end">
                        <Button variant="destructive" onClick={handleDisconnect}>
                            <LogOut className="mr-2 h-4 w-4" /> Desconectar Sessão
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
