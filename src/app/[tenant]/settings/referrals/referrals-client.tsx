'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'

export function ReferralsClient({ referralLink }: { referralLink: string }) {
    const { toast } = useToast()

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink)
        toast({
            title: "Link Copied!",
            description: "Your referral link has been copied to the clipboard.",
        })
    }

    return (
      <>
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
      </>
    )
}
