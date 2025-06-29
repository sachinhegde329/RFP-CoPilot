import { type NextRequest, NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { getTenantBySubdomain } from '@/lib/tenants';

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
  
  if (!tenantId || !sourceId) {
     return NextResponse.redirect(new URL('/login?error=missing_state_data', request.url));
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
        scope: 'Sites.Read.All Files.Read.All offline_access',
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

    // In a real app, tokens should be encrypted before storing.
    knowledgeBaseService.updateDataSource(tenantId, sourceId, {
      status: 'Synced',
      name: 'SharePoint', // Can be updated later with user info
      auth: authData,
      lastSynced: 'Just now',
    });

    const tenant = getTenantBySubdomain(tenantId);
    const redirectUrl = new URL(`/${tenant?.subdomain || ''}/knowledge-base`, request.url);
    redirectUrl.searchParams.set('connect_success', 'sharepoint');
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    // Update status to Error
    knowledgeBaseService.updateDataSource(tenantId, sourceId, { status: 'Error', lastSynced: 'Failed to connect' });
    const tenant = getTenantBySubdomain(tenantId);
    const redirectUrl = new URL(`/${tenant?.subdomain || ''}/knowledge-base`, request.url);
    redirectUrl.searchParams.set('connect_error', 'sharepoint');
    return NextResponse.redirect(redirectUrl);
  }
}
