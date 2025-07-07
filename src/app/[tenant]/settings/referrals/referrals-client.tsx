'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


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
      <TooltipProvider>
        <div className="space-y-2">
            <p className="text-sm font-medium">Your Personal Referral Link</p>
            <div className="flex gap-2">
                <Input value={referralLink} readOnly />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCopyLink} variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy link</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy link</p>
                  </TooltipContent>
                </Tooltip>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Share on:</p>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Image src="https://placehold.co/20x20.png" alt="Twitter logo" width={16} height={16} data-ai-hint="twitter logo" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share on Twitter</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Image src="https://placehold.co/20x20.png" alt="LinkedIn logo" width={16} height={16} data-ai-hint="linkedin logo" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share on LinkedIn</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Image src="https://placehold.co/20x20.png" alt="Facebook logo" width={16} height={16} data-ai-hint="facebook logo" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share on Facebook</p></TooltipContent>
            </Tooltip>
        </div>
      </TooltipProvider>
    )
}
