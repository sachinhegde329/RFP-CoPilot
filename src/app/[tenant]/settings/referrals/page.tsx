
'use client'

import { useTenant } from '@/components/providers/tenant-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Gift } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Separator } from '@/components/ui/separator'

export default function ReferralsPage() {
    const { tenant } = useTenant()
    const { toast } = useToast()
    const referralLink = `https://rfpcopilot.com/join?ref=${tenant.subdomain}` // Example link

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink)
        toast({
            title: "Link Copied!",
            description: "Your referral link has been copied to the clipboard.",
        })
    }

    const mockReferrals = [
        { id: 1, email: 'friend1@example.com', date: '2024-06-15', status: 'Signed Up', reward: '$10 Credit' },
        { id: 2, email: 'colleague@work.com', date: '2024-05-20', status: 'Subscribed', reward: '$20 Credit' },
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Gift className="text-primary" />
                    <CardTitle>Refer a Friend, Get Rewarded</CardTitle>
                </div>
                <CardDescription>
                    Share your unique referral link with your network. When they sign up, you both get a discount on your subscription.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 text-center bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold">Share the love</h3>
                    <p className="text-2xl md:text-4xl font-extrabold text-primary my-2">Give 20%, Get 20%</p>
                    <p className="text-muted-foreground">They get 20% off their first bill, and you get a 20% credit.</p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Your Personal Referral Link</p>
                    <div className="flex gap-2">
                        <Input value={referralLink} readOnly />
                        <Button onClick={handleCopyLink} variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy link</span>
                        </Button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Share on:</p>
                    <Button variant="outline" size="icon">
                        <Image src="https://placehold.co/20x20.png" alt="Twitter logo" width={16} height={16} data-ai-hint="twitter logo" />
                    </Button>
                    <Button variant="outline" size="icon">
                            <Image src="https://placehold.co/20x20.png" alt="LinkedIn logo" width={16} height={16} data-ai-hint="linkedin logo" />
                    </Button>
                    <Button variant="outline" size="icon">
                            <Image src="https://placehold.co/20x20.png" alt="Facebook logo" width={16} height={16} data-ai-hint="facebook logo" />
                    </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Your Referrals</h3>
                    <p className="text-sm text-muted-foreground">Track the status of your referrals and rewards.</p>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Referred User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Reward</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockReferrals.length > 0 ? mockReferrals.map(ref => (
                            <TableRow key={ref.id}>
                                <TableCell className="font-medium">{ref.email}</TableCell>
                                <TableCell>{ref.date}</TableCell>
                                <TableCell>
                                    <Badge variant={ref.status === 'Subscribed' ? 'default' : 'secondary'}>{ref.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600">{ref.reward}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    You haven't referred anyone yet. Share your link to start earning rewards!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
