import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, Users, Zap, LayoutDashboard } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-24 w-96 h-96 bg-orange-600/20 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 left-1/3 w-full h-64 bg-slate-900/50 blur-3xl" />

      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-orange-500 fill-orange-500" />
          <span className="font-heading font-bold text-xl tracking-tight">Mini CRM</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 font-medium">Entrar</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-orange-600 hover:bg-orange-500 text-white rounded-full px-6 shadow-lg shadow-orange-900/20">Começar Grátis</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 z-10 max-w-6xl mx-auto mt-16 mb-24">
        <Badge variant="outline" className="mb-8 px-4 py-1.5 border-orange-500/30 text-orange-400 bg-orange-500/10 rounded-full text-sm font-medium backdrop-blur-sm">
          🚀 v1.0 Early Access • Totalmente Gratuito
        </Badge>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400 mb-8 tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Venda mais com <br className="hidden md:block" />
          <span className="text-orange-500">menos esforço.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          O CRM pessoal definitivo para freelancers e vendedores de elite.
          Organize seus leads com um Kanban intuitivo e acompanhe métricas em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mb-24 w-full justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
              Acessar Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 backdrop-blur-sm w-full sm:w-auto">
            Ver Demo em Vídeo
          </Button>
        </div>

        {/* Dashboard Preview (Mock) */}
        <div className="w-full max-w-5xl rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-2 shadow-2xl mb-24 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-60"></div>
          <div className="grid grid-cols-4 gap-4 p-6 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
            {/* Mock UI elements simulating the dashboard */}
            <div className="col-span-1 space-y-4">
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-800/50 rounded animate-pulse"></div>
              <div className="bg-slate-800/30 rounded-lg h-64 p-4 space-y-3">
                <div className="h-20 bg-slate-800 rounded border-l-4 border-orange-500"></div>
                <div className="h-20 bg-slate-800 rounded border-l-4 border-purple-500"></div>
              </div>
            </div>
            <div className="col-span-3 space-y-4">
              <div className="flex justify-between">
                <div className="h-8 w-48 bg-slate-800 rounded"></div>
                <div className="h-8 w-8 bg-slate-800 rounded-full"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-slate-800/40 rounded-xl border border-white/5"></div>
                <div className="h-32 bg-slate-800/40 rounded-xl border border-white/5"></div>
                <div className="h-32 bg-slate-800/40 rounded-xl border border-white/5"></div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full bg-white text-slate-950 hover:bg-slate-200 font-bold px-8 shadow-2xl scale-110">
                <LayoutDashboard className="mr-2 h-5 w-5" /> Entrar no Sistema
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left max-w-5xl">
          {[
            { title: "Pipeline Kanban", icon: BarChart3, desc: "Arraste e solte leads entre etapas. Visualize seu progresso instantaneamente.", color: "text-orange-400" },
            { title: "Gestão Unificada", icon: Users, desc: "Histórico completo, notas e valores. Tudo o que você precisa em um clique.", color: "text-purple-400" },
            { title: "Foco Total", icon: Zap, desc: "Interface limpa e rápida. Sem distrações, apenas você e suas vendas.", color: "text-yellow-400" }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-orange-500/30 hover:bg-slate-900/80 transition-all duration-300 group">
              <div className={`h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.color}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-3">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 bg-slate-950 text-center relative z-10">
        <p className="text-slate-600 font-medium">© 2024 Mini CRM. Design System por Shadcn/UI.</p>
      </footer>
    </div>
  );
}
