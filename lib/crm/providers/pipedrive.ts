import {
  CRMProvider,
  CRMContact,
  CRMDeal,
  TokenResult,
  CRMProfile,
} from './base';

export class PipedriveProvider implements CRMProvider {
  name = 'pipedrive';

  getAuthUrl(redirectUri: string, state: string): string {
    return (
      `https://oauth.pipedrive.com/oauth/authorize` +
      `?client_id=${process.env.PIPEDRIVE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResult> {
    const res = await fetch('https://oauth.pipedrive.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.PIPEDRIVE_CLIENT_ID || '',
        client_secret: process.env.PIPEDRIVE_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Pipedrive token exchange failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    const res = await fetch('https://oauth.pipedrive.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.PIPEDRIVE_CLIENT_ID || '',
        client_secret: process.env.PIPEDRIVE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) throw new Error('Pipedrive token refresh failed');

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async getProfile(accessToken: string): Promise<CRMProfile> {
    const res = await fetch('https://api.pipedrive.com/v1/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error('Failed to fetch Pipedrive profile');

    const data = await res.json();
    const user = data.data;
    return {
      id: user.id.toString(),
      name: `${user.name}`,
      email: user.email,
    };
  }

  async listContacts(
    accessToken: string,
    _instanceUrl?: string,
    updatedAfter?: string,
    limit = 100
  ): Promise<CRMContact[]> {
    let url = `https://api.pipedrive.com/v1/persons?limit=${limit}`;

    if (updatedAfter) {
      url += `&since_timestamp=${updatedAfter}`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error('Failed to list Pipedrive contacts');

    const data = await res.json();
    return (data.data || []).map((p: any) => ({
      id: p.id.toString(),
      firstName: p.name?.split(' ')[0] || '',
      lastName: p.name?.split(' ').slice(1).join(' ') || '',
      email: p.email?.[0]?.value || '',
      phone: p.phone?.[0]?.value || '',
      company: p.org_name || '',
      notes: p.note || '',
      createdAt: p.add_time,
      updatedAt: p.update_time,
      raw: p,
    }));
  }

  async getContact(
    accessToken: string,
    contactId: string
  ): Promise<CRMContact | null> {
    const res = await fetch(
      `https://api.pipedrive.com/v1/persons/${contactId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to get Pipedrive contact');

    const data = await res.json();
    const p = data.data;
    return {
      id: p.id.toString(),
      firstName: p.name?.split(' ')[0] || '',
      lastName: p.name?.split(' ').slice(1).join(' ') || '',
      email: p.email?.[0]?.value || '',
      phone: p.phone?.[0]?.value || '',
      company: p.org_name || '',
      raw: p,
    };
  }

  async createContact(
    accessToken: string,
    contact: CRMContact
  ): Promise<string> {
    const res = await fetch('https://api.pipedrive.com/v1/persons', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${contact.firstName} ${contact.lastName}`.trim(),
        email: contact.email ? [{ value: contact.email, primary: true }] : [],
        phone: contact.phone ? [{ value: contact.phone, primary: true }] : [],
      }),
    });

    if (!res.ok) throw new Error('Failed to create Pipedrive contact');

    const data = await res.json();
    return data.data.id.toString();
  }

  async updateContact(
    accessToken: string,
    contactId: string,
    fields: Partial<CRMContact>
  ): Promise<void> {
    const body: Record<string, any> = {};
    if (fields.firstName || fields.lastName) {
      body.name = `${fields.firstName || ''} ${fields.lastName || ''}`.trim();
    }
    if (fields.email) body.email = [{ value: fields.email, primary: true }];
    if (fields.phone) body.phone = [{ value: fields.phone, primary: true }];

    const res = await fetch(
      `https://api.pipedrive.com/v1/persons/${contactId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error('Failed to update Pipedrive contact');
  }

  async listDeals(
    accessToken: string,
    _instanceUrl?: string,
    updatedAfter?: string,
    limit = 100
  ): Promise<CRMDeal[]> {
    let url = `https://api.pipedrive.com/v1/deals?limit=${limit}`;
    if (updatedAfter) url += `&since_timestamp=${updatedAfter}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error('Failed to list Pipedrive deals');

    const data = await res.json();
    return (data.data || []).map((d: any) => ({
      id: d.id.toString(),
      name: d.title || '',
      stage: d.stage_id?.toString() || '',
      amount: d.value || 0,
      currency: d.currency || 'USD',
      contactId: d.person_id?.toString(),
      expectedCloseDate: d.close_date,
      raw: d,
    }));
  }

  async createDeal(
    accessToken: string,
    deal: CRMDeal
  ): Promise<string> {
    const res = await fetch('https://api.pipedrive.com/v1/deals', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: deal.name,
        value: deal.amount || 0,
        currency: deal.currency || 'USD',
        person_id: deal.contactId ? parseInt(deal.contactId) : undefined,
        stage_id: deal.stage ? parseInt(deal.stage) : undefined,
      }),
    });

    if (!res.ok) throw new Error('Failed to create Pipedrive deal');
    const data = await res.json();
    return data.data.id.toString();
  }

  async updateDeal(
    accessToken: string,
    dealId: string,
    fields: Partial<CRMDeal>
  ): Promise<void> {
    const body: Record<string, any> = {};
    if (fields.name) body.title = fields.name;
    if (fields.amount !== undefined) body.value = fields.amount;
    if (fields.stage) body.stage_id = parseInt(fields.stage);

    const res = await fetch(
      `https://api.pipedrive.com/v1/deals/${dealId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error('Failed to update Pipedrive deal');
  }
}
