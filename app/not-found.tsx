export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">404 - Página não encontrada</h2>
            <p className="text-muted-foreground mb-8">O caminho que você buscou não existe no CRM.</p>
            <Link href="/dashboard">
                <Button>Voltar para Home</Button>
            </Link>
        </div>
    );
}
