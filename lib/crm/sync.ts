/**
 * Bidirectional CRM Sync Engine
 *
 * Handles pushing VOID leads/contacts to CRM and pulling CRM contacts back.
 * Uses delta sync (only changed records) and conflict resolution.
 */

import connectDB from '@/lib/mongodb';
import CRMConnection from '@/models/CRMConnection';
import CRMSyncLog from '@/models/CRMSyncLog';
import Lead from '@/models/Lead';
import { getCRMProvider, CRMProviderName, CRMContact } from './providers';

export interface SyncResult {
  direction: 'push' | 'pull';
  status: 'success' | 'partial' | 'failed';
  recordType: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  conflicts: any[];
  error?: string;
  durationMs: number;
}

/**
 * Refresh token if expired, update DB with new token.
 */
async function ensureValidToken(connection: any): Promise<string> {
  if (
    connection.tokenExpiresAt &&
    new Date(connection.tokenExpiresAt) > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return connection.accessToken;
  }

  if (!connection.refreshToken) {
    throw new Error('Access token expired and no refresh token available');
  }

  const provider = getCRMProvider(connection.provider as CRMProviderName);
  const tokenResult = await provider.refreshToken(connection.refreshToken);

  // Update tokens in DB
  await CRMConnection.findByIdAndUpdate(connection._id, {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken || connection.refreshToken,
    tokenExpiresAt: tokenResult.expiresAt,
    instanceUrl: tokenResult.instanceUrl || connection.instanceUrl,
  });

  return tokenResult.accessToken;
}

/**
 * Convert a VOID Lead to a CRMContact for pushing.
 */
function leadToCRMContact(lead: any): CRMContact {
  return {
    firstName: lead.contactInfo?.name?.split(' ')[0] || '',
    lastName: lead.contactInfo?.name?.split(' ').slice(1).join(' ') || '',
    email: lead.contactInfo?.email || '',
    phone: lead.contactInfo?.phone || '',
    notes: lead.interest || '',
    tags: [lead.source, lead.sentiment].filter(Boolean),
    source: lead.source,
    leadScore: lead.predictiveScore?.heatScore,
  };
}

/**
 * Convert a CRMContact back to a VOID Lead shape.
 */
function crmContactToLeadShape(contact: CRMContact, source: string): any {
  return {
    contactInfo: {
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      email: contact.email || '',
      phone: contact.phone || '',
    },
    interest: contact.notes || '',
    source: `CRM:${source}`,
    data: {
      crmId: contact.id,
      company: contact.company,
      jobTitle: contact.jobTitle,
      tags: contact.tags,
    },
  };
}

/**
 * PUSH: Send VOID leads to CRM
 */
export async function pushLeadsToCRM(userId: string): Promise<SyncResult> {
  const startTime = Date.now();
  await connectDB();

  const connection = await CRMConnection.findOne({ userId, isActive: true });
  if (!connection) throw new Error('No active CRM connection');

  const provider = getCRMProvider(connection.provider as CRMProviderName);
  const accessToken = await ensureValidToken(connection);

  const result: SyncResult = {
    direction: 'push',
    status: 'success',
    recordType: 'lead',
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    conflicts: [],
    durationMs: 0,
  };

  try {
    // Get leads not yet synced (no crmId in data)
    const leads = await Lead.find({
      userId,
      $or: [
        { 'data.crmId': { $exists: false } },
        { 'data.crmId': null },
      ],
    }).limit(100);

    // Also get leads updated after last push
    const lastPush = connection.syncState?.lastPushAt;
    const updatedLeads = lastPush
      ? await Lead.find({
          userId,
          updatedAt: { $gte: lastPush },
          'data.crmId': { $exists: true, $ne: null },
        }).limit(100)
      : [];

    const allLeads = [...leads, ...updatedLeads];

    for (const lead of allLeads) {
      try {
        const crmContact = leadToCRMContact(lead);

        if (lead.data?.crmId) {
          // Update existing CRM record
          await provider.updateContact(accessToken, lead.data.crmId, crmContact, connection.instanceUrl);
          result.updated++;
        } else {
          // Create new CRM record
          const newId = await provider.createContact(accessToken, crmContact, connection.instanceUrl);
          // Store CRM ID back on the lead
          await Lead.findByIdAndUpdate(lead._id, {
            $set: { 'data.crmId': newId },
            $push: {
              activityLog: {
                action: 'crm_pushed',
                detail: `Synced to ${connection.provider} (${newId})`,
                timestamp: new Date(),
              },
            },
          });
          result.created++;
        }
      } catch (err: any) {
        console.error(`[CRM_PUSH] Failed for lead ${lead._id}:`, err.message);
        result.failed++;
      }
    }

    result.status = result.failed > 0 ? 'partial' : 'success';
  } catch (err: any) {
    result.status = 'failed';
    result.error = err.message;
  }

  result.durationMs = Date.now() - startTime;

  // Update connection sync state
  await CRMConnection.findByIdAndUpdate(connection._id, {
    $set: {
      'syncState.lastPushAt': new Date(),
      'syncState.lastSyncAt': new Date(),
      'syncState.lastSyncStatus': result.status,
      'syncState.lastSyncError': result.error || null,
      'syncState.recordsPushed': (connection.syncState?.recordsPushed || 0) + result.created + result.updated,
    },
  });

  // Log the sync
  await CRMSyncLog.create({
    userId,
    connectionId: connection._id,
    provider: connection.provider,
    direction: 'push',
    status: result.status,
    recordType: 'lead',
    recordCount: result.created + result.updated + result.skipped + result.failed,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
    error: result.error,
    startedAt: new Date(startTime),
    completedAt: new Date(),
    durationMs: result.durationMs,
  });

  return result;
}

