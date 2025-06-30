
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"
import { useTenant } from "@/components/providers/tenant-provider"
import { Label } from "@/components/ui/label"
import { type BrandTone } from "@/lib/tenants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { canPerformAction } from "@/lib/access-control"


const workspaceFormSchema = z.object({
  name: z.string().min(2, {
    message: "Workspace name must be at least 2 characters.",
  }),
  defaultTone: z.enum(['Formal', 'Consultative', 'Technical']),
})

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>


export default function WorkspaceSettingsPage() {
    const { toast } = useToast()
    const { tenant, setTenant } = useTenant();

    const currentUser = tenant.members[0];
    const canEditWorkspace = canPerformAction(currentUser.role, 'editWorkspace');

    const form = useForm<WorkspaceFormValues>({
        resolver: zodResolver(workspaceFormSchema),
        defaultValues: {
            name: tenant.name,
            defaultTone: tenant.defaultTone || 'Formal',
        },
        mode: "onChange",
    })

    function onSubmit(data: WorkspaceFormValues) {
        console.log(data)

        // Optimistically update the tenant context
        setTenant(prev => ({ ...prev, name: data.name, defaultTone: data.defaultTone as BrandTone }))
        
        toast({
            title: "Workspace Updated",
            description: "Your workspace settings have been saved.",
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>
                Manage your workspace name, branding, and other settings.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <fieldset className="space-y-6" disabled={!canEditWorkspace}>
                            <div className="flex items-center gap-4">
                                <Image 
                                    src={tenant.branding.logoUrl} 
                                    alt={`${tenant.name} Logo`}
                                    width={128}
                                    height={32}
                                    className="h-10 w-auto p-1 bg-muted rounded-md"
                                    data-ai-hint={tenant.branding.logoDataAiHint}
                                />
                                <Button type="button" variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Change Logo
                                </Button>
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Workspace Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your workspace name" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            This is the name of your workspace that will be displayed to all team members.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="defaultTone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default AI Tone</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a default tone for AI answers" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Formal">Formal</SelectItem>
                                                <SelectItem value="Consultative">Consultative</SelectItem>
                                                <SelectItem value="Technical">Technical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            This tone will be used by default when generating draft answers.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </fieldset>
                        
                         <div className="space-y-2">
                             <Label htmlFor="subdomain">Workspace URL</Label>
                             <div className="flex items-center">
                                <Input id="subdomain" type="text" value={tenant.subdomain} readOnly className="rounded-r-none focus-visible:ring-0" />
                                <span className="inline-flex items-center px-3 h-10 border border-l-0 rounded-r-md bg-muted text-sm text-muted-foreground">
                                    .{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost'}
                                </span>
                             </div>
                             <p className="text-sm text-muted-foreground">
                                 Your workspace URL (subdomain) cannot be changed.
                             </p>
                         </div>

                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={!canEditWorkspace}>Save Changes</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
