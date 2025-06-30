import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import type { TeamMember, Tenant } from "@/lib/tenants"

type Question = {
  id: number
  question: string
  category: string
  answer: string
  compliance: "passed" | "failed" | "pending"
  assignee?: TeamMember | null
  status: 'Unassigned' | 'In Progress' | 'Completed'
}

// Sample data is now generated on the server
const sampleSummary = "This is a sample RFP for a comprehensive enterprise software solution. Key areas of focus include data security, service level agreements (SLAs), pricing models, and integration capabilities with existing platforms like Salesforce. The proposal is due by the end of the month."

const getSampleQuestions = (tenant: Tenant): Question[] => [
    {
      id: 1,
      question: "What is your data retention policy, and how do you ensure customer data is securely deleted upon request?",
      answer: "Our data retention policy adheres to industry best practices, retaining customer data for the duration of the contract plus an additional 90 days for recovery purposes. Upon a verified request, data is securely deleted from all active and backup systems using a 3-pass overwrite method to ensure it is irrecoverable.",
      category: "Security",
      compliance: "pending",
      assignee: tenant.members.find((m: any) => m.role === 'Admin') || null,
      status: 'In Progress'
    },
    {
      id: 2,
      question: "Can you describe your Service Level Agreement (SLA) for production uptime and provide details on support tiers?",
      answer: "Our standard SLA guarantees 99.9% uptime for our production environment, excluding scheduled maintenance. We offer two support tiers: Standard (9-5 business hours, email support) and Premium (24/7 phone and email support with a 1-hour response time guarantee for critical issues).",
      category: "Legal",
      compliance: "pending",
      assignee: tenant.members.find((m: any) => m.role === 'Owner') || null,
      status: 'In Progress'
    },
    {
      id: 3,
      question: "Please outline your pricing structure, including any volume discounts or multi-year contract options.",
      answer: "",
      category: "Pricing",
      compliance: "pending",
      assignee: null,
      status: 'Unassigned'
    },
    {
      id: 4,
      question: "How does your solution integrate with third-party CRM platforms like Salesforce?",
      answer: "Our solution provides a native, bi-directional integration with Salesforce via a managed package available on the AppExchange. This integration syncs custom objects, standard objects, and allows for seamless data flow between the two platforms without the need for middleware.",
      category: "Product",
      compliance: "pending",
      assignee: tenant.members.find((m: any) => m.role === 'Editor') || null,
      status: 'Completed'
    }
  ];

export default function DashboardPage({ params }: { params: { tenant: string }}) {
  const tenant = getTenantBySubdomain(params.tenant);
  if (!tenant) {
      notFound();
  }
  
  const sampleQuestions = getSampleQuestions(tenant);

  return (
    <SidebarInset className="flex-1">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <DashboardClient 
          initialSummary={sampleSummary}
          initialQuestions={sampleQuestions}
        />
      </main>
    </SidebarInset>
  )
}
