import { type NextRequest, NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_APP_URL) {
        console.error("Google Auth environment variables are not set.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // Create a pending data source to be updated by the callback
    const pendingSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type: 'gdrive',
        name: 'Google Drive (Connecting...)',
        status: 'Pending',
        lastSynced: 'Never',
    });

    const state = Buffer.from(JSON.stringify({ sourceId: pendingSource.id, tenantId })).toString('base64');
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    const googleAuthUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly', 
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent',
      state: state,
    });

    return NextResponse.redirect(googleAuthUrl);
}
