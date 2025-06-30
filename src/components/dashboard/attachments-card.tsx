'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { File, PlusCircle, MoreHorizontal, Download, Trash2, Paperclip } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: string;
};

type AttachmentsCardProps = {
    attachments: Attachment[];
}

export function AttachmentsCard({ attachments }: AttachmentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
        </CardTitle>
        <CardDescription>
          Manage all supporting documents for this RFP.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {attachments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachments.map((attachment) => (
                <TableRow key={attachment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate max-w-xs">{attachment.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{attachment.size}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
           <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
              <Paperclip className="size-12 text-muted-foreground" />
              <h3 className="font-semibold">No Attachments Yet</h3>
              <p className="text-sm text-muted-foreground">Upload an RFP or add supporting documents.</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2" />
          Add Attachment
        </Button>
      </CardFooter>
    </Card>
  )
}
