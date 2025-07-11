/**
 * @fileOverview Connector for Google Drive.
 * This service handles OAuth, listing files/folders from Drive,
 * and ingesting file content.
 */

import { google, type drive_v3 } from 'googleapis';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { parseDocument } from '@/ai/flows/parse-document';
import type { GaxiosResponse } from 'gaxios';


class GoogleDriveService {

    private getOAuth2Client(source: DataSource) {
        if (!source.auth) {
            throw new Error("Google Drive source is not authenticated.");
        }
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
        );
        oAuth2Client.setCredentials({
            access_token: source.auth.accessToken,
            refresh_token: source.auth.refreshToken,
            scope: source.auth.scope,
            token_type: source.auth.tokenType,
            expiry_date: source.auth.expiryDate,
        });
        return oAuth2Client;
    }

    async listResources(source: DataSource): Promise<drive_v3.Schema$File[]> {
        const oAuth2Client = this.getOAuth2Client(source);
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        
        let allFiles: drive_v3.Schema$File[] = [];
        let pageToken: string | undefined = undefined;

        const folderId = source.config?.folderId;
        const query = folderId 
            ? `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`
            : "mimeType != 'application/vnd.google-apps.folder'";

        do {
            const res: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
                q: query,
                fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
                spaces: 'drive',
                pageToken: pageToken,
                pageSize: 100,
            });
            if (res.data.files) {
                allFiles = allFiles.concat(res.data.files);
            }
            pageToken = res.data.nextPageToken || undefined;
        } while (pageToken);

        return allFiles;
    }

    async fetchResource(source: DataSource, file: drive_v3.Schema$File): Promise<{ content: Buffer, mimeType: string } | null> {
        if (!file.id || !file.mimeType) return null;

        const oAuth2Client = this.getOAuth2Client(source);
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        
        // Handle Google Workspace docs (Docs, Sheets, Slides) by exporting them
        if (file.mimeType.includes('google-apps')) {
            let exportMimeType = 'application/pdf'; // Default fallback
            if (file.mimeType === 'application/vnd.google-apps.document') {
                exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
                exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
                exportMimeType = 'application/pdf'; // Export presentations as PDF
            }
            
            const res = await drive.files.export({ fileId: file.id, mimeType: exportMimeType }, { responseType: 'arraybuffer' });
            return { content: Buffer.from(res.data as ArrayBuffer), mimeType: exportMimeType };
        } 
        // Handle other file types (PDF, DOCX, etc.) by downloading them directly
        else {
            const res = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
            return { content: Buffer.from(res.data as ArrayBuffer), mimeType: file.mimeType };
        }
    }

    async parseContent(content: Buffer, mimeType: string): Promise<{ text: string, chunks: string[] }> {
        const dataUri = `data:${mimeType};base64,${content.toString('base64')}`;
        const result = await parseDocument({ documentDataUri: dataUri });
        return result;
    }
    
    async sync(source: DataSource) {
        console.log(`Starting sync for Google Drive source: ${source.name}`);
        await knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const files = await this.listResources(source);
        let totalItems = 0;

        for (const file of files) {
            try {
                const resource = await this.fetchResource(source, file);
                if (resource) {
                    const { chunks } = await this.parseContent(resource.content, resource.mimeType);
                    await knowledgeBaseService.addChunks(source.tenantId, source.id, 'gdrive', file.name!, chunks, file.webViewLink || undefined);
                    totalItems += chunks.length;
                }
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

export const googleDriveService = new GoogleDriveService();
