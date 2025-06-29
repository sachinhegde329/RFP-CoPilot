import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Underline, List } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TemplateCard() {
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
              <SelectItem value="acme-standard">Acme Standard Template</SelectItem>
              <SelectItem value="technical-deep-dive">Technical Deep-Dive</SelectItem>
              <SelectItem value="executive-summary-tpl">Executive Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-2 border rounded-md space-y-2">
           <div className="flex items-center gap-1 border-b pb-2">
            <Button variant="ghost" size="icon"><Bold className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Italic className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Underline className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><List className="h-4 w-4" /></Button>
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
