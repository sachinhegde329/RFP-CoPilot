import { getTenantBySubdomain } from "@/lib/tenants"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ReferralsClient } from "./referrals-client"

export default function ReferralsPage({ params }: { params: { tenant: string }}) {
    const tenant = getTenantBySubdomain(params.tenant);
    if (!tenant) {
      notFound();
    }
    const referralLink = `https://rfpcopilot.com/join?ref=${tenant.subdomain}` // Example link

    const mockReferrals = [
        { id: 1, email: 'friend1@example.com', date: '2024-06-15', status: 'Signed Up', reward: '$10 Credit' },
        { id: 2, email: 'colleague@work.com', date: '2024-05-20', status: 'Subscribed', reward: '$20 Credit' },
    ]

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Gift className="text-primary" />
                    <CardTitle>Refer a Friend, Get Rewarded</CardTitle>
                </div>
                <CardDescription>
                    Share your unique referral link with your network. When they sign up, you both get a discount on your subscription.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                <div className="p-6 text-center bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold">Share the love</h3>
                    <p className="text-2xl md:text-4xl font-extrabold text-primary my-2">Give 20%, Get 20%</p>
                    <p className="text-muted-foreground">They get 20% off their first bill, and you get a 20% credit.</p>
                </div>

                <ReferralsClient referralLink={referralLink} />
                
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
