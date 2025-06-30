import { FileBox } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileBox className="size-8 text-primary" />
            <span className="text-xl font-bold">RFP CoPilot</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild><Link href="/#features">Features</Link></Button>
            <Button variant="ghost" asChild><Link href="/pricing">Pricing</Link></Button>
            <Button variant="ghost" asChild><Link href="/docs">Docs</Link></Button>
            <Button variant="ghost" asChild><Link href="#">Contact</Link></Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild className="hidden sm:flex"><Link href="/login">Log In</Link></Button>
            <Button asChild><Link href="/login">Get Started</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground">
              Documentation
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Everything you need to know to get the most out of RFP CoPilot.
            </p>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
            <h2>Introduction</h2>
            <p>
              Welcome to RFP CoPilot! Our platform is designed to revolutionize the way you respond to Request for Proposals (RFPs). By leveraging cutting-edge AI, we help you automate tedious tasks, improve the quality of your responses, and collaborate seamlessly with your team. This documentation will guide you through all the features and functionalities of the platform.
            </p>

            <hr />

            <h2>Getting Started</h2>
            <h3>1. Uploading Your First RFP</h3>
            <p>
              The first step is to ingest an RFP. You can do this in two ways from the main Dashboard:
            </p>
            <ul>
              <li><strong>Upload a Document:</strong> Click the "Upload Document" button to select a file from your computer. We support various formats including PDF, DOCX, XLSX, MD, and TXT.</li>
              <li><strong>Paste Text:</strong> Copy the content of your RFP and paste it directly into the text area provided.</li>
            </ul>
            <p>
              Once you upload or paste the content, click "Process RFP". Our AI will get to work analyzing the document.
            </p>

            <h3>2. Question Extraction</h3>
            <p>
              After processing, RFP CoPilot automatically extracts all the questions from the document and lists them in the "Extracted Questions" section. Each question is categorized (e.g., Security, Legal, Pricing) to help you organize your workflow.
            </p>

            <hr />

            <h2>Core Features</h2>

            <h3>Smart Answer Generation</h3>
            <p>For each extracted question, you can generate a draft answer based on the information stored in your Knowledge Base. Simply click the "Generate Answer" button on any question item. The AI will:</p>
            <ol>
              <li>Convert the question into a semantic vector.</li>
              <li>Search your Knowledge Base for the most relevant content chunks.</li>
              <li>Use the retrieved context to generate a high-quality, accurate answer.</li>
              <li>Cite the sources used and provide a confidence score.</li>
            </ol>
            
            <h3>Knowledge Base</h3>
            <p>The Knowledge Base is your centralized repository of company information. You can populate it by:</p>
            <ul>
              <li><strong>Uploading Files:</strong> Add your existing documentation, whitepapers, and security policies.</li>
              <li><strong>Connecting Sources:</strong> Integrate with sources like your public website, SharePoint, Google Drive, and more to keep your knowledge base automatically up-to-date.</li>
            </ul>
            <p>All content is chunked, embedded, and indexed for fast and accurate semantic search.</p>

            <h3>Collaboration Tools</h3>
            <ul>
              <li><strong>Assignments:</strong> Assign questions to specific team members to delegate work and track ownership.</li>
              <li><strong>Comments:</strong> Leave comments on any question to discuss answers, ask for clarifications, or provide feedback.</li>
              <li><strong>Status Tracking:</strong> Each question has a status (Unassigned, In Progress, Completed) so you can easily track the progress of your RFP response.</li>
            </ul>

            <h3>AI Expert Review</h3>
            <p>
              After generating or manually writing an answer, you can use the "AI Expert Review" feature. This simulates a subject matter expert reviewing the answer for accuracy, completeness, and clarity, providing suggestions for improvement.
            </p>

            <h3>Exporting Responses</h3>
            <p>
              Once all questions are answered, you can export the complete response. Click the "Export RFP" button to open the finalization dialog. Here you can:
            </p>
            <ul>
              <li>Tag the export with a version number.</li>
              <li>Complete a pre-export checklist.</li>
              <li>Gather acknowledgments from team members.</li>
              <li>Export the final document as a PDF or DOCX file.</li>
            </ul>

            <hr />

            <h2>Roles & Permissions</h2>
            <p>RFP CoPilot has a granular Role-Based Access Control (RBAC) system to ensure your team members have the appropriate level of access.</p>
            <ul>
              <li><strong>Owner:</strong> Full access to all features, including billing and workspace settings. Can manage all users.</li>
              <li><strong>Admin:</strong> Can manage team members, integrations, and security settings. Has full content editing rights.</li>
              <li><strong>Approver:</strong> Can review and edit content, and is responsible for final approvals before export.</li>
              <li><strong>Editor:</strong> The primary role for working on RFPs. Can edit questions, generate answers, and manage knowledge base content.</li>
              <li><strong>Viewer:</strong> Read-only access to all content. Cannot make any changes.</li>
            </ul>
            <p>You can manage team members and their roles in the <strong>Settings &gt; Team Members</strong> section.</p>

            <hr />
            
            <h2>Integrations</h2>
            <p>Connect RFP CoPilot to your existing tools to create a single source of truth. Navigate to <strong>Knowledge Base &gt; Content Sources</strong> to manage your integrations.</p>
            <ul>
              <li><strong>File Storage:</strong> Google Drive, SharePoint, Dropbox.</li>
              <li><strong>Knowledge Management:</strong> Confluence, Notion.</li>
              <li><strong>Code & Docs:</strong> GitHub.</li>
              <li><strong>Public Websites:</strong> Crawl any public URL.</li>
            </ul>

            <hr />

            <h2>Frequently Asked Questions (FAQ)</h2>
            <Card className="not-prose">
              <CardHeader><CardTitle>How is my data kept secure?</CardTitle></CardHeader>
              <CardContent>
                <p>Security is our top priority. All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). Your knowledge base is stored in a dedicated, isolated index to ensure no data is shared between tenants.</p>
              </CardContent>
            </Card>
            <Card className="not-prose mt-4">
              <CardHeader><CardTitle>Can I customize the AI's tone?</CardTitle></CardHeader>
              <CardContent>
                <p>Yes! Admins can set a default AI tone (Formal, Consultative, or Technical) in the <strong>Settings &gt; Workspace</strong> section to ensure all generated content matches your company's voice.</p>
              </CardContent>
            </Card>
             <Card className="not-prose mt-4">
              <CardHeader><CardTitle>What happens if the AI can't find an answer?</CardTitle></CardHeader>
              <CardContent>
                <p>If the AI cannot find relevant information in your knowledge base, it will inform you that an answer cannot be provided. This prevents hallucinations and ensures accuracy. You can then add the relevant information to your knowledge base and try again.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <footer className="border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <FileBox className="size-6 text-muted-foreground" />
                <span className="text-muted-foreground font-semibold">RFP CoPilot</span>
            </div>
            <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} RFP CoPilot. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  )
}
