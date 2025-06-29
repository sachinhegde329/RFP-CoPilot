import { type NextRequest, NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/knowledge-base';

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
    const pendingSource = knowledgeBaseService.addDataSource({
        tenantId,
        type: 'gdrive',
        name: 'Google Drive (Connecting...)',
        status: 'Pending',
        lastSynced: 'Never',
    });

    const state = Buffer.from(JSON.stringify({ sourceId: pendingSource.id, tenantId })).toString('base64');
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.readonly profile email');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent'); // Forces a refresh token to be sent
    googleAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(googleAuthUrl);
}
