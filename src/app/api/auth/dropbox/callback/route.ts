import { type NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';
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
  const tenant = getTenantBySubdomain(tenantId);
  const redirectUrl = new URL(`/${tenant?.subdomain || ''}/knowledge-base`, request.url);

  if (!tenantId || !sourceId) {
     redirectUrl.searchParams.set('connect_error', 'dropbox_missing_state');
     return NextResponse.redirect(redirectUrl);
  }

  const dbx = new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
  });

  try {
    const tokenResponse = await dbx.auth.getAccessTokenFromCode(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/dropbox/callback`,
      code
    );
    
    const tokens: any = tokenResponse.result;

    const authData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenType: 'Bearer',
      expiryDate: Date.now() + tokens.expires_in * 1000,
    };
    
    const userAccount = await new Dropbox({ accessToken: authData.accessToken }).usersGetCurrentAccount();

    await knowledgeBaseService.updateDataSource(tenantId, sourceId, {
      status: 'Syncing',
      name: `Dropbox (${userAccount.result.name.display_name})`,
      auth: authData,
      lastSynced: 'In progress...',
    });
    
    // Don't await this, let it run in the background
    knowledgeBaseService.syncDataSource(tenantId, sourceId);

    redirectUrl.searchParams.set('connect_success', 'dropbox');
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Dropbox OAuth callback error:', error);
    await knowledgeBaseService.updateDataSource(tenantId, sourceId, { status: 'Error', lastSynced: 'Failed to connect' });
    redirectUrl.searchParams.set('connect_error', 'dropbox');
    return NextResponse.redirect(redirectUrl);
  }
}