/**
 * PULL: Fetch contacts from CRM and create/update VOID leads
 */
export async function pullContactsFromCRM(userId: string): Promise<SyncResult> {
  const startTime = Date.now();
  await connectDB();

  const connection = await CRMConnection.findOne({ userId, isActive: true });
  if (!connection) throw new Error('No active CRM connection');

  const provider = getCRMProvider(connection.provider as CRMProviderName);
  const accessToken = await ensureValidToken(connection);

  const result: SyncResult = {
    direction: 'pull',
    status: 'success',
    recordType: 'contact',
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    conflicts: [],
    durationMs: 0,
  };

  try {
    const lastPull = connection.syncState?.lastPullAt;
    const updatedAfter = lastPull ? lastPull.toISOString() : undefined;

    const crmContacts = await provider.listContacts(
      accessToken,
      connection.instanceUrl,
      updatedAfter,
      100
    );

    for (const contact of crmContacts) {
      try {
        if (!contact.email && !contact.phone) {
          result.skipped++;
          continue;
        }

        // Check if we already have this contact
        const query: any[] = [];
        if (contact.email) query.push({ 'contactInfo.email': contact.email });
        if (contact.phone) query.push({ 'contactInfo.phone': contact.phone });
        if (contact.id) query.push({ 'data.crmId': contact.id });

        const existingLead = query.length > 0
          ? await Lead.findOne({ userId, $or: query })
          : null;

        if (existingLead) {
          // CONFLICT DETECTION: Compare fields
          const conflicts = detectConflicts(existingLead, contact);

          if (conflicts.length > 0) {
            // Auto-resolve: CRM wins for pull (most recent external source)
            for (const conflict of conflicts) {
              await Lead.findByIdAndUpdate(existingLead._id, {
                $set: { [`contactInfo.${conflict.fieldName}`]: conflict.crmValue },
              });
              result.conflicts.push({
                recordId: existingLead._id.toString(),
                fieldName: conflict.fieldName,
                voidValue: conflict.voidValue,
                crmValue: conflict.crmValue,
                resolution: 'crm_wins',
                resolvedAt: new Date(),
              });
            }
          }

          // Update CRM ID if missing
          if (!existingLead.data?.crmId && contact.id) {
            await Lead.findByIdAndUpdate(existingLead._id, {
              $set: { 'data.crmId': contact.id },
            });
          }

          result.updated++;
        } else {
          // Create new lead from CRM contact
          const leadData = crmContactToLeadShape(contact, connection.provider);
          await Lead.create({
            userId,
            workerId: 'crm-import',
            ...leadData,
            status: 'new',
            activityLog: [
              {
                action: 'crm_pulled',
                detail: `Imported from ${connection.provider} (${contact.id})`,
                timestamp: new Date(),
              },
            ],
          });
          result.created++;
        }
      } catch (err: any) {
        console.error(`[CRM_PULL] Failed for contact ${contact.id}:`, err.message);
        result.failed++;
      }
    }

    result.status = result.failed > 0 ? 'partial' : 'success';
  } catch (err: any) {
    result.status = 'failed';
    result.error = err.message;
  }

  result.durationMs = Date.now() - startTime;

  // Update connection sync state
  await CRMConnection.findByIdAndUpdate(connection._id, {
    $set: {
      'syncState.lastPullAt': new Date(),
      'syncState.lastSyncAt': new Date(),
      'syncState.lastSyncStatus': result.status,
      'syncState.lastSyncError': result.error || null,
      'syncState.recordsPulled': (connection.syncState?.recordsPulled || 0) + result.created + result.updated,
      'syncState.totalConflicts': (connection.syncState?.totalConflicts || 0) + result.conflicts.length,
    },
  });

  // Log the sync
  await CRMSyncLog.create({
    userId,
    connectionId: connection._id,
    provider: connection.provider,
    direction: 'pull',
    status: result.status,
    recordType: 'contact',
    recordCount: result.created + result.updated + result.skipped + result.failed,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
    conflicts: result.conflicts,
    error: result.error,
    startedAt: new Date(startTime),
    completedAt: new Date(),
    durationMs: result.durationMs,
  });

  return result;
}

/**
 * Detect field-level conflicts between a VOID lead and a CRM contact.
 */
function detectConflicts(
  lead: any,
  crmContact: CRMContact
): { fieldName: string; voidValue: any; crmValue: any }[] {
  const conflicts: { fieldName: string; voidValue: any; crmValue: any }[] = [];

  const fields = [
    { key: 'email', voidPath: 'contactInfo.email', crmField: 'email' },
    { key: 'phone', voidPath: 'contactInfo.phone', crmField: 'phone' },
    { key: 'name', voidPath: 'contactInfo.name', crmField: null },
  ];

  for (const field of fields) {
    const voidValue = field.voidPath
      .split('.')
      .reduce((obj, key) => obj?.[key], lead);
    const crmValue = field.crmField
      ? (crmContact as any)[field.crmField]
      : `${crmContact.firstName} ${crmContact.lastName}`.trim();

    if (
      voidValue &&
      crmValue &&
      voidValue !== crmValue &&
      crmValue.trim() !== ''
    ) {
      conflicts.push({
        fieldName: field.key,
        voidValue,
        crmValue,
      });
    }
  }

  return conflicts;
}

/**
 * Full bidirectional sync — push then pull.
 */
export async function fullSync(userId: string): Promise<{
  push: SyncResult;
  pull: SyncResult;
}> {
  const push = await pushLeadsToCRM(userId);
  const pull = await pullContactsFromCRM(userId);
  return { push, pull };
}
