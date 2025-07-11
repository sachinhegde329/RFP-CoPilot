
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// The handleAuth function correctly handles all Auth0 routes like login, logout, callback, and me.
// By exporting this directly, we ensure that the Auth0 SDK manages the request/response lifecycle
// as intended, which is more robust for production environments.

export const GET = handleAuth({
    login: handleLogin({
      // The returnTo parameter specifies where the user should be redirected after a successful login.
      // We direct them to /dashboard, which will then route them to their specific workspace.
      returnTo: '/dashboard',
    }),
    signup: handleLogin({
      // This tells Auth0 to show the sign-up page of the Universal Login.
      authorizationParams: {
        screen_hint: 'signup',
      },
      returnTo: '/dashboard',
    }),
});
