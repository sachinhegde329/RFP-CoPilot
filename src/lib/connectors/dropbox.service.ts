/**
 * @fileOverview Connector for Dropbox.
 * This service handles OAuth, listing files/folders, and ingesting file content.
 */

import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { parseDocument } from '@/ai/flows/parse-document';

class DropboxService {
    /**
     * Initiates the connection to Dropbox via OAuth.
     */
    async connect() {
        // TODO: This would redirect the user to the Dropbox OAuth consent screen.
        console.log("Connecting to Dropbox...");
        return Promise.resolve();
    }

    /**
     * Lists resources (files/folders) from a user's Dropbox.
     * @param source The DataSource containing auth tokens.
     * @returns A list of resources.
     */
    async listResources(source: DataSource) {
        // TODO: Use the Dropbox SDK/API to list files in a specified folder.
        // API: /files/list_folder
        console.log("Listing resources from Dropbox for source:", source.id);
        return Promise.resolve([
            { id: 'id:123', name: 'Security_Whitepaper.docx', '.tag': 'file', path_display: '/Security/Security_Whitepaper.docx' },
            { id: 'id:456', name: 'Product Docs', '.tag': 'folder' },
        ]);
    }

    /**
     * Fetches the content of a specific file from Dropbox.
     * @param source The DataSource containing auth tokens.
     * @param resourceId The ID of the file.
     * @returns The raw content of the resource (e.g., as a Buffer).
     */
    async fetchResource(source: DataSource, resourceId: string): Promise<{ fileBinary: Buffer, mimeType: string }> {
        // TODO: Use the Dropbox SDK/API to download a file.
        // API: /files/download
        // For this mock, we determine MIME type from extension.
        console.log(`Fetching Dropbox file ${resourceId} for source:`, source.id);
        const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return Promise.resolve({ fileBinary: Buffer.from("Mock DOCX file content"), mimeType });
    }

    /**
     * Parses the raw file content into clean text using the generic parseDocument flow.
     * @param rawContent The raw Buffer from fetchResource.
     * @param mimeType The MIME type of the file.
     * @returns The parsed text content and chunks.
     */
    async parseContent(fileBinary: Buffer, mimeType: string): Promise<{ text: string, chunks: string[] }> {
        const base64Data = fileBinary.toString('base64');
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        const result = await parseDocument({ documentDataUri: dataUri });
        return { text: result.text, chunks: result.chunks };
    }

    /**
     * A full sync operation for a Dropbox data source.
     */
    async sync(source: DataSource) {
        console.log(`Starting sync for Dropbox source: ${source.name}`);
        knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const resources = await this.listResources(source);
        const files = resources.filter(r => r['.tag'] === 'file');
        let totalItems = 0;

        for (const file of files) {
            const { fileBinary, mimeType } = await this.fetchResource(source, file.id);
            const { chunks } = await this.parseContent(fileBinary, mimeType);
            const url = `https://www.dropbox.com/home${file.path_display}`;
            await knowledgeBaseService.addChunks(source.tenantId, source.id, 'dropbox', file.name, chunks, url);
            totalItems += chunks.length;
        }

        knowledgeBaseService.updateDataSource(source.tenantId, source.id, { itemCount: totalItems });

        return source;
    }
}

export const dropboxService = new DropboxService();
