import { type NextRequest, NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { getTenantBySubdomain } from '@/lib/tenants';
import { Client } from '@microsoft/microsoft-graph-client';
import { secretsService } from '@/lib/secrets.service';

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
  
  const tenant = getTenantBySubdomain(tenantId);
  const redirectUrl = new URL(`/${tenant?.subdomain || ''}/knowledge-base`, request.url);

  if (!tenantId || !sourceId) {
     redirectUrl.searchParams.set('connect_error', 'sharepoint_missing_state');
     return NextResponse.redirect(redirectUrl);
  }

  try {
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
        scope: 'Sites.Read.All Files.Read.All offline_access User.Read',
      }),
    });
    
    if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Failed to fetch Microsoft tokens:', errorData);
        throw new Error(errorData.error_description || 'Failed to exchange code for tokens.');
    }

    const tokens = await tokenResponse.json();

    const authData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      expiryDate: Date.now() + tokens.expires_in * 1000,
    };

    // Store tokens securely
    await secretsService.createOrUpdateSecret(tenantId, sourceId, authData);

    const graphClient = Client.init({ authProvider: (done) => done(null, authData.accessToken) });
    const user = await graphClient.api('/me').get();

    // Update the data source with non-sensitive information
    await knowledgeBaseService.updateDataSource(tenantId, sourceId, {
      status: 'Syncing',
      name: `SharePoint (${user.displayName || user.userPrincipalName})`,
      lastSynced: 'In progress...',
    });
    
    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, sourceId);
    
    redirectUrl.searchParams.set('connect_success', 'sharepoint');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    // Update status to Error
    await knowledgeBaseService.updateDataSource(tenantId, sourceId, { status: 'Error', lastSynced: 'Failed to connect' });
    redirectUrl.searchParams.set('connect_error', 'sharepoint');
    return NextResponse.redirect(redirectUrl);
  }
}
