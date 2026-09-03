/**
 * Base CRM Provider Interface
 * All CRM providers implement this interface for uniform bidirectional sync.
 */

export interface CRMContact {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  tags?: string[];
  notes?: string;
  leadScore?: number;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  // Provider-specific raw data
  raw?: Record<string, any>;
}

export interface CRMDeal {
  id?: string;
  name: string;
  stage?: string;
  amount?: number;
  currency?: string;
  contactId?: string;
  contactEmail?: string;
  expectedCloseDate?: string;
  notes?: string;
  raw?: Record<string, any>;
}

export interface CRMProvider {
  name: string;

  /** Exchange authorization code for access token */
  exchangeCode(code: string, redirectUri: string): Promise<TokenResult>;

  /** Refresh an expired access token */
  refreshToken(refreshToken: string): Promise<TokenResult>;

  /** Get the CRM user's info to verify connection */
  getProfile(accessToken: string, instanceUrl?: string): Promise<CRMProfile>;

  /** List contacts, optionally filtered by updated-after timestamp */
  listContacts(
    accessToken: string,
    instanceUrl?: string,
    updatedAfter?: string,
    limit?: number
  ): Promise<CRMContact[]>;

  /** Get a single contact by ID */
  getContact(
    accessToken: string,
    contactId: string,
    instanceUrl?: string
  ): Promise<CRMContact | null>;

  /** Create a contact, returns the new ID */
  createContact(
    accessToken: string,
    contact: CRMContact,
    instanceUrl?: string
  ): Promise<string>;

  /** Update a contact by ID */
  updateContact(
    accessToken: string,
    contactId: string,
    fields: Partial<CRMContact>,
    instanceUrl?: string
  ): Promise<void>;

  /** List deals, optionally filtered by updated-after timestamp */
  listDeals(
    accessToken: string,
    instanceUrl?: string,
    updatedAfter?: string,
    limit?: number
  ): Promise<CRMDeal[]>;

  /** Create a deal */
  createDeal(
    accessToken: string,
    deal: CRMDeal,
    instanceUrl?: string
  ): Promise<string>;

  /** Update a deal by ID */
  updateDeal(
    accessToken: string,
    dealId: string,
    fields: Partial<CRMDeal>,
    instanceUrl?: string
  ): Promise<void>;

  /** Build the OAuth authorization URL */
  getAuthUrl(redirectUri: string, state: string): string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  instanceUrl?: string;
}

export interface CRMProfile {
  id: string;
  name: string;
  email?: string;
  company?: string;
}
