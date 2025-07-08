import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileBox } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6">
        <Link href="/" className="flex items-center gap-2 text-center">
          <FileBox className="size-8 text-primary" />
          <h1 className="text-2xl font-semibold">RFP CoPilot</h1>
        </Link>
        <div className="w-full">
            {children}
        </div>
        <div className="w-full max-w-sm text-center">
            <Separator className="my-2" />
            <Button variant="secondary" className="w-full" asChild>
                <Link href="/megacorp">Explore Live Demo</Link>
            </Button>
        </div>
      </div>
    </div>
  )
}
