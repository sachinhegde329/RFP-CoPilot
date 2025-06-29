
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Underline, List, Lock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenant } from "@/components/providers/tenant-provider"
import Link from "next/link"

export function TemplateCard() {
  const { tenant } = useTenant()

  if (tenant.plan === "free") {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10" />
        <CardHeader>
          <CardTitle>Customizable Templates</CardTitle>
          <CardDescription>
            Format and export your response using branded templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 blur-sm select-none">
          <div>
            <Select defaultValue="acme-standard" disabled>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
            </Select>
          </div>
          <div className="p-2 border rounded-md space-y-2">
            <div className="flex items-center gap-1 border-b pb-2">
              <Button variant="ghost" size="icon" disabled>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <Underline className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder="WYSIWYG editor for final touches..."
              className="min-h-[100px] border-0 focus-visible:ring-0"
              defaultValue="Our solution provides best-in-class performance and security..."
              disabled
            />
          </div>
          <Button className="w-full" disabled>
            Export as PDF
          </Button>
        </CardContent>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background/20 p-4 text-center">
          <Lock className="size-8 text-primary mb-2" />
          <h3 className="font-semibold mb-1">Unlock Custom Templates</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to use custom branding and export formats.
          </p>
          <Button asChild>
            <Link href={`/pricing?tenant=${tenant.subdomain}`}>View Plans</Link>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customizable Templates</CardTitle>
        <CardDescription>
          Format and export your response using branded templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select defaultValue="acme-standard">
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acme-standard">
                Acme Standard Template
              </SelectItem>
              <SelectItem value="technical-deep-dive">
                Technical Deep-Dive
              </SelectItem>
              <SelectItem value="executive-summary-tpl">
                Executive Summary
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-2 border rounded-md space-y-2">
          <div className="flex items-center gap-1 border-b pb-2">
            <Button variant="ghost" size="icon">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            placeholder="WYSIWYG editor for final touches..."
            className="min-h-[100px] border-0 focus-visible:ring-0"
            defaultValue="Our solution provides best-in-class performance and security..."
          />
        </div>
        <Button className="w-full">Export as PDF</Button>
      </CardContent>
    </Card>
  )
}
