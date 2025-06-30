
'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import type { Template, TemplateIcon, TemplateSection, TemplateSectionType } from "@/lib/template.service"
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
import { ChevronLeft, Save, FileText, FileJson, Blocks, AlertCircle, PlusCircle, Trash2, ArrowUp, ArrowDown, Type, FileType, Pilcrow, Indent, UnfoldVertical, MessageSquare, PageBreak } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

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

const sectionIconMap: Record<TemplateSectionType, React.ElementType> = {
    title: Type,
    header: FileType,
    qa_by_category: MessageSquare,
    acknowledgments: UnfoldVertical,
    custom_text: Pilcrow,
    page_break: PageBreak,
};

function TemplateStructureEditor({ structure, setStructure, disabled }: { structure: TemplateSection[], setStructure: React.Dispatch<React.SetStateAction<TemplateSection[]>>, disabled: boolean }) {
    
    const handleAddSection = (type: TemplateSectionType) => {
        let content = '';
        if (type === 'title') content = 'New Title';
        if (type === 'header') content = 'New Header';
        if (type === 'custom_text') content = 'Your custom text here. You can use placeholders like {{version}}, {{tenantName}}, and {{currentDate}}.';
        
        const newSection: TemplateSection = {
            id: `section-${Date.now()}`,
            type,
            content,
        };
        setStructure(prev => [...prev, newSection]);
    };

    const handleUpdateContent = (id: string, newContent: string) => {
        setStructure(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
    };

    const handleDeleteSection = (id: string) => {
        setStructure(prev => prev.filter(s => s.id !== id));
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const newStructure = [...structure];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newStructure.length) return;
        
        [newStructure[index], newStructure[newIndex]] = [newStructure[newIndex], newStructure[index]];
        setStructure(newStructure);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Template Structure</CardTitle>
                <CardDescription>Define the sections and layout of your exported document. Drag and drop to reorder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {structure.map((section, index) => {
                    const Icon = sectionIconMap[section.type] || Blocks;
                    const isMovableUp = index > 0;
                    const isMovableDown = index < structure.length - 1;

                    return (
                        <Card key={section.id} className="p-4 bg-muted/50">
                            <div className="flex items-start gap-4">
                               <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-semibold text-sm capitalize">{section.type.replace(/_/g, ' ')}</span>
                                    </div>
                                    {section.type !== 'qa_by_category' && section.type !== 'acknowledgments' && section.type !== 'page_break' ? (
                                        <Textarea
                                            value={section.content}
                                            onChange={(e) => handleUpdateContent(section.id, e.target.value)}
                                            className="text-sm bg-background"
                                            disabled={disabled}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground pl-1">{section.content}</p>
                                    )}
                               </div>
                               <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveSection(index, 'up')} disabled={!isMovableUp || disabled}><ArrowUp className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveSection(index, 'down')} disabled={!isMovableDown || disabled}><ArrowDown className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteSection(section.id)} disabled={disabled}><Trash2 className="h-4 w-4" /></Button>
                               </div>
                            </div>
                        </Card>
                    );
                })}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={disabled}><PlusCircle className="mr-2" />Add Section</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuItem onSelect={() => handleAddSection('title')}><Type className="mr-2"/>Title</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAddSection('header')}><FileType className="mr-2"/>Header</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAddSection('custom_text')}><Pilcrow className="mr-2"/>Custom Text Block</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAddSection('page_break')}><PageBreak className="mr-2"/>Page Break</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
    );
}


export default function ConfigureTemplatePage({ params }: { params: { tenant: string, templateId: string } }) {
  const router = useRouter()
  const { tenant } = useTenant()
  const { toast } = useToast()
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [structure, setStructure] = useState<TemplateSection[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const currentUser = tenant.members[0]
  const canEdit = template ? canPerformAction(currentUser.role, 'editWorkspace') && template.type !== 'System' : false;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    mode: "onChange",
  })
  
  const formValues = form.watch();

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
        setStructure(result.template.structure);
      }
      setIsLoading(false)
    }
    fetchTemplate()
  }, [params.tenant, params.templateId, currentUser, router, toast, form])

  useEffect(() => {
    if (!template) return;
    const formIsDirty = form.formState.isDirty;
    const structureIsDirty = JSON.stringify(structure) !== JSON.stringify(template.structure);
    setIsDirty(formIsDirty || structureIsDirty);
  }, [formValues, structure, template, form.formState.isDirty]);

  const onSubmit = async (data: TemplateFormValues) => {
    if (!template) return
    
    const result = await updateTemplateAction(params.tenant, template.id, { ...data, structure }, currentUser)

    if (result.error || !result.template) {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error })
    } else {
      toast({ title: 'Template Updated', description: 'Your changes have been saved.' })
      setTemplate(result.template)
      setStructure(result.template.structure);
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
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <Card>
                     <CardHeader>
                        <CardTitle>Configure Template</CardTitle>
                        <CardDescription>Edit the name, description, and structure for your template.</CardDescription>
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
                </Card>

                <TemplateStructureEditor structure={structure} setStructure={setStructure} disabled={!canEdit} />

                <div className="flex justify-end">
                    <Button type="submit" disabled={!canEdit || form.formState.isSubmitting || !isDirty}>
                        <Save className="mr-2" />
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
      </main>
    </SidebarInset>
  )
}

    