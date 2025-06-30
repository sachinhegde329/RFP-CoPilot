
'use client'

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import type { ExportRecord } from "@/lib/export.service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, MessageSquare, History } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

type ExportHistoryClientProps = {
    initialHistory: ExportRecord[];
}

export function ExportHistoryClient({ initialHistory }: ExportHistoryClientProps) {
    const [history, setHistory] = useState(initialHistory);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">RFP Management</h1>
                    <p className="text-muted-foreground">Manage your RFPs and view their version history.</p>
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
                                    <TableHead>Date</TableHead>
                                    <TableHead>Exported By</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Questions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            <Badge variant="outline">{record.version}</Badge>
                                        </TableCell>
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
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" disabled={record.acknowledgments.length === 0}>
                                                            <MessageSquare className="mr-2 h-4 w-4" /> Notes
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Export Notes for {record.version}</DialogTitle>
                                                            <DialogDescription>
                                                                Acknowledgments and comments from the team for this export.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="max-h-[60vh] overflow-y-auto p-1">
                                                            <div className="space-y-4 py-4">
                                                                {record.acknowledgments.map((ack, index) => (
                                                                    <div key={index} className="flex items-start gap-3">
                                                                        <Avatar className="h-8 w-8">
                                                                            <AvatarFallback>{ack.name.charAt(0)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <p className="font-semibold text-sm">{ack.name} <span className="text-muted-foreground font-normal">({ack.role})</span></p>
                                                                            <p className="text-sm text-muted-foreground italic">"{ack.comment}"</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span tabIndex={0}><Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> Download</Button></span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Re-downloading is not supported in this prototype.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
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
                            <p className="text-sm text-muted-foreground">When you export an RFP, its version history will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}
