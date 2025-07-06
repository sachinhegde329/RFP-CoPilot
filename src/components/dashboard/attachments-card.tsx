'use client'

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4" />
            Supporting Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-4 min-h-[120px]">
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                <a 
                    href={attachment.url}
                    download={attachment.name}
                    className="flex items-center gap-2 hover:underline truncate"
                >
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-medium truncate">{attachment.name}</span>
                    <span className="text-xs text-muted-foreground block">{attachment.size}</span>
                  </div>
                </a>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
              </div>
            ))}
          </div>
        ) : (
           <div className="flex h-full min-h-[90px] flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-4">
              <p className="text-xs">No documents attached.</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
            variant="outline" 
            size="sm"
            className="w-full text-xs h-8"
            onClick={handleAddClick}
            disabled={attachments.length >= 3}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </CardFooter>
    </Card>
  )
}
