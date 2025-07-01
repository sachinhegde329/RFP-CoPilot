/**
 * @fileOverview Connector for Dropbox.
 * This service handles OAuth, listing files/folders, and ingesting file content.
 */

import { Dropbox } from 'dropbox';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { parseDocument } from '@/ai/flows/parse-document';

class DropboxService {
    
    private getClient(source: DataSource): Dropbox {
        if (!source.auth?.accessToken) {
            throw new Error("Dropbox source is not authenticated.");
        }
        return new Dropbox({ accessToken: source.auth.accessToken });
    }

    /**
     * Lists resources (files/folders) from a user's Dropbox.
     * @param source The DataSource containing auth tokens.
     * @returns A list of resources.
     */
    async listResources(source: DataSource): Promise<any[]> {
        const dbx = this.getClient(source);
        let allFiles: any[] = [];
        let hasMore = true;
        let cursor: string | undefined = undefined;

        while (hasMore) {
            const response = await (cursor ? dbx.filesListFolderContinue({ cursor }) : dbx.filesListFolder({ path: '', recursive: true, limit: 100 }));
            const files = response.result.entries.filter(entry => entry['.tag'] === 'file');
            allFiles = allFiles.concat(files);
            hasMore = response.result.has_more;
            cursor = response.result.cursor;
        }
        
        return allFiles;
    }

    /**
     * Fetches the content of a specific file from Dropbox.
     * @param source The DataSource containing auth tokens.
     * @param resourcePath The path of the file.
     * @returns The raw content of the resource (e.g., as a Buffer).
     */
    async fetchResource(source: DataSource, resourcePath: string): Promise<{ fileBinary: Buffer, mimeType: string }> {
        const dbx = this.getClient(source);
        const response: any = await dbx.filesDownload({ path: resourcePath });
        const fileBinary = response.result.fileBinary;
        
        // This is a simplification; a real app might use a library like 'mime-types'
        const ext = resourcePath.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === 'pdf') mimeType = 'application/pdf';
        if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (ext === 'md' || ext === 'txt') mimeType = 'text/plain';
        if (ext === 'html') mimeType = 'text/html';

        return { fileBinary, mimeType };
    }

    /**
     * Parses the raw file content into clean text using the generic parseDocument flow.
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

        const files = await this.listResources(source);
        let totalItems = 0;

        for (const file of files) {
            try {
                const { fileBinary, mimeType } = await this.fetchResource(source, file.path_display);
                const { chunks } = await this.parseContent(fileBinary, mimeType);
                await knowledgeBaseService.addChunks(source.tenantId, source.id, 'dropbox', file.name, chunks, `https://www.dropbox.com/home${file.path_display}`);
                totalItems += chunks.length;
            } catch (error) {
                console.error(`Skipping file ${file.name} due to error:`, error);
            }
        }
        
        knowledgeBaseService.updateDataSource(source.tenantId, source.id, {
            status: 'Synced',
            itemCount: totalItems,
            lastSynced: new Date().toLocaleDateString(),
        });

        return source;
    }
}

export const dropboxService = new DropboxService();
