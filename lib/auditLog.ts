import connectDB from './mongodb';
import AuditLog from '@/models/AuditLog';

export interface AuditEntry {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  summary: string;
  details?: Record<string, any>;
}

/**
 * Record an admin audit log entry.
 * Fire-and-forget: never throws, never blocks the caller.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create(entry);
  } catch (err) {
    // Audit logging should never break the admin flow
    console.error('[AUDIT_LOG_ERROR]', err);
  }
}
