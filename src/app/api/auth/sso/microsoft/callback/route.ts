
import { type NextRequest, NextResponse } from 'next/server';
import { getTenantBySubdomain, updateTenant } from '@/lib/tenants';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Check if Supabase is properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set. Microsoft SSO functionality is disabled.');
    return new NextResponse(
      JSON.stringify({ error: 'SSO functionality is not properly configured' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
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
  
  const tenant = await getTenantBySubdomain(tenantId);
  const redirectUrl = new URL(`/${tenant?.subdomain || ''}/settings/security`, request.url);

  try {
    // In a real application, you would exchange the code for an access token here
    // and store the SSO configuration details (e.g., the external tenant ID from the token).
    // For this example, we will simulate success and update our tenant data.

    // A real implementation would look something like this:
    /*
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', { ... });
    const tokens = await tokenResponse.json();
    // Validate tokens, extract claims (like `tid` for Azure Tenant ID)
    */

    updateTenant(tenantId, { ssoProvider: 'microsoft' });

    redirectUrl.searchParams.set('sso_success', 'microsoft');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Microsoft SSO callback error:', error);
    redirectUrl.searchParams.set('sso_error', 'microsoft');
    return NextResponse.redirect(redirectUrl);
  }
}
