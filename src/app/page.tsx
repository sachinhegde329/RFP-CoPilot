
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBox, FileDown, FileText, Bot, Shield, Check, XCircle, Users, DatabaseZap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LandingPage() {
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
            <Button variant="ghost" asChild><Link href="#features">Features</Link></Button>
            <Button variant="ghost" asChild><Link href="#use-cases">Use Cases</Link></Button>
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
        {/* 1. Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
                  <span className="text-primary">Win More Deals.</span>
                  <br />
                  Automatically.
                </h1>
                <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                  AI-powered assistant to manage, answer, and export RFPs with your company’s voice — in minutes.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                  <Button size="lg" asChild><Link href="/signup">Start Free</Link></Button>
                  <Button size="lg" variant="outline" asChild><Link href="#">Book a Demo</Link></Button>
                </div>
              </div>
              <div className="bg-card p-2 rounded-xl border shadow-sm">
                <Image
                    src="https://placehold.co/1200x900.png"
                    alt="RFP CoPilot platform screenshot showing AI answer generation"
                    width={1200}
                    height={900}
                    className="rounded-lg"
                    data-ai-hint="dashboard analytics"
                    priority
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* 2. Trusted By Section */}
        <section className="py-12 text-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Secure. Compliant. Enterprise-Ready.</h2>
                 <p className="mt-4 text-muted-foreground italic">"We answer 3x more RFPs with half the team." – Acme Corp</p>
            </div>
        </section>

        {/* 3. Problem/Solution Panel */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <Card className="p-8">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="flex items-center gap-2"><XCircle className="text-destructive"/> Before RFP CoPilot</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2 text-muted-foreground">
                        <p>Manually copy-pasting old answers</p>
                        <p>Formatting mess in Word documents</p>
                        <p>No collaboration or version control</p>
                        <p>Chasing SMEs and missing deadlines</p>
                    </CardContent>
                </Card>
                 <Card className="p-8 border-primary shadow-lg">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="flex items-center gap-2 text-primary"><Check className="text-primary"/> After RFP CoPilot</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-2 text-muted-foreground">
                        <p>AI-generated answers from your knowledge</p>
                        <p>Use your own branded templates</p>
                        <p>Collaborate with your team in real time</p>
                        <p>Export a polished document in one click</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>
        
        {/* 4. How It Works */}
        <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">A Simpler Path to Winning Proposals</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">1</div>
                        <h3 className="font-semibold mb-2">Upload RFP</h3>
                        <p className="text-muted-foreground text-sm">Drag-and-drop or paste your RFP content.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">2</div>
                        <h3 className="font-semibold mb-2">AI Parses & Suggests</h3>
                        <p className="text-muted-foreground text-sm">Our AI extracts questions and pre-fills answers from your knowledge base.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">3</div>
                        <h3 className="font-semibold mb-2">Collaborate with Team</h3>
                        <p className="text-muted-foreground text-sm">Assign questions, leave comments, and track progress together.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">4</div>
                        <h3 className="font-semibold mb-2">Export Branded Doc</h3>
                        <p className="text-muted-foreground text-sm">Generate a polished, branded document with your template.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 5. Feature Highlights */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Powerful Features for Winning Teams</h2>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card><CardContent className="p-6 flex flex-col items-center text-center gap-2"><FileText className="size-8 text-primary"/> <h3 className="font-semibold">Upload Any Format</h3><p className="text-sm text-muted-foreground">PDF, DOCX, XLSX, TXT. Just upload and let the AI do the work.</p></CardContent></Card>
                <Card><CardContent className="p-6 flex flex-col items-center text-center gap-2"><Bot className="size-8 text-primary"/> <h3 className="font-semibold">AI Answer Generator</h3><p className="text-sm text-muted-foreground">Get accurate, context-aware answers from your knowledge base.</p></CardContent></Card>
                <Card><CardContent className="p-6 flex flex-col items-center text-center gap-2"><FileDown className="size-8 text-primary"/> <h3 className="font-semibold">Company Template Mapping</h3><p className="text-sm text-muted-foreground">Export your answers into your own branded Word or PDF templates.</p></CardContent></Card>
                <Card><CardContent className="p-6 flex flex-col items-center text-center gap-2"><Users className="size-8 text-primary"/> <h3 className="font-semibold">Team Collaboration</h3><p className="text-sm text-muted-foreground">Assign questions, track status, and comment in real-time.</p></CardContent></Card>
                <Card><CardContent className="p-6 flex flex-col items-center text-center gap-2"><DatabaseZap className="size-8 text-primary"/> <h3 className="font-semibold">Source Integration</h3><p className="text-sm text-muted-foreground">Sync your knowledge from websites, SharePoint, Google Drive, and more.</p></CardContent></Card>
                <Card><CardContent className="p-6 flex flex-col items-center text-center gap-2"><Shield className="size-8 text-primary"/> <h3 className="font-semibold">Enterprise Security</h3><p className="text-sm text-muted-foreground">SOC 2 ready with SSO, RBAC, and full data encryption.</p></CardContent></Card>
            </div>
          </div>
        </section>

        {/* 6. Use Cases */}
        <section id="use-cases" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Built for Every Role on Your Team</h2>
              </div>
              <Tabs defaultValue="sales" className="w-full max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="sales">📈 Sales Professionals</TabsTrigger>
                    <TabsTrigger value="consultants">🧑‍💻 Presales Consultants</TabsTrigger>
                    <TabsTrigger value="enterprise">🏢 Enterprises & SMEs</TabsTrigger>
                    <TabsTrigger value="freelancers">🎯 Freelancers</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="mt-8"><Card><CardContent className="p-6">Save 10+ hours per RFP, respond to more opportunities, and close deals faster by automating the repetitive parts of your workflow.</CardContent></Card></TabsContent>
                <TabsContent value="consultants" className="mt-8"><Card><CardContent className="p-6">Ensure technical accuracy and consistency by auto-filling answers directly from your official documentation and knowledge base.</CardContent></Card></TabsContent>
                <TabsContent value="enterprise" className="mt-8"><Card><CardContent className="p-6">Standardize your response process across the entire organization with shared templates, a central knowledge base, and role-based access.</CardContent></Card></TabsContent>
                <TabsContent value="freelancers" className="mt-8"><Card><CardContent className="p-6">Punch above your weight. Compete with larger teams by leveraging AI to create high-quality proposals without the overhead.</CardContent></Card></TabsContent>
              </Tabs>
          </div>
        </section>

        {/* 7. Testimonials */}
        <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Don't Just Take Our Word For It</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Card className="p-6"><CardContent className="p-0"><p className="text-muted-foreground mb-4">"RFPs used to take us 3 days. Now it’s 3 hours. This tool is a must-have for any serious sales team."</p><div className="flex items-center gap-3"><Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/><p className="font-semibold">Ravi P., Head of Presales</p></div></CardContent></Card>
                    <Card className="p-6"><CardContent className="p-0"><p className="text-muted-foreground mb-4">"The ability to use our own templates is what sold us. We maintain our brand identity with the speed of AI."</p><div className="flex items-center gap-3"><Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/><p className="font-semibold">Sarah L., Proposal Manager</p></div></CardContent></Card>
                    <Card className="p-6"><CardContent className="p-0"><p className="text-muted-foreground mb-4">"As a solo consultant, this tool lets me compete with big firms. It's like having an entire proposal team in my pocket."</p><div className="flex items-center gap-3"><Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/><p className="font-semibold">Mike T., Independent Consultant</p></div></CardContent></Card>
                 </div>
            </div>
        </section>

        {/* 8. Pricing Preview */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">Choose the plan that's right for your team. Start free, upgrade anytime.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                <Card className="p-6"><CardHeader className="p-0"><CardTitle>Free</CardTitle><p className="text-sm text-muted-foreground">For Individuals</p></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">$0</p></CardContent></Card>
                <Card className="p-6"><CardHeader className="p-0"><CardTitle>Pro</CardTitle><p className="text-sm text-muted-foreground">For Freelancers/SMBs</p></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">$49</p><p className="text-sm text-muted-foreground">/user/mo</p></CardContent></Card>
                <Card className="p-6 border-primary"><CardHeader className="p-0"><CardTitle>Team</CardTitle><p className="text-sm text-muted-foreground">For Sales Teams</p></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">$199</p><p className="text-sm text-muted-foreground">/mo, 5 users</p></CardContent></Card>
                <Card className="p-6"><CardHeader className="p-0"><CardTitle>Enterprise</CardTitle><p className="text-sm text-muted-foreground">For Large Orgs</p></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">Custom</p></CardContent></Card>
            </div>
            <div className="text-center mt-8">
                <Button asChild size="lg">
                    <Link href="/pricing">Compare Plans</Link>
                </Button>
            </div>
          </div>
        </section>
        
        {/* 9. Security & Compliance */}
        <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <h2 className="text-3xl md:text-4xl font-bold">Security You Can Trust</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="flex flex-col items-center gap-2"><Check className="size-8 text-primary"/> <span className="font-semibold">SOC 2 Ready</span></div>
                    <div className="flex flex-col items-center gap-2"><Check className="size-8 text-primary"/> <span className="font-semibold">GDPR Compliant</span></div>
                    <div className="flex flex-col items-center gap-2"><Check className="size-8 text-primary"/> <span className="font-semibold">SSO & Role-based Access</span></div>
                    <div className="flex flex-col items-center gap-2"><Check className="size-8 text-primary"/> <span className="font-semibold">Data Encryption (AES-256)</span></div>
                </div>
            </div>
        </section>

        {/* 10. Final CTA */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Start Winning RFPs with Less Effort, More Confidence
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Try Free for 14 Days</Link>
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
             <div className="flex gap-4 text-muted-foreground text-sm">
                <Link href="#features" className="hover:text-foreground">Features</Link>
                <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
                <Link href="/docs" className="hover:text-foreground">Documentation</Link>
                <Link href="#" className="hover:text-foreground">Contact</Link>
            </div>
            <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} RFP CoPilot. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
