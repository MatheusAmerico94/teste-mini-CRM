import { WhatsAppManager } from '@/components/whatsapp/WhatsAppManager';

export const dynamic = 'force-dynamic';

export default function WhatsAppPage() {
    return (
        <div className="animate-in fade-in-50 duration-500">
            <WhatsAppManager />
        </div>
    );
}
