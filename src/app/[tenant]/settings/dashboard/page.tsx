'use client';
import { AdminDashboardView } from '@/components/dashboard/admin-dashboard-view';
import { useTenant } from '@/components/providers/tenant-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { canPerformAction } from '@/lib/access-control';

export default function AdminDashboardSettingsPage() {
    const { tenant } = useTenant();
    const router = useRouter();
    const currentUser = tenant.members[0];
    const canSeeDashboard = canPerformAction(currentUser.role, 'manageTeam');

    useEffect(() => {
        if (!canSeeDashboard) {
            router.replace(`/${tenant.subdomain}/settings/profile`);
        }
    }, [canSeeDashboard, router, tenant.subdomain]);

    if (!canSeeDashboard) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col flex-1">
            <AdminDashboardView />
        </div>
    );
}
