/**
 * Client-side error reporter.
 * Sends errors to the server-side logging system via /api/errors.
 * Use this in error boundaries, global handlers, and catch blocks.
 */

interface ReportErrorOptions {
  message: string;
  stack?: string;
  source?: string;
  url?: string;
  userId?: string;
}

export async function reportError(options: ReportErrorOptions): Promise<void> {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail — don't break the app if error reporting fails
  }
}

/**
 * Global error handler for unhandled errors.
 * Call this once in a top-level component or layout.
 */
export function setupGlobalErrorHandlers(userId?: string) {
  // Catch unhandled errors
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      reportError({
        message: String(message),
        stack: error?.stack,
        source: 'window.onerror',
        url: window.location.href,
        userId,
      });
    };

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      reportError({
        message: error?.message || String(error),
        stack: error?.stack,
        source: 'unhandledrejection',
        url: window.location.href,
        userId,
      });
    });
  }
}
