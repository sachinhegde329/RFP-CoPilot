
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportRfpAction, getTemplatesAction } from '@/app/actions'
import type { Template } from '@/lib/template.service'
import type { RFP } from '@/lib/rfp-types'
import { useTenant } from '@/components/providers/tenant-provider'
import { useToast } from '@/hooks/use-toast'
import { Loader2, PlusCircle, Trash2, ShieldAlert } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type ExportRfpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rfp: RFP
}

export function ExportRfpDialog({ open, onOpenChange, rfp }: ExportRfpDialogProps) {
  const { tenant } = useTenant()
  const { toast } = useToast()

  const [version, setVersion] = useState('1.0.0')
  const [format, setFormat] = useState<'pdf' | 'docx'>('docx')
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [acknowledgments, setAcknowledgments] = useState<{ name: string; role: string; comment: string }[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)

  const [ackName, setAckName] = useState('')
  const [ackRole, setAckRole] = useState('')
  const [ackComment, setAckComment] = useState('')

  const currentUser = tenant.members[0]
  const allQuestionsCompleted = rfp.questions.every(q => q.status === 'Completed')

  useEffect(() => {
    async function fetchTemplates() {
      if (!open) return
      setIsLoadingTemplates(true)
      const result = await getTemplatesAction(tenant.id, currentUser)
      if (result.templates) {
        setTemplates(result.templates)
        const defaultTemplate = result.templates.find(t => t.id === 'system-default-categorized')
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id)
        } else if (result.templates.length > 0) {
          setSelectedTemplate(result.templates[0].id)
        }
      }
      setIsLoadingTemplates(false)
    }

    fetchTemplates()
  }, [open, tenant.id, currentUser])
  
  const handleAddAcknowledgment = () => {
    if (ackName && ackRole) {
      setAcknowledgments(prev => [...prev, { name: ackName, role: ackRole, comment: ackComment }])
      setAckName('')
      setAckRole('')
      setAckComment('')
    }
  }

  const handleRemoveAcknowledgment = (index: number) => {
    setAcknowledgments(prev => prev.filter((_, i) => i !== index))
  }

  const handleExport = async () => {
    setIsExporting(true)
    const result = await exportRfpAction({
      tenantId: tenant.id,
      rfpId: rfp.id,
      templateId: selectedTemplate,
      currentUser,
      exportVersion: version,
      format,
      acknowledgments,
    })

    if (result.success && result.fileData && result.fileName && result.mimeType) {
      const link = document.createElement('a')
      link.href = `data:${result.mimeType};base64,${result.fileData}`
      link.download = result.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({ title: 'Export Successful', description: 'Your document is downloading.' })
      onOpenChange(false)
    } else {
      toast({ variant: 'destructive', title: 'Export Failed', description: result.error })
    }
    setIsExporting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Finalize &amp; Export: {rfp.name}</DialogTitle>
          <DialogDescription>
            Review the export settings, add final acknowledgments, and generate your response document.
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <h4 className="font-medium">Export Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="version">Version Tag</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="e.g., v1.0, Final"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={value => setFormat(value as 'pdf' | 'docx')}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select a format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docx">Word (.docx)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                {isLoadingTemplates ? (
                  <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                ) : (
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {!allQuestionsCompleted && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Incomplete RFP</AlertTitle>
                  <AlertDescription>
                    Not all questions are marked as 'Completed'. Admins and Owners can override this.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-4 flex flex-col">
              <h4 className="font-medium">Acknowledgments (Optional)</h4>
              <div className="p-4 border rounded-lg space-y-3 flex-1 flex flex-col">
                 <ScrollArea className="flex-1 pr-3 -mr-3">
                      <div className="space-y-2">
                      {acknowledgments.map((ack, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                          <div>
                            <p className="font-medium">{ack.name} <span className="text-muted-foreground font-normal">({ack.role})</span></p>
                            <p className="text-muted-foreground italic">"{ack.comment}"</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveAcknowledgment(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove Acknowledgment</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                      {acknowledgments.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">No acknowledgments added.</p>
                      )}
                    </div>
                 </ScrollArea>
                  <div className="space-y-2 pt-3 border-t">
                      <Input placeholder="Contributor's Name" value={ackName} onChange={e => setAckName(e.target.value)} />
                      <Input placeholder="Role (e.g., SME, Legal)" value={ackRole} onChange={e => setAckRole(e.target.value)} />
                      <Input placeholder="Comment (optional)" value={ackComment} onChange={e => setAckComment(e.target.value)} />
                      <Button variant="outline" size="sm" onClick={handleAddAcknowledgment} disabled={!ackName || !ackRole}>
                          <PlusCircle className="mr-2" /> Add Acknowledgment
                      </Button>
                  </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
        <DialogFooter>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="animate-spin mr-2" />}
            {isExporting ? 'Generating...' : 'Export Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
