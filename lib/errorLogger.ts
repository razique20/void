import connectDB from './mongodb';
import SystemLog from '@/models/SystemLog';

type LogType = 'error' | 'warning' | 'info';

interface LogOptions {
  type?: LogType;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
}

/**
 * Log an event to the admin System Logs.
 * Use this throughout the app to record errors, warnings, and important info.
 */
export async function logToAdmin(options: LogOptions): Promise<void> {
  try {
    await connectDB();
    await SystemLog.create({
      type: options.type || 'info',
      source: options.source,
      message: options.message,
      metadata: options.metadata,
      userId: options.userId,
    });
  } catch (err) {
    // Never let logging failures break the app
    console.error('[ERROR_LOGGER_FAILED]', err);
  }
}

/**
 * Log an error with full context (stack trace, request info, etc.)
 */
export async function logError(
  source: string,
  error: unknown,
  context?: Record<string, any>
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  
  await logToAdmin({
    type: 'error',
    source,
    message: err.message,
    metadata: {
      ...context,
      stack: err.stack,
      name: err.name,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log a warning
 */
export async function logWarning(
  source: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logToAdmin({ type: 'warning', source, message, metadata });
}

/**
 * Log an info event
 */
export async function logInfo(
  source: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logToAdmin({ type: 'info', source, message, metadata });
}

/**
 * Express/Next.js error handler wrapper.
 * Wraps an API route handler and logs any unhandled errors.
 */
export function withErrorLogging(
  source: string,
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any): Promise<Response> => {
    try {
      return await handler(req, context);
    } catch (error) {
      await logError(source, error, {
        url: req.url,
        method: req.method,
      });
      // Re-throw so Next.js still returns a 500
      throw error;
    }
  };
}
