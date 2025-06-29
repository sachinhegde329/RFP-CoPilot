import { type NextRequest, NextResponse } from 'next/server';

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

    // The state will be used to identify the tenant upon callback
    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
    
    const microsoftAuthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    microsoftAuthUrl.searchParams.set('client_id', process.env.MICROSOFT_CLIENT_ID!);
    // The callback URI needs to point to our new SSO callback route
    microsoftAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/microsoft/callback`);
    microsoftAuthUrl.searchParams.set('response_type', 'code');
    // Scopes for user sign-in
    microsoftAuthUrl.searchParams.set('scope', 'openid profile email User.Read');
    microsoftAuthUrl.searchParams.set('response_mode', 'query');
    microsoftAuthUrl.searchParams.set('state', state);
    // Add prompt=consent to ensure the admin of the external tenant can grant consent for the whole org
    microsoftAuthUrl.searchParams.set('prompt', 'consent');


    return NextResponse.redirect(microsoftAuthUrl);
}
