import { type NextRequest, NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/knowledge-base';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.NEXT_PUBLIC_APP_URL) {
        console.error("Microsoft Auth environment variables are not set.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // Create a pending data source to be updated by the callback
    const pendingSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type: 'sharepoint',
        name: 'SharePoint (Connecting...)',
        status: 'Pending',
        lastSynced: 'Never',
    });

    const state = Buffer.from(JSON.stringify({ sourceId: pendingSource.id, tenantId })).toString('base64');
    
    const microsoftAuthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    microsoftAuthUrl.searchParams.set('client_id', process.env.MICROSOFT_CLIENT_ID!);
    microsoftAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`);
    microsoftAuthUrl.searchParams.set('response_type', 'code');
    microsoftAuthUrl.searchParams.set('scope', 'Sites.Read.All Files.Read.All offline_access User.Read');
    microsoftAuthUrl.searchParams.set('response_mode', 'query');
    microsoftAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(microsoftAuthUrl);
}
