
import { type NextRequest, NextResponse } from 'next/server';
import { getTenantBySubdomain, updateTenant } from '@/lib/tenants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=sso_oauth_failed', request.url));
  }

  let decodedState: { tenantId: string };
  try {
    decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
  } catch (error) {
    console.error('Invalid state parameter:', error);
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }
  
  const { tenantId } = decodedState;
  
  if (!tenantId) {
     return NextResponse.redirect(new URL('/login?error=missing_state_data', request.url));
  }
  
  const tenant = getTenantBySubdomain(tenantId);
  const redirectUrl = new URL(`/${tenant?.subdomain || ''}/settings/security`, request.url);

  try {
    // In a real application, you would exchange the code for an access token here
    // with a POST request to Google's token endpoint.
    // For this example, we will simulate success and update our tenant data.
    
    updateTenant(tenantId, { ssoProvider: 'google' });

    redirectUrl.searchParams.set('sso_success', 'google');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google SSO callback error:', error);
    redirectUrl.searchParams.set('sso_error', 'google');
    return NextResponse.redirect(redirectUrl);
  }
}
