
"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, FileBox, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import { createCheckoutSessionAction } from "@/app/actions"
import { addOnsConfig } from "@/lib/tenant-types"
import { useUser } from '@auth0/nextjs-auth0/client';


const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
    : null;

const plans = [
  {
    name: "Free",
    id: "free",
    price: "$0",
    description: "For trying out the platform's core features.",
    features: [
      "1 User",
      "1 Active RFP",
      "10 AI Answers/month",
      "Basic Export Features",
      "Community Support",
    ],
    buttonText: "Get Started for Free",
  },
  {
    name: "Starter",
    id: "starter",
    price: "$29",
    pricePeriod: "/ month",
    description: "For individual sales reps and freelancers.",
    features: [
      "1 User",
      "5 Active RFPs",
      "100 AI Answers/month",
      "Basic Export Features",
      "Email Support",
    ],
    buttonText: "Choose Starter",
  },
  {
    name: "Team",
    id: "team",
    price: "$149",
    pricePeriod: "/ month",
    description: "For small teams that need to collaborate effectively.",
    features: [
      "Up to 5 Users",
      "25 Active RFPs",
      "500 AI Answers/month",
      "Team Collaboration Tools",
      "Custom Export Templates",
    ],
    buttonText: "Choose Team",
    popular: true,
  },
  {
    name: "Business",
    id: "business",
    price: "$749",
    pricePeriod: "/ month",
    description: "For growing teams needing advanced features and support.",
    features: [
      "Up to 25 Users",
      "Unlimited RFPs",
      "2,500 AI Answers/month",
      "Advanced Analytics & Reporting",
      "AI Expert Review",
      "Priority Support",
    ],
    buttonText: "Choose Business",
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: "Custom",
    description: "For large organizations needing full control and integrations.",
    features: [
      "50+ Users",
      "Unlimited RFPs",
      "Unlimited AI Answers",
      "Single Sign-On (SSO)",
      "Custom Integrations",
      "Dedicated Support & SLA",
    ],
    buttonText: "Contact Sales",
    buttonLink: "#",
  },
]

function PricingContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, isLoading: isUserLoading } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const tenantId = searchParams.get('tenant')

  const handleCheckout = async (planId: 'starter' | 'team' | 'business', planName: string) => {
    if (!tenantId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to select a plan.",
        variant: "destructive",
      });
      return;
    }

    if (!stripePromise) {
        toast({
            title: "Configuration Error",
            description: "Stripe is not configured correctly. Please provide a publishable key.",
            variant: "destructive",
        });
        return;
    }

    setLoadingPlan(planName);

    const result = await createCheckoutSessionAction(planId, tenantId);

    if (result.error || !result.sessionId) {
      toast({
        title: "Error Creating Checkout",
        description: result.error || "Could not initiate checkout.",
        variant: "destructive",
      });
      setLoadingPlan(null);
      return;
    }

    const stripe = await stripePromise;
    if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
        if (error) {
            toast({
                title: "Checkout Error",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    }
    
    setLoadingPlan(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileBox className="size-8 text-primary" />
            <span className="text-xl font-bold">RFP CoPilot</span>
          </Link>
          <div className="flex items-center gap-4">
             <Button asChild><Link href="/megacorp">Get Started</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground">
              Find the perfect plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Start for free, then upgrade as you grow. All plans include our core AI features.
            </p>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`flex flex-col h-full ${plan.popular ? "border-primary shadow-lg" : ""}`}
                >
                  <CardHeader className="flex-shrink-0">
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.pricePeriod && (
                        <span className="text-muted-foreground">{plan.pricePeriod}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {plan.buttonLink ? (
                      <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                        <Link href={plan.buttonLink}>{plan.buttonText}</Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleCheckout(plan.id as 'starter' | 'team' | 'business', plan.name)}
                        disabled={loadingPlan === plan.name || !tenantId}
                      >
                        {loadingPlan === plan.name ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          plan.buttonText
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
