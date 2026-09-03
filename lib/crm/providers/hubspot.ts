import {
  CRMProvider,
  CRMContact,
  CRMDeal,
  TokenResult,
  CRMProfile,
} from './base';

const HUBSPOT_API = 'https://api.hubapi.com';

export class HubSpotProvider implements CRMProvider {
  name = 'hubspot';

  getAuthUrl(redirectUri: string, state: string): string {
    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'oauth',
    ].join(' ');

    return (
      `https://app.hubspot.com/oauth/authorize` +
      `?client_id=${process.env.HUBSPOT_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${state}`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResult> {
    const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID || '',
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`HubSpot token exchange failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    const res = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID || '',
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`HubSpot token refresh failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async getProfile(accessToken: string): Promise<CRMProfile> {
    const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error('Failed to fetch HubSpot profile');

    // HubSpot doesn't have a direct "me" endpoint for contacts,
    // but we can verify the token works
    return { id: 'hubspot-user', name: 'HubSpot Connection' };
  }

  async listContacts(
    accessToken: string,
    _instanceUrl?: string,
    updatedAfter?: string,
    limit = 100
  ): Promise<CRMContact[]> {
    const properties = 'firstname,lastname,email,phone,company,jobtitle,createdate,notes_last_updated';
    let url = `${HUBSPOT_API}/crm/v3/objects/contacts?limit=${limit}&properties=${properties}`;

    if (updatedAfter) {
      // HubSpot uses过滤器
      const filter = JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'notes_last_updated',
                operator: 'GTE',
                value: updatedAfter,
              },
            ],
          },
        ],
      });
      url += `&filter=${encodeURIComponent(filter)}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error('Failed to list HubSpot contacts');

    const data = await res.json();
    return (data.results || []).map((c: any) => ({
      id: c.id,
      firstName: c.properties.firstname || '',
      lastName: c.properties.lastname || '',
      email: c.properties.email || '',
      phone: c.properties.phone || '',
      company: c.properties.company || '',
      jobTitle: c.properties.jobtitle || '',
      createdAt: c.properties.createdate,
      updatedAt: c.properties.notes_last_updated,
      raw: c,
    }));
  }

  async getContact(
    accessToken: string,
    contactId: string
  ): Promise<CRMContact | null> {
    const properties = 'firstname,lastname,email,phone,company,jobtitle';
    const res = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}?properties=${properties}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to get HubSpot contact');

    const c = await res.json();
    return {
      id: c.id,
      firstName: c.properties.firstname || '',
      lastName: c.properties.lastname || '',
      email: c.properties.email || '',
      phone: c.properties.phone || '',
      company: c.properties.company || '',
      jobTitle: c.properties.jobtitle || '',
      raw: c,
    };
  }

  async createContact(
    accessToken: string,
    contact: CRMContact
  ): Promise<string> {
    const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          firstname: contact.firstName,
          lastname: contact.lastName,
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          jobtitle: contact.jobTitle || '',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to create HubSpot contact: ${err.message}`);
    }

    const data = await res.json();
    return data.id;
  }

  async updateContact(
    accessToken: string,
    contactId: string,
    fields: Partial<CRMContact>
  ): Promise<void> {
    const properties: Record<string, string> = {};
    if (fields.firstName !== undefined) properties.firstname = fields.firstName;
    if (fields.lastName !== undefined) properties.lastname = fields.lastName;
    if (fields.email !== undefined) properties.email = fields.email;
    if (fields.phone !== undefined) properties.phone = fields.phone;
    if (fields.company !== undefined) properties.company = fields.company;
    if (fields.jobTitle !== undefined) properties.jobtitle = fields.jobTitle;

    const res = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      }
    );

    if (!res.ok) throw new Error('Failed to update HubSpot contact');
  }

  async listDeals(
    accessToken: string,
    _instanceUrl?: string,
    updatedAfter?: string,
    limit = 100
  ): Promise<CRMDeal[]> {
    const properties = 'dealname,amount,closedate,dealstage,associatedcontactid';
    let url = `${HUBSPOT_API}/crm/v3/objects/deals?limit=${limit}&properties=${properties}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error('Failed to list HubSpot deals');

    const data = await res.json();
    return (data.results || []).map((d: any) => ({
      id: d.id,
      name: d.properties.dealname || '',
      stage: d.properties.dealstage || '',
      amount: parseFloat(d.properties.amount) || 0,
      expectedCloseDate: d.properties.closedate,
      raw: d,
    }));
  }

  async createDeal(
    accessToken: string,
    deal: CRMDeal
  ): Promise<string> {
    const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          dealname: deal.name,
          amount: deal.amount?.toString() || '0',
          dealstage: deal.stage || 'appointmentscheduled',
          closedate: deal.expectedCloseDate || '',
        },
      }),
    });

    if (!res.ok) throw new Error('Failed to create HubSpot deal');
    const data = await res.json();
    return data.id;
  }

  async updateDeal(
    accessToken: string,
    dealId: string,
    fields: Partial<CRMDeal>
  ): Promise<void> {
    const properties: Record<string, string> = {};
    if (fields.name !== undefined) properties.dealname = fields.name;
    if (fields.stage !== undefined) properties.dealstage = fields.stage;
    if (fields.amount !== undefined) properties.amount = fields.amount.toString();

    const res = await fetch(
      `${HUBSPOT_API}/crm/v3/objects/deals/${dealId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      }
    );

    if (!res.ok) throw new Error('Failed to update HubSpot deal');
  }
}
