
import { NextResponse, type NextRequest } from "next/server";
import { knowledgeBaseService } from "@/lib/knowledge-base";

export const dynamic = 'force-dynamic'; // Defaults to auto, but force-dynamic ensures it's always run dynamically

/**
 * API endpoint to trigger a sync for all data sources across all tenants.
 * This should be called by an external scheduler (e.g., Vercel Cron Jobs, Google Cloud Scheduler).
 * 
 * Protect this endpoint by setting a CRON_SECRET in your environment variables and
 * passing it as a bearer token in the Authorization header of your cron job request.
 * Example: `Authorization: Bearer YOUR_CRON_SECRET`
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    // This is a long-running task. In a real production environment, this would be
    // better handled by a dedicated background worker queue (e.g., BullMQ, Celery).
    // For this example, we will run them sequentially to avoid overwhelming the service.
    (async () => {
        console.log("Cron job started: Syncing all sources...");
        const allSources = await knowledgeBaseService.getAllDataSources();
        
        for (const source of allSources) {
            try {
                // We don't await each one inside the loop to avoid long-running requests,
                // but we kick them off sequentially.
                 knowledgeBaseService.syncDataSource(source.tenantId, source.id);
            } catch (error) {
                console.error(`Error starting sync for source ${source.id}:`, error);
            }
        }
    })();

    return NextResponse.json({ success: true, message: "Sync process started for all applicable sources." });
}
