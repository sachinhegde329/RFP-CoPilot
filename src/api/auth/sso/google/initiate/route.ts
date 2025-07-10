
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_APP_URL) {
        console.error("Google Auth environment variables are not set for SSO.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64');
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/google/callback`);
    googleAuthUrl.searchParams.set('response_type', 'code');
    // For SSO, we need the `hd` parameter to suggest the domain
    // A real implementation would fetch this from the tenant settings.
    // googleAuthUrl.searchParams.set('hd', tenantDomain);
    googleAuthUrl.searchParams.set('scope', 'openid profile email');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    googleAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(googleAuthUrl);
}

    