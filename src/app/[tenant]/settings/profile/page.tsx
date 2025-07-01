
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"

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
import { Upload } from "lucide-react"
import { Label } from "@/components/ui/label"

// Mock user data. In a real app, this would come from an auth context.
const currentUser = {
  name: 'Alex Johnson',
  email: 'alex.j@megacorp.com',
  avatar: 'https://placehold.co/100x100.png',
}

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileSettingsPage() {
    const { toast } = useToast()
    const router = useRouter()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: currentUser.name,
        },
        mode: "onChange",
    })

    function onSubmit(data: ProfileFormValues) {
        // In a real app, you would call a server action to update the user's profile
        console.log(data)
        toast({
            title: "Profile Updated",
            description: "Your profile information has been saved.",
        })
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                    Update your personal information and preferences.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
                    <CardContent className="space-y-6 flex-1">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button type="button" variant="outline">
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
                        <Button type="submit">Save Changes</Button>
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
