import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, FileBox } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and small teams trying out RFP CoPilot.",
    features: [
      "1 user",
      "3 RFPs/month",
      "Up to 25 questions/month",
      "Export with watermark",
      "Community support",
    ],
    buttonText: "Get Started for Free",
    buttonLink: "/login",
  },
  {
    name: "Starter",
    price: "$500",
    pricePeriod: "/ month",
    description: "For growing teams that need more power and collaboration.",
    features: [
      "5 users",
      "25 RFPs/month",
      "Team collaboration",
      "Answer reuse library",
      "Standard export templates",
    ],
    buttonText: "Choose Starter",
    buttonLink: "/login",
    popular: true,
  },
  {
    name: "Growth",
    price: "$1,250",
    pricePeriod: "/ month",
    description: "For established teams requiring analytics and integrations.",
    features: [
      "25 users",
      "100 RFPs/month",
      "Advanced analytics",
      "API access",
      "Salesforce & SharePoint integrations",
    ],
    buttonText: "Choose Growth",
    buttonLink: "/login",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations needing enterprise-grade security and support.",
    features: [
      "50+ users",
      "Unlimited RFPs",
      "Single Sign-On (SSO)",
      "Custom domains & branding",
      "Dedicated support & SLA",
    ],
    buttonText: "Contact Sales",
    buttonLink: "#",
  },
]

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileBox className="size-8 text-primary" />
            <span className="text-xl font-bold">RFP CoPilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/login">
                Log In
                </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                Get Started
              </Link>
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`flex flex-col h-full ${plan.popular ? "border-primary shadow-lg" : ""}`}
                >
                  <CardHeader className="flex-shrink-0">
                    {plan.popular && (
                      <div className="text-center">
                        <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-primary-foreground bg-primary rounded-full mb-2">
                          Most Popular
                        </div>
                      </div>
                    )}
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.pricePeriod && <span className="text-muted-foreground">{plan.pricePeriod}</span>}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="size-5 text-primary flex-shrink-0 mt-1" />
                          <span className="text-sm">{feature}</span>
                        </li>

                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex-shrink-0">
                    <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                      <Link href={plan.buttonLink}>{plan.buttonText}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8 text-sm">
                Annual pricing available. <Link href="#" className="underline text-primary">Contact us</Link> for details.
            </p>
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
  )
}
