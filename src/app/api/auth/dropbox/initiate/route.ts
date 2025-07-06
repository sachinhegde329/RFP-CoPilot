import { type NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
import { knowledgeBaseService } from '@/lib/knowledge-base';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!process.env.DROPBOX_APP_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
        console.error("Dropbox Auth environment variables are not set.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const pendingSource = await knowledgeBaseService.addDataSource({
        tenantId,
        type: 'dropbox',
        name: 'Dropbox (Connecting...)',
        status: 'Pending',
        lastSynced: 'Never',
    });

    const state = Buffer.from(JSON.stringify({ sourceId: pendingSource.id, tenantId })).toString('base64');
    
    const dbx = new Dropbox({ clientId: process.env.DROPBOX_APP_KEY });

    const authUrl = await dbx.auth.getAuthenticationUrl(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/dropbox/callback`,
        state,
        'code',
        'offline', // for refresh token
        ['files.content.read', 'account_info.read'],
        'user',
        false
    );

    return NextResponse.redirect(authUrl.toString());
}
