
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Save, FileText, FileJson, Blocks, AlertCircle, Type, FileType, Pilcrow, MessageSquare, FileDiff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const templateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters").max(200, "Description cannot exceed 200 characters"),
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
    acknowledgments: MessageSquare, // Using MessageSquare as a fallback
    custom_text: Pilcrow,
    page_break: FileDiff,
};

type TemplateStructureEditorProps = {
    structure: TemplateSection[];
    setStructure: React.Dispatch<React.SetStateAction<TemplateSection[]>>;
    disabled: boolean;
};

const TemplateStructureEditor: React.FC<TemplateStructureEditorProps> = ({ 
    structure, 
    setStructure, 
    disabled 
}) => {
    
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
            case 'title':
            case 'header':
            case 'custom_text':
            case 'qa_list_by_category':
                return (
                    <Input
                        value={section.content}
                        onChange={(e) => handleUpdateContent(section.id, e.target.value)}
                        className="w-full"
                        disabled={disabled}
                    />
                );
            default:
                return <p className="text-sm text-muted-foreground">{section.content}</p>;
        }
    };

    return (
        <div className="space-y-4">
            {structure.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                                {section.type.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                        </div>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleDeleteSection(section.id)}
                                className="text-muted-foreground hover:text-destructive text-sm"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {renderSectionInput(section)}
                    </div>
                </div>
            ))}
            {!disabled && (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAddSection('custom_text')}
                    >
                        Add Section
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function ConfigureTemplatePage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ tenant: string; templateId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, setParams] = useState<{ tenant: string; templateId: string } | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [structure, setStructure] = useState<TemplateSection[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const { tenant } = useTenant();
  const { toast } = useToast();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    mode: "onChange",
  });
  
  const formValues = form.watch();
  const currentUser = tenant?.members?.[0];
  const canEdit = template ? canPerformAction(currentUser?.role || 'viewer', 'editWorkspace') && template.type !== 'System' : false;
  const tenantSubdomain = params?.tenant;
  const templateId = params?.templateId;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resolvedParams] = await Promise.all([
          paramsPromise,
          searchParamsPromise || Promise.resolve({}),
        ]);
        
        setParams(resolvedParams);
        
        const { tenant: tenantId, templateId } = resolvedParams;
        const result = await getTemplateAction(tenantId, templateId);
        
        if (result.error || !result.template) {
          toast({ variant: 'destructive', title: "Error", description: result.error || "Template not found." });
          router.push(`/${tenantId}/templates`);
          return;
        }
        
        setTemplate(result.template);
        form.reset({
          name: result.template.name,
          description: result.template.description || '',
        });
        setStructure([...result.template.structure]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to load template data." });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [paramsPromise, searchParamsPromise, router, toast, form]);

  useEffect(() => {
    if (!template) return;
    const formIsDirty = form.formState.isDirty;
    const structureIsDirty = JSON.stringify(structure) !== JSON.stringify(template.structure);
    setIsDirty(formIsDirty || structureIsDirty);
  }, [formValues, structure, template, form.formState.isDirty]);

  if (isLoading || !params) {
    return (
      <SidebarInset className="flex-1 flex flex-col">
        <HomepageHeader />
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </SidebarInset>
    );
  }

  if (!template) {
    return (
      <SidebarInset className="flex-1 flex flex-col">
        <HomepageHeader />
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-muted-foreground">Template not found</p>
          </div>
        </main>
      </SidebarInset>
    );
  }

  const onSubmit = async (data: TemplateFormValues) => {
    if (!template || !tenantSubdomain) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to update template: Missing tenant information.'
      });
      return;
    }

    try {
      const result = await updateTemplateAction(tenantSubdomain, template.id, { ...data, structure });
      
      if (result.error || !result.template) {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
      } else {
        toast({ title: 'Template updated successfully' });
        setTemplate(result.template);
        form.reset({
          name: result.template.name,
          description: result.template.description || '',
        });
        setStructure([...result.template.structure]);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An unexpected error occurred while updating the template.'
      });
    }
  };

  return (
    <SidebarInset className="flex-1 flex flex-col">
      <HomepageHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/${tenant?.subdomain}/templates`}>
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
                      This is a system template and cannot be modified. You can create a copy to make changes.
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
                          <Textarea 
                            placeholder="A brief description of what this template is for." 
                            {...field} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Structure</CardTitle>
                <CardDescription>Define the sections and their order in the template.</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateStructureEditor 
                  structure={structure} 
                  setStructure={setStructure} 
                  disabled={!canEdit} 
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!canEdit || form.formState.isSubmitting || !isDirty}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </SidebarInset>
  );
}
