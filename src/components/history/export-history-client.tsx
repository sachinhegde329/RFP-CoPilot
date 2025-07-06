'use client'

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import type { ExportRecord } from "@/lib/export.service"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, History, File } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type ExportHistoryClientProps = {
    initialHistory: ExportRecord[];
}

export function ExportHistoryClient({ initialHistory }: ExportHistoryClientProps) {
    const [history, setHistory] = useState(initialHistory);
    const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">RFP Export History</h1>
                    <p className="text-muted-foreground">View the complete version history for all of your workspace's RFPs.</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Version History</CardTitle>
                    <CardDescription>A chronological record of all exported versions for your RFPs.</CardDescription>
                </CardHeader>
                <CardContent>
                    {history.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Version</TableHead>
                                    <TableHead>RFP Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Exported By</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Questions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map(record => (
                                    <TableRow key={record.id} onClick={() => setSelectedRecord(record)} className="cursor-pointer">
                                        <TableCell>
                                            <Badge variant="outline">{record.version}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{record.rfpName}</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>{formatDistanceToNow(new Date(record.exportedAt), { addSuffix: true })}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{format(new Date(record.exportedAt), "PPpp")}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>{record.exportedBy.name}</TableCell>
                                        <TableCell>{record.format.toUpperCase()}</TableCell>
                                        <TableCell>{record.questionCount}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); setSelectedRecord(record)}}>
                                                    View Details
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 text-center p-8 border-2 border-dashed border-muted rounded-lg">
                            <History className="size-12 text-muted-foreground" />
                            <h3 className="font-semibold">No RFP History</h3>
                            <p className="text-sm text-muted-foreground">When you export an RFP from the main dashboard, its version history will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedRecord} onOpenChange={(isOpen) => !isOpen && setSelectedRecord(null)}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Export Details: {selectedRecord?.version} for {selectedRecord?.rfpName}</DialogTitle>
                        <DialogDescription>
                            Snapshot of the RFP exported on {selectedRecord && format(new Date(selectedRecord.exportedAt), "PPp")} by {selectedRecord?.exportedBy.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0">
                            <div className="md:col-span-1 space-y-6 flex flex-col">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Exported File</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                                            <File className="h-8 w-8 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium text-sm truncate">RFP_Response_{selectedRecord.version.replace(/\s+/g, '_')}.{selectedRecord.format}</p>
                                                <p className="text-xs text-muted-foreground">{selectedRecord.format.toUpperCase()} Document</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="w-full" tabIndex={0}>
                                                        <Button className="w-full" disabled>
                                                            <Download className="mr-2 h-4 w-4" /> Download Again
                                                        </Button>
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Re-downloading is not supported in this prototype.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardFooter>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Acknowledgments</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-48 pr-4">
                                            <div className="space-y-4">
                                                {selectedRecord.acknowledgments.length > 0 ? selectedRecord.acknowledgments.map((ack, index) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback>{ack.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-sm">{ack.name} <span className="text-muted-foreground font-normal">({ack.role})</span></p>
                                                            <p className="text-sm text-muted-foreground italic">"{ack.comment}"</p>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No acknowledgments for this version.</p>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2 flex flex-col">
                                <Card className="flex-1 flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Questions &amp; Answers ({selectedRecord.questionCount})</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-hidden p-0">
                                        <ScrollArea className="h-full p-6 pt-0">
                                            <Accordion type="single" collapsible className="w-full">
                                                {selectedRecord.questions.map(q => (
                                                    <AccordionItem key={q.id} value={`q-${q.id}`}>
                                                        <AccordionTrigger className="text-left">{q.question}</AccordionTrigger>
                                                        <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                                                            <p>{q.answer || "No answer provided."}</p>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
