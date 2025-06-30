import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileBox, ChevronRight, BarChart, Bot, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileBox className="size-8 text-primary" />
            <span className="text-xl font-bold">RFP CoPilot</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/docs">Docs</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#">Contact</Link>
            </Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild className="hidden sm:flex">
                <Link href="/login">
                Log In
                </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                Get Started
                <ChevronRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground">
              Win More RFPs, Faster.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              RFP CoPilot is your AI-powered assistant for crafting winning proposals.
              Automate summaries, draft answers, and ensure compliance with ease.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">
                  Start Your Free Trial
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">Book a Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-card p-2 rounded-xl border shadow-sm">
                    <Image
                        src="https://placehold.co/1200x675.png"
                        alt="RFP CoPilot Dashboard screenshot"
                        width={1200}
                        height={675}
                        className="rounded-lg"
                        data-ai-hint="dashboard analytics"
                    />
                </div>
            </div>
        </section>

        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Powerful Features to Streamline Your Workflow</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Everything you need to conquer your next RFP, from initial analysis to final submission.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Sparkles className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Summaries</h3>
                <p className="text-muted-foreground">Instantly digest long RFP documents and get to the core requirements in seconds.</p>
              </Card>
              <Card className="p-8 flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Bot className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Answer Generation</h3>
                <p className="text-muted-foreground">Draft high-quality, context-aware answers using your existing knowledge base.</p>
              </Card>
              <Card className="p-8 flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <BarChart className="size-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Compliance & Analytics</h3>
                <p className="text-muted-foreground">Automatically validate responses against standards and track your team's progress.</p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Revolutionize Your RFP Process?</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Stop wasting time on manual work and start winning more deals.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild>
                        <Link href="/login">
                            Get Started for Free
                            <ChevronRight className="ml-2 size-5" />
                        </Link>
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
