
import { SidebarInset } from "@/components/ui/sidebar"
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { getRfpInsightsAction } from "@/app/actions"
import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import { RfpInsightsDashboard } from "@/components/analytics/rfp-insights-dashboard"
import { FeatureRequestsDashboard } from "@/components/analytics/feature-requests-dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChartHorizontalBig, Lightbulb } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

type RfpInsightsResult = {
  insights?: typeof sampleInsights;
  error?: string;
};

// Comprehensive sample data for demonstration
const sampleInsights = {
  executiveSummary: "Your RFPs show strong interest in security and compliance features, with 78% of requests mentioning these requirements. The most common feature requests include advanced reporting, integration capabilities, and AI-powered analytics. Customer sentiment is generally positive, with particular interest in your platform's scalability and customization options.",
  
  // Recurring themes from RFPs
  recurringThemes: [
    {
      theme: "Security & Compliance",
      count: 42,
      examples: [
        "Require SOC 2 Type II and ISO 27001 compliance documentation",
        "Need end-to-end encryption for data in transit and at rest",
        "Must demonstrate GDPR and CCPA compliance procedures",
        "Looking for role-based access control (RBAC) implementation"
      ]
    },
    {
      theme: "Integration Capabilities",
      count: 37,
      examples: [
        "Must integrate with Salesforce and HubSpot CRM systems",
        "Looking for Jira and ServiceNow integration for ticketing",
        "Need REST API with OAuth 2.0 support for custom development",
        "Require single sign-on (SSO) with Okta and Azure AD"
      ]
    },
    {
      theme: "Reporting & Analytics",
      count: 29,
      examples: [
        "Need custom report builder with scheduling capabilities",
        "Looking for real-time dashboards with KPI tracking",
        "Require export to multiple formats (PDF, Excel, CSV)",
        "Need data visualization with drill-down capabilities"
      ]
    },
    {
      theme: "Scalability",
      count: 23,
      examples: [
        "Must handle 10,000+ concurrent users",
        "Looking for multi-region deployment options",
        "Need performance benchmarks under heavy load"
      ]
    },
    {
      theme: "Mobile Access",
      count: 18,
      examples: [
        "Require native iOS and Android applications",
        "Need offline mode functionality",
        "Looking for mobile-optimized responsive design"
      ]
    }
  ],
  
  // Identified feature gaps
  featureGaps: [
    {
      gap: "Advanced AI/ML Capabilities",
      examples: [
        "We need predictive analytics for customer behavior",
        "Looking for AI-powered recommendations engine",
        "Require natural language processing for text analysis"
      ]
    },
    {
      gap: "Industry-Specific Modules",
      examples: [
        "Healthcare compliance features for HIPAA requirements",
        "Financial services reporting for regulatory compliance",
        "Retail-specific inventory management capabilities"
      ]
    },
    {
      gap: "Enhanced Collaboration Tools",
      examples: [
        "Real-time co-editing of documents",
        "Built-in video conferencing integration",
        "Advanced commenting and annotation features"
      ]
    }
  ],
  
  // Competitive analysis
  competitiveMentions: [
    { competitor: "Competitor A", count: 28, sentiment: -0.15 },
    { competitor: "Competitor B", count: 19, sentiment: 0.05 },
    { competitor: "Competitor C", count: 14, sentiment: -0.08 },
    { competitor: "Competitor D", count: 9, sentiment: 0.12 },
    { competitor: "Competitor E", count: 6, sentiment: -0.22 }
  ],
  
  // Common objections and concerns
  commonObjections: [
    {
      objection: "Pricing & ROI",
      examples: [
        "Your solution is 20% more expensive than Competitor A",
        "Need clearer ROI calculation for executive approval",
        "Budget constraints for additional modules"
      ]
    },
    {
      objection: "Implementation & Onboarding",
      examples: [
        "Concerned about 3-month implementation timeline",
        "Need more details about data migration process",
        "Looking for more comprehensive training options"
      ]
    },
    {
      objection: "Customization Limitations",
      examples: [
        "Need more flexibility in workflow configuration",
        "Custom reporting requirements not fully addressed",
        "Integration with legacy systems needs clarification"
      ]
    }
  ],
  
  // Additional analytics data
  rfpTrends: [
    { month: 'Jan', count: 12, value: 1250000 },
    { month: 'Feb', count: 15, value: 1420000 },
    { month: 'Mar', count: 18, value: 1680000 },
    { month: 'Apr', count: 14, value: 1320000 },
    { month: 'May', count: 22, value: 1980000 },
    { month: 'Jun', count: 25, value: 2250000 }
  ],
  
  winRateAnalysis: {
    totalRfps: 85,
    won: 42,
    lost: 35,
    inProgress: 8,
    winRate: 0.49,
    averageDealSize: 125000,
    averageSalesCycle: 67
  },
  
  industryBreakdown: [
    { industry: 'Technology', percentage: 32, trend: 'up' },
    { industry: 'Healthcare', percentage: 24, trend: 'up' },
    { industry: 'Financial Services', percentage: 18, trend: 'down' },
    { industry: 'Retail', percentage: 14, trend: 'up' },
    { industry: 'Manufacturing', percentage: 12, trend: 'stable' }
  ]
};

