
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBox, ChevronRight, UploadCloud, BrainCircuit, Users, FileDown, FileText, Bot, ShieldCheck, DatabaseZap, LockKeyhole, Shield, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const faqItems = [
  {
    question: "What file types do you support?",
    answer: "RFP CoPilot supports a wide range of file types, including PDF, DOCX, XLSX, TXT, MD, and HTML. You can either upload a file directly or paste the content into the text area."
  },
  {
    question: "Can I use my own answer templates?",
    answer: "Yes! On our Team plan and higher, you can create, customize, and save your own export templates. This allows you to generate branded, consistently formatted RFP responses in Word (DOCX) or PDF format."
  },
  {
    question: "How is my data secured?",
    answer: "Security is our top priority. All your data, including your knowledge base content and RFP answers, is encrypted at rest using AES-256 and in transit via TLS 1.2+. Each tenant's data is logically isolated in our database to ensure strict privacy and security."
  }
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
            <Button asChild><Link href="/signup">Try Free</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                  🚀 Win More Deals, Effortlessly
                </h1>
                <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                  Your AI-powered assistant to manage, answer, and export RFPs in minutes — not days.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                  <Button size="lg" asChild><Link href="/signup">Try Free</Link></Button>
                  <Button size="lg" variant="outline" asChild><Link href="#">Book Demo</Link></Button>
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
        
        {/* 2. Trusted By / Security Callout */}
        <section className="py-12 text-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-widest uppercase">Secure. Compliant. Enterprise-Ready.</h2>
            </div>
        </section>

        {/* 3. Key Benefits */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-4">
                <FileText className="size-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload & Parse RFPs Instantly</h3>
                <p className="text-muted-foreground">Upload PDFs, DOCs, XLSX and break down complex RFPs automatically.</p>
              </div>
              <div className="text-center p-4">
                <Bot className="size-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Auto-Generate Answers with AI</h3>
                <p className="text-muted-foreground">Pull context from your knowledge base to generate precise, on-brand responses.</p>
              </div>
              <div className="text-center p-4">
                <UploadCloud className="size-10 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Export with Your Templates</h3>
                <p className="text-muted-foreground">Map answers to pre-approved formats and generate branded Word/PDF exports.</p>
              </div>
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
                        <p className="text-muted-foreground text-sm">Our AI extracts questions and drafts answers from your knowledge base.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">3</div>
                        <h3 className="font-semibold mb-2">Collaborate with Team</h3>
                        <p className="text-muted-foreground text-sm">Assign questions, leave comments, and track progress together.</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary font-bold text-2xl mb-4">4</div>
                        <h3 className="font-semibold mb-2">Export & Submit</h3>
                        <p className="text-muted-foreground text-sm">Generate a polished, branded document in one click.</p>
                    </div>
                </div>
                <div className="text-center mt-12">
                    <Button size="lg" asChild><Link href="/signup">Try it free</Link></Button>
                </div>
            </div>
        </section>

        {/* 5. Use Cases */}
        <section id="use-cases" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Built for Every Role on Your Team</h2>
              </div>
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="sales">📈 Sales Teams</TabsTrigger>
                    <TabsTrigger value="consultants">🧑‍💼 Solution Consultants</TabsTrigger>
                    <TabsTrigger value="smes">🧑‍🔧 SMEs / Engineers</TabsTrigger>
                    <TabsTrigger value="solo">🧍‍♂️ Solo Sellers</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="mt-8">
                    <Card><CardContent className="p-6">Save 10+ hours per RFP, respond to more opportunities, and close deals faster by automating the repetitive parts of your workflow.</CardContent></Card>
                </TabsContent>
                <TabsContent value="consultants" className="mt-8">
                    <Card><CardContent className="p-6">Ensure technical accuracy and consistency by auto-filling answers directly from your official documentation and knowledge base.</CardContent></Card>
                </TabsContent>
                <TabsContent value="smes" className="mt-8">
                    <Card><CardContent className="p-6">Stop answering the same questions over and over. Contribute your knowledge once, and let the AI handle the rest, freeing you up for deep work.</CardContent></Card>
                </TabsContent>
                 <TabsContent value="solo" className="mt-8">
                    <Card><CardContent className="p-6">Punch above your weight. Compete with larger teams by leveraging AI to create high-quality proposals without the overhead.</CardContent></Card>
                </TabsContent>
              </Tabs>
          </div>
        </section>

        {/* 6. Testimonials */}
        <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Don't Just Take Our Word For It</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Card className="p-6">
                        <CardContent className="p-0">
                            <p className="text-muted-foreground mb-4">"RFP CoPilot has been a game-changer. We've cut our response time in half and the quality of our proposals has never been better."</p>
                            <div className="flex items-center gap-3">
                                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/>
                                <div>
                                    <p className="font-semibold">Sarah L., Sales Director</p>
                                    <p className="text-sm text-muted-foreground">Innovate Corp</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="p-6">
                        <CardContent className="p-0">
                            <p className="text-muted-foreground mb-4">"As a solutions architect, I used to spend hours digging for technical answers. Now, I just sync our docs and the AI finds everything instantly."</p>
                             <div className="flex items-center gap-3">
                                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/>
                                <div>
                                    <p className="font-semibold">Mike T., Solutions Architect</p>
                                    <p className="text-sm text-muted-foreground">TechGenius</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="p-6">
                        <CardContent className="p-0">
                            <p className="text-muted-foreground mb-4">"The collaboration features are fantastic. We can assign questions and see the status of the entire RFP at a glance. No more spreadsheet chaos."</p>
                            <div className="flex items-center gap-3">
                                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/>
                                <div>
                                    <p className="font-semibold">Emily R., Proposal Manager</p>
                                    <p className="text-sm text-muted-foreground">Quantum Solutions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </section>

        {/* 7. Pricing Preview */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Simple, Transparent Pricing</h2>
              <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">Choose the plan that's right for your team. Start free, upgrade anytime.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <Card className="text-center p-8"><CardHeader className="p-0"><CardTitle>Free</CardTitle></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">$0</p><p>For Individuals</p></CardContent></Card>
                <Card className="text-center p-8 border-primary"><CardHeader className="p-0"><CardTitle>Pro</CardTitle></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">$49</p><p>/user/mo</p><p>For Small Teams</p></CardContent></Card>
                <Card className="text-center p-8"><CardHeader className="p-0"><CardTitle>Enterprise</CardTitle></CardHeader><CardContent className="p-0 my-4"><p className="text-4xl font-bold">Custom</p><p>For Larger Orgs</p></CardContent></Card>
            </div>
            <div className="text-center mt-8">
                <Button asChild size="lg">
                    <Link href="/pricing">View Full Pricing</Link>
                </Button>
            </div>
          </div>
        </section>

        {/* 8. Security & Compliance */}
        <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <h2 className="text-3xl md:text-4xl font-bold">Security You Can Trust</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="flex flex-col items-center gap-2"><ShieldCheck className="size-8 text-primary"/> <span className="font-semibold">SOC 2 Ready</span></div>
                    <div className="flex flex-col items-center gap-2"><Shield className="size-8 text-primary"/> <span className="font-semibold">GDPR Compliant</span></div>
                    <div className="flex flex-col items-center gap-2"><LockKeyhole className="size-8 text-primary"/> <span className="font-semibold">SSO + RBAC</span></div>
                    <div className="flex flex-col items-center gap-2"><DatabaseZap className="size-8 text-primary"/> <span className="font-semibold">Data Encrypted</span></div>
                </div>
            </div>
        </section>

        {/* 9. FAQs */}
        <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index + 1}`}>
                        <AccordionTrigger className="text-lg">{item.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>

        {/* 10. Final CTA */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Start Answering RFPs Smarter Today
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
                <Link href="#" className="hover:text-foreground">Terms</Link>
                <Link href="#" className="hover:text-foreground">Privacy</Link>
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
