
'use client'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle, Trash2, Mail, Edit } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTenant } from '@/components/providers/tenant-provider';
import Link from "next/link";

// Mock data for team members
const teamMembers = [
  { id: 1, name: 'Alex Johnson', email: 'alex.j@megacorp.com', role: 'Owner', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 2, name: 'Maria Garcia', email: 'maria.g@megacorp.com', role: 'Admin', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 3, name: 'David Chen', email: 'david.c@megacorp.com', role: 'Approver', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 4, name: 'Priya Patel', email: 'priya.p@megacorp.com', role: 'Editor', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 5, name: 'John Smith', email: 'john.s@megacorp.com', role: 'Viewer', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 6, name: 'sara.k@example.com', email: 'sara.k@example.com', role: 'Editor', avatar: null, status: 'Pending' },
];

export default function TeamSettingsPage() {
    const { tenant } = useTenant();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    const totalSeats = tenant.limits.seats;
    const usedSeats = teamMembers.length;
    const availableSeats = totalSeats - usedSeats;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage who can access your workspace and what they can do.</CardDescription>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                         <Button disabled={availableSeats <= 0}>
                            <PlusCircle className="mr-2" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a new team member</DialogTitle>
                            <DialogDescription>
                                Enter the email address and select a role for the new member.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                Email
                                </Label>
                                <Input id="email" type="email" placeholder="name@company.com" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                Role
                                </Label>
                                <div className="col-span-3">
                                    <Select>
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="approver">Approver</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Admins manage users. Approvers review content. Editors create drafts. Viewers have read-only access.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={() => setIsInviteDialogOpen(false)}>Send Invitation</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg mb-4 p-4 flex justify-between items-center">
                    <div>
                        <p className="font-medium">{usedSeats} of {totalSeats} seats used</p>
                        <p className="text-sm text-muted-foreground">
                            {availableSeats > 0 ? `You have ${availableSeats} seats available.` : "You have no available seats."}
                            <Link href={`/pricing?tenant=${tenant.subdomain}`} className="text-primary underline ml-1">Upgrade plan</Link> for more.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={`/pricing?tenant=${tenant.subdomain}`}>Manage Seats</Link>
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamMembers.map(member => (
                            <TableRow key={member.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            {member.avatar && <AvatarImage src={member.avatar} alt={member.name}/>}
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{member.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={member.status === 'Active' ? 'secondary' : 'outline'}>{member.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={member.role === 'Owner'}>
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Member actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Change Role
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuRadioGroup value={member.role.toLowerCase()}>
                                                            <DropdownMenuRadioItem value="viewer">Viewer</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="editor">Editor</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="approver">Approver</DropdownMenuRadioItem>
                                                            <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                                        </DropdownMenuRadioGroup>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            
                                            {member.status === 'Pending' && <DropdownMenuItem><Mail className="mr-2 h-4 w-4"/> Resend Invitation</DropdownMenuItem>}
                                            
                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> 
                                                Remove Member
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
