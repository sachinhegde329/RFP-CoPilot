
'use client'
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle, Trash2, Mail, Edit, Loader2, AlertTriangle } from 'lucide-react'
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
import { type Role, type TeamMember } from '@/lib/tenant-types';
import { useToast } from '@/hooks/use-toast';
import { inviteMemberAction, removeMemberAction, updateMemberRoleAction } from '@/app/actions';
import { canPerformAction } from '@/lib/access-control';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


export default function TeamSettingsPage() {
    const { tenant, setTenant } = useTenant();
    const { toast } = useToast();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>('Editor');
    const [isLoading, setIsLoading] = useState(false);

    const teamMembers = tenant.members;
    const totalSeats = tenant.limits.seats;
    const usedSeats = teamMembers.length;
    const availableSeats = totalSeats - usedSeats;

    const currentUser = tenant.members[0];
    const canManageTeam = canPerformAction(currentUser.role, 'manageTeam');

    const handleInviteMember = async () => {
        if (!inviteEmail || !inviteRole) {
            toast({ variant: 'destructive', title: 'Missing information', description: 'Please provide an email and a role.' });
            return;
        }
        setIsLoading(true);

        const result = await inviteMemberAction(tenant.id, inviteEmail, inviteRole);
        if (result.error || !result.member) {
            toast({ variant: 'destructive', title: 'Invitation Failed', description: result.error || 'This feature is a mock-up in the current prototype.' });
        } else {
            setTenant(prev => ({ ...prev, members: [result.member!, ...prev.members] }));
            toast({ title: 'Invitation Sent', description: `An invitation has been sent to ${inviteEmail}.` });
            setIsInviteDialogOpen(false);
            setInviteEmail('');
            setInviteRole('Editor');
        }
        setIsLoading(false);
    };

    const handleRemoveMember = async (member: TeamMember) => {
        const result = await removeMemberAction(tenant.id, member.id);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            setTenant(prev => ({ ...prev, members: prev.members.filter(m => m.id !== member.id) }));
            toast({ title: 'Member Removed', description: `${member.name} has been removed from the workspace.` });
        }
    }
    
    const handleResendInvitation = (email: string) => {
        toast({
            title: "Invitation Resent",
            description: `A new invitation link has been sent to ${email}.`,
        });
    }

    const handleRoleChange = async (memberId: string, newRole: Role) => {
        const result = await updateMemberRoleAction(tenant.id, memberId, newRole);
         if (result.error || !result.member) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            setTenant(prev => ({ ...prev, members: prev.members.map(m => m.id === memberId ? result.member! : m) }));
            toast({ title: 'Role Updated', description: `The role has been successfully updated.` });
        }
    }


    return (
        <Card className="flex flex-col flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage who can access your workspace and what they can do.</CardDescription>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                         <Button disabled={availableSeats <= 0 || !canManageTeam}>
                            <PlusCircle className="mr-2" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a new team member</DialogTitle>
                            <DialogDescription>
                                Team invitations are handled by your identity provider (e.g., Auth0 dashboard). This is a mock-up.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                Email
                                </Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="name@company.com" 
                                    className="col-span-3"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={isLoading} 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                Role
                                </Label>
                                <div className="col-span-3">
                                    <Select 
                                        value={inviteRole}
                                        onValueChange={(value) => setInviteRole(value as Role)}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Viewer">Viewer</SelectItem>
                                            <SelectItem value="Editor">Editor</SelectItem>
                                            <SelectItem value="Approver">Approver</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Admins manage users. Approvers review content. Editors create drafts. Viewers have read-only access.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleInviteMember} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Single-User Workspace</AlertTitle>
                    <AlertDescription>
                        Multi-user collaboration is not enabled in this prototype. To add users to your workspace, please use your Auth0 dashboard.
                    </AlertDescription>
                </Alert>
                <div className="relative flex-1">
                    <div className="absolute inset-0 overflow-y-auto">
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
                                                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
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
                                                    <Button variant="ghost" size="icon" disabled={member.role === 'Owner' || !canManageTeam}>
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
                                                                <DropdownMenuRadioGroup 
                                                                    value={member.role}
                                                                    onValueChange={(value) => handleRoleChange(member.id, value as Role)}
                                                                >
                                                                    <DropdownMenuRadioItem value="Viewer">Viewer</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="Editor">Editor</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="Approver">Approver</DropdownMenuRadioItem>
                                                                    <DropdownMenuRadioItem value="Admin">Admin</DropdownMenuRadioItem>
                                                                </DropdownMenuRadioGroup>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    
                                                    {member.status === 'Pending' && <DropdownMenuItem onSelect={() => handleResendInvitation(member.email)}><Mail className="mr-2 h-4 w-4"/> Resend Invitation</DropdownMenuItem>}
                                                    
                                                    <DropdownMenuSeparator />

                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => handleRemoveMember(member)}>
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
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
