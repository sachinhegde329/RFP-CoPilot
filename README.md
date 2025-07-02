# RFP CoPilot

This is a Next.js starter project for RFP CoPilot, an AI-powered assistant for responding to Request for Proposals.

To get started, review the testing guide below and then explore the application's features.

## Testing Your Application

You can test the application in two primary ways: through the instant "Live Demo" or by creating your own account to experience the new user flow.

### 1. Live Demo (Recommended First Step)

The live demo provides a pre-configured workspace with sample data, allowing you to immediately explore the core features.

**How to Access:**
1.  From the login or sign-up page, click the **"Live Demo"** button.
2.  You will be taken directly to the `megacorp` workspace dashboard.

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
