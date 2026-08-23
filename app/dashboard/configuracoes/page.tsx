import { getBusinessConfiguration } from '@/lib/actions/business';
import { BusinessSettingsManager } from '@/components/settings/BusinessSettingsManager';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const configuration = await getBusinessConfiguration();
  return <BusinessSettingsManager initialConfiguration={configuration} />;
}

