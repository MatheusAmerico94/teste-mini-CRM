import { getLeads } from '@/lib/actions/leads';
import { WhatsAppChatClient } from '@/components/whatsapp/WhatsAppChatClient';

export default async function ConversasPage({
    searchParams,
}: {
    searchParams: { leadId?: string }
}) {
    // Fetch all leads for the sidebar
    const leads = await getLeads();

    return (
        <div className="h-[calc(100vh-8rem)] w-full flex flex-col bg-slate-50 dark:bg-slate-950 border rounded-xl overflow-hidden shadow-sm">
            <WhatsAppChatClient initialLeads={leads} initialSelectedLeadId={searchParams.leadId} />
        </div>
    );
}
