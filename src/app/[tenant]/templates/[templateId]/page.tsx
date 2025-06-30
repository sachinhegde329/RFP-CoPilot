
'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import type { Template, TemplateIcon } from "@/lib/template.service"
import { useTenant } from "@/components/providers/tenant-provider"
import { getTemplateAction, updateTemplateAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"
import { canPerformAction } from "@/lib/access-control"

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Save, FileText, FileJson, Blocks, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const templateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(200, "Description cannot exceed 200 characters."),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

const iconMap: Record<TemplateIcon, React.ElementType> = {
  FileText: FileText,
  FileJson: FileJson,
  Blocks: Blocks,
};

export default function ConfigureTemplatePage({ params }: { params: { tenant: string, templateId: string } }) {
  const router = useRouter()
  const { tenant } = useTenant()
  const { toast } = useToast()
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentUser = tenant.members[0]
  const canEdit = template ? canPerformAction(currentUser.role, 'editWorkspace') && template.type !== 'System' : false;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    mode: "onChange",
  })

  useEffect(() => {
    async function fetchTemplate() {
      setIsLoading(true)
      const result = await getTemplateAction(params.tenant, params.templateId, currentUser)
      if (result.error || !result.template) {
        toast({ variant: 'destructive', title: "Error", description: result.error || "Template not found." })
        router.push(`/${params.tenant}/templates`)
      } else {
        setTemplate(result.template)
        form.reset({
          name: result.template.name,
          description: result.template.description,
        })
      }
      setIsLoading(false)
    }
    fetchTemplate()
  }, [params.tenant, params.templateId, currentUser, router, toast, form])

  const onSubmit = async (data: TemplateFormValues) => {
    if (!template) return
    
    const result = await updateTemplateAction(params.tenant, template.id, data, currentUser)

    if (result.error || !result.template) {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error })
    } else {
      toast({ title: 'Template Updated', description: 'Your changes have been saved.' })
      setTemplate(result.template)
      form.reset(data, { keepIsDirty: false });
    }
  }

  if (isLoading) {
    return (
      <SidebarInset className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        </main>
      </SidebarInset>
    )
  }

  if (!template) {
    return null; // or some other error state
  }
  
  const Icon = iconMap[template.icon] || Blocks;

  return (
    <SidebarInset className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/${tenant.subdomain}/templates`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Card>
                             <CardHeader>
                                <CardTitle>Configure Template</CardTitle>
                                <CardDescription>Edit the name and description for your custom template.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {template.type === 'System' && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>System Template</AlertTitle>
                                        <AlertDescription>
                                            This is a system template and cannot be modified. You can <Button variant="link" className="p-0 h-auto" onClick={() => router.push(`/${tenant.subdomain}/templates`)}>duplicate it</Button> to create an editable copy.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <fieldset disabled={!canEdit} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Template Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Security Questionnaire" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="A brief description of what this template is for." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </fieldset>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={!canEdit || form.formState.isSubmitting || !form.formState.isDirty}>
                                    <Save className="mr-2" />
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto p-4 bg-muted rounded-full w-max mb-2">
                             <Icon className="size-10 text-muted-foreground" />
                        </div>
                        <CardTitle>{form.watch('name')}</CardTitle>
                        <CardDescription>Template Preview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-center text-muted-foreground p-4 border rounded-md">
                            The visual layout editor for templates is coming soon. For now, you can edit the template's name and description.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </SidebarInset>
  )
}
