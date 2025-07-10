
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTenant } from "@/components/providers/tenant-provider"
import { createTemplateAction, duplicateTemplateAction, deleteTemplateAction } from "@/app/actions"
import type { Template, TemplateIcon } from "@/lib/template.service"
import { canPerformAction } from "@/lib/access-control"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Blocks, PlusCircle, FileText, FileJson, Copy, MoreHorizontal, Settings, Trash2, Loader2 } from "lucide-react"

const iconMap: Record<TemplateIcon, React.ElementType> = {
  FileText: FileText,
  FileJson: FileJson,
  Blocks: Blocks,
};

function TemplateCardComponent({ template, onDuplicate, onDelete, onConfigure }: { template: Template, onDuplicate: (id: string) => void, onDelete: (id: string) => void, onConfigure: (id: string) => void }) {
  const Icon = iconMap[template.icon] || Blocks;
  const isSystem = template.type === 'System';

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <Icon className="size-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge variant={isSystem ? "secondary" : "outline"}>{template.type}</Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => onConfigure(template.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDuplicate(template.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {!isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onSelect={() => onDelete(template.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription>{template.description}</CardDescription>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="w-full" onClick={() => onDuplicate(template.id)}>
          <Copy className="mr-2" />
          Duplicate
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => onConfigure(template.id)}>
          <Settings className="mr-2" />
          Configure
        </Button>
      </CardFooter>
    </Card>
  )
}

function CreateTemplateDialog({ open, onOpenChange, onTemplateCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onTemplateCreated: (newTemplate: Template) => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { tenant } = useTenant();
    const { toast } = useToast();
    const currentUser = tenant.members[0];

    const handleSubmit = async () => {
        if (!name) {
            toast({ variant: 'destructive', title: 'Name is required' });
            return;
        }
        setIsLoading(true);
        const result = await createTemplateAction(tenant.id, { name, description });
        if (result.error || !result.template) {
            toast({ variant: 'destructive', title: "Creation Failed", description: result.error });
        } else {
            toast({ title: "Template Created", description: `${name} has been successfully created.` });
            onTemplateCreated(result.template);
            onOpenChange(false);
            setName("");
            setDescription("");
        }
        setIsLoading(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>
                        Start with a blank slate to build your own custom export template.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input id="template-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Security Questionnaire Template" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template-description">Description</Label>
                        <Textarea id="template-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description of what this template is for." />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 animate-spin" />}
                        Create Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const router = useRouter();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const currentUser = tenant.members[0];
  const canManageTemplates = canPerformAction(currentUser.role, 'editWorkspace');

  const handleDuplicate = async (templateId: string) => {
    const originalTemplate = templates.find(t => t.id === templateId);
    if (!originalTemplate) return;
    toast({ title: 'Duplicating Template...' });

    const result = await duplicateTemplateAction(tenant.id, templateId);
    if (result.error || !result.template) {
        toast({ variant: 'destructive', title: 'Duplication Failed', description: result.error });
    } else {
        setTemplates(prev => [...prev, result.template!]);
        toast({ title: 'Template Duplicated', description: `Created a copy of '${originalTemplate.name}'.`});
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    const result = await deleteTemplateAction(tenant.id, templateToDelete);
    if (result.error) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
    } else {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete));
        toast({ title: 'Template Deleted' });
    }
    setTemplateToDelete(null);
    setIsDeleteAlertOpen(false);
  };
  
  const handleConfigure = (templateId: string) => {
      router.push(`/${tenant.subdomain}/templates/${templateId}`);
  }

  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setIsDeleteAlertOpen(true);
  }
  
  const handleTemplateCreated = (newTemplate: Template) => {
      setTemplates(prev => [...prev, newTemplate]);
  };


  return (
    <>
      <div className="flex items-center justify-between mb-6">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Export Templates</h1>
              <p className="text-muted-foreground">Manage your export templates for consistent, branded responses.</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!canManageTemplates}>
              <PlusCircle className="mr-2" />
              Create New Template
          </Button>
      </div>

      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(22rem,1fr))]">
        {templates.map((template) => (
          <TemplateCardComponent 
            key={template.id} 
            template={template} 
            onDuplicate={handleDuplicate} 
            onDelete={handleDeleteClick} 
            onConfigure={handleConfigure} 
          />
        ))}
        {canManageTemplates && (
             <Card className="border-dashed flex items-center justify-center min-h-[250px] md:min-h-full">
                <Button variant="ghost" className="flex-col h-auto gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="size-8 text-muted-foreground" />
                    <span className="text-sm font-semibold">Create from scratch</span>
                </Button>
            </Card>
        )}
      </div>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the template.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <CreateTemplateDialog 
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onTemplateCreated={handleTemplateCreated}
      />
    </>
  )
}
