'use client'

import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { File, PlusCircle, MoreHorizontal, Download, Trash2, Paperclip } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
};

type AttachmentsCardProps = {
    attachments: Attachment[];
    onUpdateAttachments: (attachments: Attachment[]) => void;
}

export function AttachmentsCard({ attachments, onUpdateAttachments }: AttachmentsCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (attachments.length >= 3) {
      toast({
        variant: 'destructive',
        title: 'Attachment Limit Reached',
        description: 'You can only upload a maximum of 3 supporting documents.',
      });
      return;
    }

    const newAttachment: Attachment = {
      id: Date.now(),
      name: file.name,
      size: file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`,
      type: file.type,
      url: URL.createObjectURL(file),
    };

    onUpdateAttachments([...attachments, newAttachment]);

    toast({
      title: 'Attachment Added',
      description: `${file.name} has been added.`,
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: number) => {
    const attachmentToRemove = attachments.find(att => att.id === id);
    const newAttachments = attachments.filter(att => att.id !== id);
    onUpdateAttachments(newAttachments);
    
    if (attachmentToRemove) {
        toast({
          title: 'Attachment Removed',
          description: `${attachmentToRemove.name} has been removed.`,
        });
    }
  };


  return (
    <Card>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Supporting Documents
        </CardTitle>
        <CardDescription>
          Add supplementary files like appendices or diagrams for the selected RFP. (Max 3)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 min-h-52">
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
                    <a 
                        href={attachment.url}
                        download={attachment.name}
                        className="flex items-center gap-2 hover:underline"
                    >
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate max-w-xs">{attachment.name}</span>
                    </a>
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
                        <DropdownMenuItem asChild>
                           <a href={attachment.url} download={attachment.name} className="flex items-center cursor-pointer">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onSelect={() => handleDelete(attachment.id)}
                        >
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
           <div className="flex h-full min-h-[13rem] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted p-8 text-center">
              <Paperclip className="size-12 text-muted-foreground" />
              <h3 className="font-semibold">No Supporting Documents</h3>
              <p className="text-sm text-muted-foreground">Add supplementary files for this RFP.</p>
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
            variant="outline" 
            className="w-full whitespace-normal h-auto"
            onClick={handleAddClick}
            disabled={attachments.length >= 3}
        >
          <PlusCircle className="mr-2" />
          Add Supporting Document
        </Button>
      </CardFooter>
    </Card>
  )
}
