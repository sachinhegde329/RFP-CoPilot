
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useRef } from "react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useTenant } from "@/components/providers/tenant-provider"
import { updateProfileSettingsAction } from "@/app/actions"

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileSettingsPage() {
    const { toast } = useToast()
    const router = useRouter()
    const { tenant, setTenant } = useTenant();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUser = tenant.members[0];

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: currentUser.name,
        },
        mode: "onChange",
    })

    async function onSubmit(data: ProfileFormValues) {
        const result = await updateProfileSettingsAction(tenant.id, currentUser.id, data);

        if (result.error || !result.member) {
             toast({
                variant: 'destructive',
                title: "Update Failed",
                description: result.error || "Could not update your profile.",
            })
        } else {
            // Optimistically update the tenant context to reflect the change immediately
            setTenant(prev => ({
                ...prev,
                members: prev.members.map(m => m.id === currentUser.id ? { ...m, name: result.member!.name } : m)
            }));

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved.",
            })
        }
    }
    
    const handleAvatarUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a local URL for preview
        const avatarUrl = URL.createObjectURL(file);
        
        // Optimistically update tenant context
        setTenant(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === currentUser.id ? { ...m, avatar: avatarUrl } : m)
        }));

        toast({
            title: "Avatar Updated",
            description: "Your new avatar is being previewed. Save changes to make it permanent (not implemented).",
        });
    };

    return (
        <Card className="flex flex-col flex-1">
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                    Update your personal information and preferences.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
                    <CardContent className="space-y-6 flex-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
                                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button type="button" variant="outline" onClick={handleAvatarUploadClick}>
                                <Upload className="mr-2 h-4 w-4" />
                                Change Photo
                            </Button>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is your public display name.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                         <div className="space-y-2">
                             <Label htmlFor="email">Email Address</Label>
                             <Input id="email" type="email" value={currentUser.email} disabled />
                             <p className="text-sm text-muted-foreground">
                                 Your email address cannot be changed.
                             </p>
                         </div>

                    </CardContent>
                    <CardFooter className="gap-2">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
