/**
 * @fileOverview Connector for Microsoft SharePoint.
 * This service handles OAuth, listing sites/drives/files,
 * and ingesting file content from SharePoint.
 */
import { Client } from '@microsoft/microsoft-graph-client';
import { type AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { parseDocument } from '@/ai/flows/parse-document';

class SimpleAuthProvider implements AuthenticationProvider {
    private accessToken: string;
    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }
    async getAccessToken(): Promise<string> {
        return this.accessToken;
    }
}

class SharePointService {

    private getClient(source: DataSource): Client {
        if (!source.auth?.accessToken) {
            throw new Error("SharePoint source is not authenticated.");
        }
        const authProvider = new SimpleAuthProvider(source.auth.accessToken);
        return Client.initWithMiddleware({ authProvider });
    }

    /**
     * Lists all files from all document libraries in the root SharePoint site.
     */
    async listResources(source: DataSource): Promise<any[]> {
        const graphClient = this.getClient(source);
        if (!graphClient) {
            throw new Error('Graph client could not be initialized.');
        }
        let allItems: any[] = [];
        
        // 1. Get drives (document libraries) for the root site
        const driveResponse = await graphClient.api('/sites/root/drives').get();
        let drives: any[] = driveResponse.value || [];
        
        // Filter drives if a specific driveName is provided in config
        if (source.config?.driveName) {
            const driveName = source.config.driveName;
            if (driveName) {
                drives = drives.filter((drive: any) => drive?.name?.toLowerCase() === driveName.toLowerCase());
            }
        }
        
        // 2. For each drive, list all files recursively
        for (const drive of drives) {
            try {
                let nextLink: string | undefined = `/drives/${drive?.id}/root/search(q='')?$top=100`;
                while (nextLink) {
                    const driveItems = await graphClient.api(nextLink).get();
                    const files = (driveItems.value ?? []).filter((item: any) => item.file);
                    allItems = allItems.concat(files);
                    nextLink = driveItems['@odata.nextLink'] ?? undefined;
                }
            } catch (error) {
                console.error(`Could not list items for drive ${drive?.name} (${drive?.id}). It might be empty or have access restrictions. Error:`, error);
            }
        }
        return allItems;
    }

    /**
     * Fetches the content of a specific file from SharePoint.
     */
    async fetchResource(source: DataSource, file: any): Promise<{ content: Buffer, mimeType: string }> {
        const graphClient = this.getClient(source);
        const downloadUrl = file['@microsoft.graph.downloadUrl'];
        if (!downloadUrl) {
            throw new Error(`No download URL for file ${file.name}`);
        }
        
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return { content: Buffer.from(arrayBuffer), mimeType: file.file.mimeType };
    }
    
    async parseContent(content: Buffer, mimeType: string): Promise<{ text: string, chunks: string[] }> {
        const dataUri = `data:${mimeType};base64,${content.toString('base64')}`;
        const result = await parseDocument({ documentDataUri: dataUri });
        return result;
    }

    async sync(source: DataSource) {
        console.log(`Starting sync for SharePoint source: ${source.name}`);
        await knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const files = await this.listResources(source);
        let totalItems = 0;

        for (const file of files) {
            try {
                const { content, mimeType } = await this.fetchResource(source, file);
                const { chunks } = await this.parseContent(content, mimeType);
                await knowledgeBaseService.addChunks(source.tenantId, source.id, 'sharepoint', file.name, chunks, file.webUrl);
                totalItems += chunks.length;
            } catch (error) {
                console.error(`Skipping file ${file.name} due to error:`, error);
            }
        }
        
        await knowledgeBaseService.updateDataSource(source.tenantId, source.id, {
            status: 'Synced',
            itemCount: totalItems,
            lastSynced: new Date().toLocaleDateString(),
        });
        
        return source;
    }
}

export const sharepointService = new SharePointService();
