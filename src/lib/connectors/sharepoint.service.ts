/**
 * @fileOverview Connector for Microsoft SharePoint.
 * This service handles OAuth, listing sites/drives/files,
 * and ingesting file content from SharePoint.
 */

import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { parseDocument } from '@/ai/flows/parse-document';
// To use the Microsoft Graph client, you would initialize it like this:
// import { Client } from '@microsoft/microsoft-graph-client';
// import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';


class SharePointService {
    /**
     * Initiates the connection to SharePoint via Microsoft Graph OAuth.
     */
    async connect() {
        // This is handled by the /api/auth/microsoft/initiate route.
        console.log("Connecting to SharePoint...");
        return Promise.resolve();
    }

    /**
     * Lists resources (e.g., document libraries, files) from SharePoint.
     * @param source The DataSource containing auth tokens.
     * @returns A list of resources.
     */
    async listResources(source: DataSource) {
        // TODO: Use the Microsoft Graph API to list sites, drives, and files.
        // API: /sites, /sites/{site-id}/drives, /drives/{drive-id}/root/children
        console.log("Listing resources from SharePoint for source:", source.id);
        return Promise.resolve([
            { id: 'item-123', name: 'Compliance Overview.docx', webUrl: 'https://tenant.sharepoint.com/sites/compliance/...' },
            { id: 'item-456', name: 'Sales & Marketing Assets', folder: {} },
        ]);
    }

    /**
     * Fetches the content of a specific file from SharePoint.
     * @param source The DataSource containing auth tokens.
     * @param resourceId The ID of the file (drive item).
     * @returns The raw content of the resource.
     */
    async fetchResource(source: DataSource, resourceId: string): Promise<{ content: Buffer, mimeType: string }> {
        // TODO: Use the Microsoft Graph API to download a file.
        // API: /drives/{drive-id}/items/{item-id}/content
        console.log(`Fetching SharePoint file ${resourceId} for source:`, source.id);
        const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return Promise.resolve({ content: Buffer.from("Mock file content from SharePoint."), mimeType });
    }
    
    /**
     * Parses the raw file content into clean text and chunks.
     */
    async parseContent(content: Buffer, mimeType: string): Promise<{ text: string, chunks: string[] }> {
        const dataUri = `data:${mimeType};base64,${content.toString('base64')}`;
        const result = await parseDocument({ documentDataUri: dataUri });
        return result;
    }

    /**
     * A full sync operation for a SharePoint data source.
     */
    async sync(source: DataSource) {
        console.log(`Starting sync for SharePoint source: ${source.name}`);
        knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const resources = await this.listResources(source);
        const files = resources.filter(r => !r.folder);
        let totalItems = 0;

        for (const file of files) {
            const { content, mimeType } = await this.fetchResource(source, file.id);
            const { chunks } = await this.parseContent(content, mimeType);
            await knowledgeBaseService.addChunks(source.tenantId, source.id, 'sharepoint', file.name, chunks, file.webUrl);
            totalItems += chunks.length;
        }

        knowledgeBaseService.updateDataSource(source.tenantId, source.id, { itemCount: totalItems });
        
        return source;
    }
}

export const sharepointService = new SharePointService();
