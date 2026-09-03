import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, Settings, Zap, Menu, Bot, Smartphone, MessageSquare, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ModeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    return (
        <div className="flex min-h-screen bg-muted/20 dark:bg-slate-950">
            {/* Sidebar Desktop */}
            <aside className="hidden w-64 flex-col border-r bg-background dark:bg-slate-900 border-border md:flex sticky top-0 h-screen">
                <div className="flex h-16 items-center px-6 border-b border-border">
                    <Zap className="h-6 w-6 text-primary mr-2 fill-primary" />
                    <span className="font-heading font-bold text-lg">Mini CRM</span>
                </div>
                <nav className="flex-1 flex flex-col gap-2 p-4">
                    <Link href="/dashboard">
                        <Button variant="default" className="w-full justify-start font-medium shadow-primary/20 bg-primary text-primary-foreground">
                            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
                        </Button>
                    </Link>
                    <Link href="/dashboard/agents">
                        <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
                            <Bot className="mr-3 h-5 w-5" /> Agentes IA
                        </Button>
                    </Link>
                    <Link href="/dashboard/whatsapp">
                        <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
                            <Smartphone className="mr-3 h-5 w-5" /> Configuração WhatsApp
                        </Button>
                    </Link>
                    <Link href="/dashboard/conversas">
                        <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
                            <MessageSquare className="mr-3 h-5 w-5" /> Conversas Chat
                        </Button>
                    </Link>
                    <Link href="/dashboard/leads">
                        <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
                            <Users className="mr-3 h-5 w-5" /> Leads
                        </Button>
                    </Link>
                    <Link href="/dashboard/prospeccao">
                        <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
                            <Target className="mr-3 h-5 w-5" /> Prospecção
                        </Button>
                    </Link>
                    <Link href="/dashboard/configuracoes">
                        <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-foreground">
                            <Settings className="mr-3 h-5 w-5" /> Configuração comercial
                        </Button>
                    </Link>
                    <div className="mt-auto">
                        <div className="bg-primary/10 rounded-xl p-4 mb-2">
                            <p className="text-sm font-semibold text-primary mb-1">Meta Mensal</p>
                            <div className="h-2 w-full bg-primary/20 rounded-full mb-2">
                                <div className="h-2 w-[75%] bg-primary rounded-full"></div>
                            </div>
                            <p className="text-xs text-primary/80">R$ 15k / R$ 20k</p>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Mobile Sidebar & Main Content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b bg-background/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 border-border">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 p-0">
                                {/* Mobile Nav Content */}
                                <div className="flex flex-col h-full">
                                    <div className="flex h-16 items-center px-6 border-b">
                                        <Zap className="h-6 w-6 text-primary mr-2 fill-primary" />
                                        <span className="font-heading font-bold text-lg">Mini CRM</span>
                                    </div>
                                    <nav className="flex-1 p-4 gap-2 flex flex-col">
                                        <Button variant="default" className="w-full justify-start"><LayoutDashboard className="mr-2" /> Dashboard</Button>
                                        <Link href="/dashboard/whatsapp" className="w-full">
                                            <Button variant="ghost" className="w-full justify-start"><Smartphone className="mr-2" /> WhatsApp</Button>
                                        </Link>
                                        <Link href="/dashboard/conversas" className="w-full">
                                            <Button variant="ghost" className="w-full justify-start"><MessageSquare className="mr-2" /> Conversas</Button>
                                        </Link>
                                        <Link href="/dashboard/leads" className="w-full">
                                            <Button variant="ghost" className="w-full justify-start"><Users className="mr-2" /> Leads</Button>
                                        </Link>
                                        <Link href="/dashboard/prospeccao" className="w-full">
                                            <Button variant="ghost" className="w-full justify-start"><Target className="mr-2" /> Prospecção</Button>
                                        </Link>
                                        <Link href="/dashboard/configuracoes" className="w-full">
                                            <Button variant="ghost" className="w-full justify-start"><Settings className="mr-2" /> Configurações</Button>
                                        </Link>
                                    </nav>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <h1 className="font-heading font-semibold text-xl hidden md:block">Visão Geral</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "h-9 w-9 ring-2 ring-primary/20"
                                }
                            }}
                        />
                    </div>
                </header>
                <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
