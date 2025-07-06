import { type NextRequest, NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { getTenantBySubdomain } from '@/lib/tenants';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  let decodedState: { sourceId: string; tenantId: string };
  try {
    decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
  } catch (error) {
    console.error('Invalid state parameter:', error);
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }
  
  const { tenantId, sourceId } = decodedState;
  
  const tenant = await getTenantBySubdomain(tenantId);
  const redirectUrl = new URL(`/${tenant?.subdomain || ''}/knowledge-base`, request.url);

  if (!tenantId || !sourceId) {
     redirectUrl.searchParams.set('connect_error', 'gdrive_missing_state');
     return NextResponse.redirect(redirectUrl);
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const people = google.people({version: 'v1', auth: oAuth2Client});
    const me = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses',
    });
    
    const userName = me.data.names?.[0]?.displayName || me.data.emailAddresses?.[0]?.value || 'User';

    const authData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      expiryDate: tokens.expiry_date,
    };

    // In a real app, tokens should be encrypted before storing.
    await knowledgeBaseService.updateDataSource(tenantId, sourceId, {
      status: 'Syncing',
      name: `Google Drive (${userName})`,
      auth: authData,
      lastSynced: 'In progress...',
    });

    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, sourceId);
    
    redirectUrl.searchParams.set('connect_success', 'gdrive');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    // Update status to Error
    await knowledgeBaseService.updateDataSource(tenantId, sourceId, { status: 'Error', lastSynced: 'Failed to connect' });
    redirectUrl.searchParams.set('connect_error', 'gdrive');
    return NextResponse.redirect(redirectUrl);
  }
}
