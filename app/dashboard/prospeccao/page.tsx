import { getProspects } from '@/lib/actions/prospecting';
import { ProspectingManager } from '@/components/prospecting/ProspectingManager';

export const dynamic = 'force-dynamic';

export default async function ProspectingPage() {
  const prospects = await getProspects();
  return <ProspectingManager initialProspects={prospects} />;
}
