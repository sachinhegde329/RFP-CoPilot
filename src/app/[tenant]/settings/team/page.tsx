'use client'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle, Trash2, Mail } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  { id: 3, name: 'David Chen', email: 'david.c@megacorp.com', role: 'Member', avatar: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 4, name: 'sara.k@example.com', email: 'sara.k@example.com', role: 'Member', avatar: null, status: 'Pending' },
];

export default function TeamSettingsPage() {
    const { tenant } = useTenant();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    // Placeholder logic for seat count
    const totalSeats = tenant.plan === 'free' ? 2 : (tenant.plan === 'starter' ? 5 : 25);
    const usedSeats = teamMembers.length;
    const availableSeats = totalSeats - usedSeats;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage who can access your workspace.</CardDescription>
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
                                Enter the email address and select a role for the new member. They will receive an email to join your workspace.
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
                                <Select>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                            {member.avatar && <AvatarImage src={member.avatar} />}
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{member.role}</TableCell>
                                <TableCell>
                                    <Badge variant={member.status === 'Active' ? 'secondary' : 'outline'}>{member.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={member.role === 'Owner'}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                                            {member.status === 'Pending' && <DropdownMenuItem><Mail className="mr-2 h-4 w-4"/> Resend Invitation</DropdownMenuItem>}
                                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Remove Member</DropdownMenuItem>
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
