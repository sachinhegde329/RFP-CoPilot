# 🔐 Auth0 Setup Guide for RFP CoPilot

## Prerequisites
- Auth0 account (free tier available)
- Your RFP CoPilot application running locally

## Step 1: Create Auth0 Account

1. Go to [Auth0.com](https://auth0.com/)
2. Click "Get Started Free"
3. Sign up for a free account
4. Verify your email address

## Step 2: Create Auth0 Application

1. In your Auth0 dashboard, click **"Applications"** in the left sidebar
2. Click **"Create Application"**
3. Enter the following details:
   - **Name**: `RFP CoPilot`
   - **Application Type**: Select **"Regular Web Application"**
4. Click **"Create"**

## Step 3: Configure Application Settings

1. In your new application, go to the **"Settings"** tab
2. Configure the following URLs:

### Allowed Callback URLs
```
http://localhost:3000/api/auth/callback
http://localhost:3000/dashboard
```

### Allowed Logout URLs
```
http://localhost:3000
http://localhost:3000/api/auth/logout
```

### Allowed Web Origins
```
http://localhost:3000
```

3. Scroll down and click **"Save Changes"**

## Step 4: Get Your Credentials

1. In the **"Settings"** tab, copy these values:
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID**
   - **Client Secret**

## Step 5: Update Environment Variables

1. Open your `.env` file in the project root
2. Update the following values with your Auth0 credentials:

```env
# Replace these placeholder values with your actual Auth0 credentials
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id-here
AUTH0_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id-here
```

**Note**: The `AUTH0_SECRET` has already been generated for you.

## Step 6: Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Visit your application at `http://localhost:3000`

3. Try to access a protected route (like `/megacorp/rfps`)

4. You should be redirected to Auth0 for authentication

## Step 7: Configure User Roles (Optional)

1. In your Auth0 dashboard, go to **"User Management"** → **"Roles"**
2. Create roles for your application:
   - `Owner`
   - `Admin`
   - `Editor`
   - `Viewer`

3. Go to **"User Management"** → **"Users"**
4. Create a test user or assign roles to existing users

## Step 8: Customize Login Experience (Optional)

1. In your Auth0 dashboard, go to **"Branding"**
2. Upload your logo and customize colors
3. Go to **"Universal Login"** to customize the login page

## Troubleshooting

### Common Issues

1. **"Invalid redirect_uri" error**
   - Make sure your callback URLs are exactly correct
   - Check for trailing slashes

2. **"Invalid client" error**
   - Verify your Client ID and Client Secret
   - Make sure you copied the values correctly

3. **"secret is required" error**
   - Ensure `AUTH0_SECRET` is set in your `.env` file
   - Restart your development server after updating

4. **CORS errors**
   - Verify your Allowed Web Origins include `http://localhost:3000`
   - Check that your application is running on the correct port

### Debug Mode

To enable debug logging, add this to your `.env` file:
```env
DEBUG=auth0:*
```

## Production Deployment

When deploying to production:

1. Update your Auth0 application URLs:
   - Replace `localhost:3000` with your production domain
   - Add HTTPS URLs

2. Update your `.env` file:
   ```env
   AUTH0_BASE_URL=https://your-domain.com
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NODE_ENV=production
   SECURE_COOKIES=true
   ```

3. Set up proper environment variables in your hosting platform

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Use strong, unique secrets** for each environment
3. **Enable MFA** for your Auth0 account
4. **Regularly rotate your Client Secret**
5. **Monitor Auth0 logs** for suspicious activity

## Support

If you encounter issues:

1. Check the [Auth0 documentation](https://auth0.com/docs)
2. Review the [Next.js Auth0 SDK docs](https://auth0.com/docs/quickstart/webapp/nextjs)
3. Check the Auth0 community forums

---

**Your Auth0 setup is now complete!** 🎉

You can now use authentication in your RFP CoPilot application. 