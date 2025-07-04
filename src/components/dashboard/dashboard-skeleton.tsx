import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { HomepageHeader } from "./dashboard-header"

export function DashboardSkeleton() {
    return (
        <>
            <HomepageHeader />
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-6">
                    <Skeleton className="h-12 w-full md:w-1/3 mb-6" />
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                                <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card>
                                 <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
                                 <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
