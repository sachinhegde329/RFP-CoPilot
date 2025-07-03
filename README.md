# RFP CoPilot

This is a Next.js starter project for RFP CoPilot, an AI-powered assistant for responding to Request for Proposals.

To get started, review the testing guide below and then explore the application's features.

## Testing Your Application

You can test the application in two primary ways: through the instant "Live Demo" or by creating your own account to experience the new user flow.

### 1. Live Demo (Recommended First Step)

The live demo provides a pre-configured workspace with sample data, allowing you to immediately explore the core features.

**How to Access:**
1.  From the login or sign-up page, click the **"Live Demo"** button.
2.  You will be taken directly to the `megacorp` workspace.

**What to Test:**
*   **Process an RFP:** On the main dashboard, paste some sample text into the text area and click **"Process RFP"**. A new RFP will be created and selected.
*   **Generate AI Answers:**
    *   In the "Extracted Questions" list, find a question and expand it.
    *   Click **"Generate Answer"**. The AI will use the pre-populated Knowledge Base to create a draft answer.
*   **AI Expert Review:** After generating an answer, click **"AI Expert Review"** to get AI-powered feedback.
*   **Collaboration:**
    *   Assign a question to a user by clicking the assignee icon.
    *   Mark a question as "Completed" using the status icon.
*   **Export a Response:** Click the **"Export RFP"** button to open the finalization dialog and download the response as a PDF or DOCX file.
*   **Explore Other Features:**
    *   Navigate to the **Knowledge Base** to see the pre-configured content sources.
    *   Go to the **Templates** page to view and configure export templates.
    *   Check the **Settings** area to see how different workspace settings are managed.


### 2. Creating a New Account

This path lets you experience the application as a new user, starting with a blank slate.

**How to Start:**
1.  From the home page, click **"Sign Up"**.
2.  Create an account using either email/password or Google SSO.
3.  You will be redirected to your own new, empty workspace.

**What to Test:**
*   **Populate the Knowledge Base:**
    *   Navigate to the **Knowledge Base** page.
    *   Click **"Upload Files"** to add a sample document (e.g., a PDF or Word document with some text). Alternatively, click **"Connect Source"** to crawl a public website.
    *   Wait for the source status to change to **"Synced"**. This indicates the content has been indexed.
*   **Process Your First RFP:**
    *   Return to the **Home** page.
    *   Paste the content of an RFP (or any text with questions) into the text area and click **"Process RFP"**.
*   **Test Knowledge-Grounded Answers:**
    *   Expand one of the newly extracted questions and click **"Generate Answer"**.
    *   Observe how the AI uses the information from the document you just uploaded, citing it as a source.
*   **Explore Your Workspace:**
    *   Navigate to the **Settings** pages to configure your workspace name, invite team members, and see how a new environment is managed.

## Deploying to Vercel

This Next.js application is configured to deploy seamlessly to Vercel.

### 1. Push to a Git Repository
Deploying to Vercel starts with a Git repository. Push your code to a provider like GitHub, GitLab, or Bitbucket.

### 2. Create a Vercel Project
1.  Go to your Vercel dashboard and click **"Add New... > Project"**.
2.  Import the Git repository you just created.
3.  Vercel will automatically detect that you're using Next.js and configure the build settings.

### 3. Configure Environment Variables
This is the most important step. Your application relies on several services, which are configured using environment variables.
1.  In your new Vercel project, go to the **Settings** tab and click on **Environment Variables**.
2.  Copy all the variables from your local `.env` file and add them to your Vercel project.
    *   **`GEMINI_API_KEY`**: Your API key for Google AI services.
    *   **`FIREBASE_CONFIG`**: The full JSON configuration object for your Firebase project.
    *   **`STRIPE_SECRET_KEY`** & **`STRIPE_WEBHOOK_SECRET`**: Your Stripe API keys.
    *   **`NEXT_PUBLIC_ROOT_DOMAIN`**: The root domain of your application (e.g., `rfpcopilot.com`). This is crucial for subdomain routing to work correctly.
    *   Any other OAuth or service keys you are using (e.g., `GOOGLE_CLIENT_ID`, `DROPBOX_APP_SECRET`).

### 4. Update Redirect URIs and Webhooks
After your first deployment, Vercel will assign you a production URL (e.g., `your-project.vercel.app`). You must update the settings in your third-party services to use this new URL:
*   **Firebase Authentication**: In your Firebase project settings, add the new Vercel domain to the list of authorized domains.
*   **OAuth Providers (Google, Microsoft, etc.)**: In each provider's developer console, add the new OAuth callback URLs (e.g., `https://your-project.vercel.app/api/auth/google/callback`) to the list of authorized redirect URIs.
*   **Stripe**: In your Stripe dashboard, update the webhook endpoint to point to `https://your-project.vercel.app/api/webhooks/stripe`.

### 5. Deploy
With your environment variables set, trigger a new deployment from your Vercel project dashboard. Vercel will build and deploy your application.
