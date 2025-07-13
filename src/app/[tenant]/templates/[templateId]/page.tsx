
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
import { HomepageHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Save, FileText, FileJson, Blocks, AlertCircle, PlusCircle, Trash2, ArrowUp, ArrowDown, Type, FileType, Pilcrow, UnfoldVertical, MessageSquare, FileDiff } from "lucide-react"
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
    qa_list_by_category: MessageSquare,
    acknowledgments: UnfoldVertical,
    custom_text: Pilcrow,
    page_break: FileDiff,
};

function TemplateStructureEditor({ structure, setStructure, disabled }: { structure: TemplateSection[], setStructure: React.Dispatch<React.SetStateAction<TemplateSection[]>>, disabled: boolean }) {
    
    const handleAddSection = (type: TemplateSectionType) => {
        let content = '';
        if (type === 'title') content = 'New Title';
        if (type === 'header') content = 'New Header';
        if (type === 'custom_text') content = 'Your custom text here. You can use placeholders like {{version}}, {{tenantName}}, and {{currentDate}}.';
        if (type === 'qa_list_by_category') content = 'Product'; // Default category
        
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
    
    const renderSectionInput = (section: TemplateSection) => {
        switch(section.type) {
            case 'qa_list_by_category':
                return (
                    <div className="flex flex-col gap-1.5">
                         <Input
                            value={section.content}
                            onChange={(e) => handleUpdateContent(section.id, e.target.value)}
                            className="text-sm bg-background font-mono h-8"
                            disabled={disabled}
                            placeholder="e.g., Security"
                        />
                        <p className="text-xs text-muted-foreground pl-1">
                            Enter a question category name, or use '*' to include all remaining questions.
                        </p>
                    </div>
                );
            case 'custom_text':
                 return (
                    <Textarea
                        value={section.content}
                        onChange={(e) => handleUpdateContent(section.id, e.target.value)}
                        className="text-sm bg-background"
                        disabled={disabled}
                    />
                );
             case 'title':
             case 'header':
                return (
                    <Input
                        value={section.content}
                        onChange={(e) => handleUpdateContent(section.id, e.target.value)}
                        className="text-sm bg-background h-8"
                        disabled={disabled}
                    />
                )
            default:
                return <p className="text-sm text-muted-foreground pl-1">{section.content}</p>;
        }
    }


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
                                    {renderSectionInput(section)}
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
                        <DropdownMenuItem onSelect={() => handleAddSection('qa_list_by_category')}><MessageSquare className="mr-2"/>Q&A List (by Category)</DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem onSelect={() => handleAddSection('acknowledgments')}><UnfoldVertical className="mr-2"/>Acknowledgments</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAddSection('page_break')}><FileDiff className="mr-2"/>Page Break</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
    );
}

export default function ConfigureTemplatePage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ tenant: string; templateId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // State for template data and UI
  const [params, setParams] = useState<{ tenant: string; templateId: string } | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [structure, setStructure] = useState<TemplateSection[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const { tenant } = useTenant();
  const { toast } = useToast();

  // Load params and template data
  useEffect(() => {
    const loadData = async () => {
      try {
        // First load the route params
        const [resolvedParams] = await Promise.all([
          paramsPromise,
          searchParamsPromise || Promise.resolve({}),
        ]);
        setParams(resolvedParams);
        
        // Then load the template data
        const { tenant: tenantSubdomain, templateId } = resolvedParams;
        const result = await getTemplateAction(tenantSubdomain, templateId);
        
        if (result.error || !result.template) {
          toast({ variant: 'destructive', title: "Error", description: result.error || "Template not found." });
          router.push(`/${tenantSubdomain}/templates`);
          return;
        }
        
        setTemplate(result.template);
        form.reset({
          name: result.template.name,
          description: result.template.description,
        });
        setStructure(result.template.structure);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to load template data." });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [paramsPromise, searchParamsPromise, router, toast]);

  if (isLoading || !params) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { tenant: tenantSubdomain, templateId } = params;

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
      const result = await getTemplateAction(tenantSubdomain, templateId)
      if (result.error || !result.template) {
        toast({ variant: 'destructive', title: "Error", description: result.error || "Template not found." })
        router.push(`/${tenantSubdomain}/templates`)
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
  }, [tenantSubdomain, templateId, currentUser, router, toast, form])

  useEffect(() => {
    if (!template) return;
    const formIsDirty = form.formState.isDirty;
    const structureIsDirty = JSON.stringify(structure) !== JSON.stringify(template.structure);
    setIsDirty(formIsDirty || structureIsDirty);
  }, [formValues, structure, template, form.formState.isDirty]);

  const onSubmit = async (data: TemplateFormValues) => {
    if (!template) return
    
    const result = await updateTemplateAction(tenantSubdomain, template.id, { ...data, structure })

    if (result.error || !result.template) {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error })
    } else {
      toast({ title: 'Template Updated', description: 'Your changes have been saved.' })
      setTemplate(result.template)
      setStructure(result.template.structure);
      form.reset(data)
    }
  }

  if (isLoading) {
    return (
      <SidebarInset className="flex-1 flex flex-col">
        <HomepageHeader />
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
      <HomepageHeader />
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
