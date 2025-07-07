
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBox, Bot, DatabaseZap, Users, Blocks, ShieldCheck, Shield, BarChartHorizontalBig } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function FeatureSection({ 
    icon: Icon, 
    title, 
    description, 
    imageSrc, 
    imageAlt, 
    imageAiHint,
    features,
    reverse = false 
}: { 
    icon: React.ElementType, 
    title: string, 
    description: string, 
    imageSrc: string, 
    imageAlt: string, 
    imageAiHint: string,
    features: string[],
    reverse?: boolean 
}) {
    return (
        <div className={`grid md:grid-cols-2 gap-12 items-center ${reverse ? 'md:grid-flow-col-dense' : ''}`}>
            <div className={`space-y-4 ${reverse ? 'md:col-start-2' : ''}`}>
                <div className="inline-flex items-center gap-3 bg-muted p-3 rounded-lg">
                    <Icon className="size-8 text-primary" />
                    <h3 className="text-2xl font-bold">{title}</h3>
                </div>
                <p className="text-lg text-muted-foreground">{description}</p>
                <ul className="space-y-2">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <ShieldCheck className="size-5 text-primary flex-shrink-0 mt-1" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-card p-2 rounded-xl border shadow-sm">
                <Image
                    src={imageSrc}
                    alt={imageAlt}
                    width={1200}
                    height={900}
                    className="rounded-lg"
                    data-ai-hint={imageAiHint}
                />
            </div>
        </div>
    );
}


export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileBox className="size-8 text-primary" />
            <span className="text-xl font-bold">RFP CoPilot</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild><Link href="/features">Features</Link></Button>
            <Button variant="ghost" asChild><Link href="/pricing">Pricing</Link></Button>
            <Button variant="ghost" asChild><Link href="/docs">Docs</Link></Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild className="hidden sm:flex"><Link href="/login">Log In</Link></Button>
            <Button asChild><Link href="/signup">Start Free</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 text-center bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
              Powerful Features to <span className="text-primary">Revolutionize</span> Your Workflow
            </h1>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
              Discover how RFP CoPilot's intelligent tools can save you time, improve response quality, and help you win more deals by automating the most tedious parts of the proposal process.
            </p>
          </div>
        </section>

        {/* Features List */}
        <section className="py-20 md:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
                <FeatureSection
                    icon={Bot}
                    title="AI-Powered Answer Generation"
                    description="Leverage the power of generative AI to create accurate, context-aware answers in seconds. Our AI uses your internal documents to respond in your company's voice."
                    features={[
                        "Generates answers based on your private knowledge base.",
                        "Provides source citations for every answer to ensure accuracy.",
                        "Includes a confidence score to indicate answer quality.",
                        "Supports multiple languages, tones, and formats."
                    ]}
                    imageSrc="https://placehold.co/1200x900.png"
                    imageAlt="Screenshot of AI generating an answer for an RFP question."
                    imageAiHint="ai response"
                />

                <FeatureSection
                    icon={DatabaseZap}
                    title="Centralized Knowledge Base"
                    description="Build a single source of truth for all your company information. Connect to your existing content sources and let our AI automatically keep everything in sync."
                    features={[
                        "Upload documents like PDFs, DOCX, and XLSX files.",
                        "Crawl public websites to ingest marketing content.",
                        "Integrate with SharePoint, Google Drive, Confluence, and more.",
                        "Content is automatically chunked, embedded, and indexed for search."
                    ]}
                    imageSrc="https://placehold.co/1200x900.png"
                    imageAlt="Screenshot of the Knowledge Base management interface."
                    imageAiHint="knowledge management"
                    reverse={true}
                />
                
                 <FeatureSection
                    icon={Users}
                    title="Seamless Team Collaboration"
                    description="RFPs are a team sport. Our platform provides the tools you need to work together efficiently, assign tasks, and track progress from start to finish."
                    features={[
                        "Assign questions to subject matter experts on your team.",
                        "Track the status of each question (Unassigned, In Progress, Completed).",
                        "Role-Based Access Control (RBAC) ensures users only see what they need to.",
                        "Leave comments and have discussions directly on each question."
                    ]}
                    imageSrc="https://placehold.co/1200x900.png"
                    imageAlt="Screenshot of team members collaborating on an RFP."
                    imageAiHint="team collaboration"
                />

                <FeatureSection
                    icon={Blocks}
                    title="Customizable Export Templates"
                    description="Deliver polished, professional, and consistently branded proposals every time. Our template editor gives you full control over the look and feel of your final document."
                    features={[
                        "Create custom templates for DOCX and PDF exports.",
                        "Define the structure, order, and content of your response.",
                        "Automatically insert titles, headers, and Q&A sections.",
                        "Include dynamic placeholders like version numbers and dates."
                    ]}
                    imageSrc="https://placehold.co/1200x900.png"
                    imageAlt="Screenshot of the template editor interface."
                    imageAiHint="document templates"
                    reverse={true}
                />
            </div>
        </section>
        
        {/* Final CTA */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Automate Your RFP Process?
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              Sign up for a free trial today and experience the future of proposal management. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Start Your Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </section>
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
  );
}
