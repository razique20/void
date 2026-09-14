import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google, type GoogleApis } from 'googleapis';
import { getUserSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await getUserSubscription(userId);
    if (!sub.planInfo.features.includes('sheets')) {
      return NextResponse.json({ error: 'Feature not available on your plan' }, { status: 403 });
    }

    const body = await req.json();
    const { credentials } = body;

    if (!credentials) {
      return NextResponse.json({ error: 'credentials are required' }, { status: 400 });
    }

    try {
      const creds = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;

      const googleAuth = google.auth as GoogleApis['google']['auth'];
      const auth = new googleAuth.GoogleAuth({
        credentials: {
          type: creds.type,
          project_id: creds.project_id,
          private_key_id: creds.private_key_id,
          private_key: creds.private_key.replace(/\\n/g, '\n'),
          client_email: creds.client_email,
          client_id: creds.client_id,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const gSheets = google.sheets as GoogleApis['google']['sheets'];
      const sheets = gSheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.list({
        fields: 'spreadsheets(id,title,properties.sheetId)',
        maxResults: 50,
      });

      const spreadsheets = (response.data.spreadsheets ?? []).map((s: any) => ({
        spreadsheetId: s.spreadsheetId,
        title: s.properties?.title ?? 'Untitled spreadsheet',
        totalSheets: s.properties?.sheetId ? 1 : 0,
      }));

      return NextResponse.json({ spreadsheets });
    } catch (listError: any) {
      return NextResponse.json(
        { error: 'Invalid credentials or cannot access Google Sheets', details: listError.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[SHEETS_LIST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
