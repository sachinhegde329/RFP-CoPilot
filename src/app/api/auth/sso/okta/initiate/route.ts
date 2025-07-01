
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!process.env.OKTA_CLIENT_ID || !process.env.OKTA_DOMAIN || !process.env.NEXT_PUBLIC_APP_URL) {
        console.error("Okta Auth environment variables are not set.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // The state will be used to identify the tenant upon callback
    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
    
    const oktaAuthUrl = new URL(`https://${process.env.OKTA_DOMAIN}/oauth2/v1/authorize`);
    oktaAuthUrl.searchParams.set('client_id', process.env.OKTA_CLIENT_ID!);
    // The callback URI needs to point to our new SSO callback route
    oktaAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/okta/callback`);
    oktaAuthUrl.searchParams.set('response_type', 'code');
    // Scopes for user sign-in
    oktaAuthUrl.searchParams.set('scope', 'openid profile email');
    oktaAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(oktaAuthUrl);
}
