import {
  CRMProvider,
  CRMContact,
  CRMDeal,
  TokenResult,
  CRMProfile,
} from './base';

const SF_LOGIN_URL = 'https://login.salesforce.com';
const SF_API_VERSION = 'v59.0';

export class SalesforceProvider implements CRMProvider {
  name = 'salesforce';

  getAuthUrl(redirectUri: string, state: string): string {
    return (
      `${SF_LOGIN_URL}/services/oauth2/authorize` +
      `?client_id=${process.env.SALESFORCE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&state=${state}` +
      `&scope=api refresh_token`
    );
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResult> {
    const res = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SALESFORCE_CLIENT_ID || '',
        client_secret: process.env.SALESFORCE_CLIENT_SECRET || '',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Salesforce token exchange failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      instanceUrl: data.instance_url,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResult> {
    const res = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SALESFORCE_CLIENT_ID || '',
        client_secret: process.env.SALESFORCE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) throw new Error('Salesforce token refresh failed');

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // SF doesn't return new refresh token
      instanceUrl: data.instance_url,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  }

  async getProfile(
    accessToken: string,
    instanceUrl?: string
  ): Promise<CRMProfile> {
    const base = instanceUrl || SF_LOGIN_URL;
    const res = await fetch(
      `${base}/services/data/${SF_API_VERSION}/sobjects/User/SELECT/FIELDS(ALL)/?q=SELECT+Id,Name,Email+FROM+User+WHERE+Id+LIKE+'005%'+LIMIT+1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Simpler: use identity endpoint
    const identityRes = await fetch('https://login.salesforce.com/services/oauth2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!identityRes.ok) throw new Error('Failed to fetch Salesforce profile');

    const identity = await identityRes.json();
    return {
      id: identity.user_id || identity.sub,
      name: identity.name || identity.preferred_username || '',
      email: identity.email,
    };
  }

  private soql(base: string, token: string, query: string) {
    return fetch(
      `${base}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  async listContacts(
    accessToken: string,
    instanceUrl?: string,
    updatedAfter?: string,
    limit = 100
  ): Promise<CRMContact[]> {
    const base = instanceUrl || SF_LOGIN_URL;
    let query = `SELECT Id,FirstName,LastName,Email,Phone,Company,Title,CreatedDate,SystemModstamp FROM Contact`;
    if (updatedAfter) {
      query += ` WHERE SystemModstamp >= ${updatedAfter}`;
    }
    query += ` ORDER BY SystemModstamp DESC LIMIT ${limit}`;

    const res = await this.soql(base, accessToken, query);
    if (!res.ok) throw new Error('Failed to list Salesforce contacts');

    const data = await res.json();
    return (data.records || []).map((c: any) => ({
      id: c.Id,
      firstName: c.FirstName || '',
      lastName: c.LastName || '',
      email: c.Email || '',
      phone: c.Phone || '',
      company: c.Company || '',
      jobTitle: c.Title || '',
      createdAt: c.CreatedDate,
      updatedAt: c.SystemModstamp,
      raw: c,
    }));
  }

  async getContact(
    accessToken: string,
    contactId: string,
    instanceUrl?: string
  ): Promise<CRMContact | null> {
    const base = instanceUrl || SF_LOGIN_URL;
    const res = await fetch(
      `${base}/services/data/${SF_API_VERSION}/sobjects/Contact/${contactId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to get Salesforce contact');

    const c = await res.json();
    return {
      id: c.Id,
      firstName: c.FirstName || '',
      lastName: c.LastName || '',
      email: c.Email || '',
      phone: c.Phone || '',
      company: c.Company || '',
      jobTitle: c.Title || '',
      raw: c,
    };
  }

  async createContact(
    accessToken: string,
    contact: CRMContact,
    instanceUrl?: string
  ): Promise<string> {
    const base = instanceUrl || SF_LOGIN_URL;
    const res = await fetch(
      `${base}/services/data/${SF_API_VERSION}/sobjects/Contact`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FirstName: contact.firstName,
          LastName: contact.lastName,
          Email: contact.email || '',
          Phone: contact.phone || '',
          Company: contact.company || '',
          Title: contact.jobTitle || '',
        }),
      }
    );

    if (!res.ok) throw new Error('Failed to create Salesforce contact');

    const data = await res.json();
    return data.id;
  }

  async updateContact(
    accessToken: string,
    contactId: string,
    fields: Partial<CRMContact>,
    instanceUrl?: string
  ): Promise<void> {
    const base = instanceUrl || SF_LOGIN_URL;
    const body: Record<string, string> = {};
    if (fields.firstName !== undefined) body.FirstName = fields.firstName;
    if (fields.lastName !== undefined) body.LastName = fields.lastName;
    if (fields.email !== undefined) body.Email = fields.email;
    if (fields.phone !== undefined) body.Phone = fields.phone;
    if (fields.company !== undefined) body.Company = fields.company;
    if (fields.jobTitle !== undefined) body.Title = fields.jobTitle;

    const res = await fetch(
      `${base}/services/data/${SF_API_VERSION}/sobjects/Contact/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error('Failed to update Salesforce contact');
  }

  async listDeals(
    accessToken: string,
    instanceUrl?: string,
    updatedAfter?: string,
    limit = 100
  ): Promise<CRMDeal[]> {
    const base = instanceUrl || SF_LOGIN_URL;
    let query = `SELECT Id,Name,Amount,CloseDate,StageName,CreatedDate,SystemModstamp FROM Opportunity`;
    if (updatedAfter) {
      query += ` WHERE SystemModstamp >= ${updatedAfter}`;
    }
    query += ` ORDER BY SystemModstamp DESC LIMIT ${limit}`;

    const res = await this.soql(base, accessToken, query);
    if (!res.ok) throw new Error('Failed to list Salesforce deals');

    const data = await res.json();
    return (data.records || []).map((d: any) => ({
      id: d.Id,
      name: d.Name || '',
      stage: d.StageName || '',
      amount: d.Amount || 0,
      expectedCloseDate: d.CloseDate,
      raw: d,
    }));
  }

  async createDeal(
    accessToken: string,
    deal: CRMDeal,
    instanceUrl?: string
  ): Promise<string> {
    const base = instanceUrl || SF_LOGIN_URL;
    const res = await fetch(
      `${base}/services/data/${SF_API_VERSION}/sobjects/Opportunity`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: deal.name,
          Amount: deal.amount || 0,
          StageName: deal.stage || 'Prospecting',
          CloseDate: deal.expectedCloseDate || new Date().toISOString().split('T')[0],
        }),
      }
    );

    if (!res.ok) throw new Error('Failed to create Salesforce deal');
    const data = await res.json();
    return data.id;
  }

  async updateDeal(
    accessToken: string,
    dealId: string,
    fields: Partial<CRMDeal>,
    instanceUrl?: string
  ): Promise<void> {
    const base = instanceUrl || SF_LOGIN_URL;
    const body: Record<string, any> = {};
    if (fields.name) body.Name = fields.name;
    if (fields.stage) body.StageName = fields.stage;
    if (fields.amount !== undefined) body.Amount = fields.amount;

    const res = await fetch(
      `${base}/services/data/${SF_API_VERSION}/sobjects/Opportunity/${dealId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error('Failed to update Salesforce deal');
  }
}
