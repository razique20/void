/**
 * Auto-detect IMAP/SMTP server configurations based on the email address domain.
 * Covers Gmail, Outlook, Yahoo, Zoho, iCloud, and AOL out-of-the-box.
 */

export interface ProviderConfig {
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  note?: string;
  supportsOAuth?: boolean;
}

const PROVIDER_MAP: Record<string, ProviderConfig> = {
  'gmail.com': {
    name: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    note: 'Use an App Password (not your Google account password). Enable 2FA in Google Account → Security → App Passwords.',
    supportsOAuth: true
  },
  'googlemail.com': {
    name: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    note: 'Use an App Password (not your Google account password).',
    supportsOAuth: true
  },
  'outlook.com': {
    name: 'Outlook',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587,
    note: 'Use your Outlook account password or App Password.'
  },
  'hotmail.com': {
    name: 'Outlook (Hotmail)',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587
  },
  'live.com': {
    name: 'Outlook (Live)',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp-mail.outlook.com',
    smtpPort: 587
  },
  'yahoo.com': {
    name: 'Yahoo Mail',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    note: 'Use an App Password from Yahoo Account Security settings.'
  },
  'zoho.com': {
    name: 'Zoho Mail',
    imapHost: 'imap.zoho.com',
    imapPort: 993,
    smtpHost: 'smtp.zoho.com',
    smtpPort: 465
  },
  'icloud.com': {
    name: 'iCloud Mail',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    note: 'Use an App-Specific Password from Apple ID → Sign-In & Security.'
  },
  'me.com': {
    name: 'iCloud Mail',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    note: 'Use an App-Specific Password.'
  },
  'aol.com': {
    name: 'AOL Mail',
    imapHost: 'imap.aol.com',
    imapPort: 993,
    smtpHost: 'smtp.aol.com',
    smtpPort: 465
  },
  'yandex.com': {
    name: 'Yandex Mail',
    imapHost: 'imap.yandex.com',
    imapPort: 993,
    smtpHost: 'smtp.yandex.com',
    smtpPort: 465
  }
};

/**
 * Detect IMAP/SMTP provider config from an email address.
 * Returns null if the domain is not recognized (user must enter manually).
 */
export function detectProviderFromEmail(email: string): ProviderConfig | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return PROVIDER_MAP[domain] || null;
}

/**
 * Get all known provider domains for UI display.
 */
export function getKnownProviders(): string[] {
  return Object.keys(PROVIDER_MAP);
}
