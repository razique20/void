import { CRMProvider } from './base';
import { HubSpotProvider } from './hubspot';
import { PipedriveProvider } from './pipedrive';
import { SalesforceProvider } from './salesforce';

export type CRMProviderName = 'salesforce' | 'hubspot' | 'pipedrive';

const providers: Record<CRMProviderName, CRMProvider> = {
  hubspot: new HubSpotProvider(),
  salesforce: new SalesforceProvider(),
  pipedrive: new PipedriveProvider(),
};

export function getCRMProvider(name: CRMProviderName): CRMProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown CRM provider: ${name}`);
  return provider;
}

export const CRM_PROVIDER_INFO: Record<
  CRMProviderName,
  { label: string; color: string; icon: string; description: string }
> = {
  hubspot: {
    label: 'HubSpot',
    color: 'orange',
    icon: '🟠',
    description: 'Contacts, deals, and marketing automation',
  },
  salesforce: {
    label: 'Salesforce',
    color: 'blue',
    icon: '🔵',
    description: 'Enterprise CRM with full pipeline management',
  },
  pipedrive: {
    label: 'Pipedrive',
    color: 'green',
    icon: '🟢',
    description: 'Sales-focused CRM with visual pipeline',
  },
};

export type { CRMProvider, CRMContact, CRMDeal, TokenResult, CRMProfile } from './base';