// Loading skeleton for better UX
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await both params and searchParams in parallel
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams || Promise.resolve({}),
  ]);
  
  const { tenant: tenantSubdomain } = resolvedParams;
  const isMegacorpDemo = tenantSubdomain === 'megacorp';
  
  // Fetch tenant data and insights in parallel
  let insightsResult: RfpInsightsResult = { insights: undefined, error: undefined };
  const [tenant] = await Promise.all([
    getTenantBySubdomain(tenantSubdomain),
    (async () => {
      try {
        const result = isMegacorpDemo 
          ? { insights: sampleInsights }
          : await getRfpInsightsAction(tenantSubdomain);
        insightsResult = result as RfpInsightsResult;
      } catch (error) {
        console.error('Failed to load insights:', error);
        insightsResult = { 
          error: 'Failed to load analytics data. Please try again later.' 
        };
      }
    })()
  ]);

  if (!tenant) {
    notFound();
  }

  const showSampleNotice = isMegacorpDemo;
  const isLoading = !insightsResult.insights && !insightsResult.error;

  return (
    <SidebarInset className="flex-1 flex flex-col max-w-full overflow-hidden">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
        {showSampleNotice && (
          <Alert className="mb-6">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              You're viewing sample analytics data. Connect your own data to see real insights.
            </AlertDescription>
          </Alert>
        )}

        <Suspense fallback={<AnalyticsSkeleton />}>
          <Tabs defaultValue="rfp-insights" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rfp-insights" className="flex items-center gap-2">
                <BarChartHorizontalBig className="h-4 w-4" />
                <span>RFP Insights</span>
              </TabsTrigger>
              {isMegacorpDemo && (
                <TabsTrigger value="feature-requests" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>Feature Requests</span>
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="rfp-insights" className="space-y-4">
              {isLoading ? (
                <AnalyticsSkeleton />
              ) : insightsResult.error ? (
                <Alert variant="secondary">
                  <BarChartHorizontalBig className="h-4 w-4" />
                  <AlertTitle>Not Enough Data</AlertTitle>
                  <AlertDescription>
                    {insightsResult.error} Analytics will appear here once you have sufficient data.
                  </AlertDescription>
                </Alert>
              ) : (
                <RfpInsightsDashboard 
                  initialInsights={insightsResult.insights || sampleInsights} 
                />
              )}
            </TabsContent>

            {isMegacorpDemo && (
              <TabsContent value="feature-requests" className="space-y-4">
                <FeatureRequestsDashboard />
              </TabsContent>
            )}
          </Tabs>
        </Suspense>
      </main>
    </SidebarInset>
  );
}
