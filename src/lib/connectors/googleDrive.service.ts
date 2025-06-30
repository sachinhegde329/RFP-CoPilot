/**
 * @fileOverview Connector for Google Drive.
 * This service handles OAuth, listing files/folders from Drive,
 * and ingesting file content.
 */

import { google } from 'googleapis';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import { parseDocument } from '@/ai/flows/parse-document';


class GoogleDriveService {

    /**
     * Returns an authenticated OAuth2 client for Google Drive API calls.
     * @param source The DataSource containing the auth tokens.
     * @returns An authenticated OAuth2 client.
     */
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

    /**
     * Lists resources (files/folders) from a user's Google Drive.
     * @param source The DataSource containing auth tokens.
     * @returns A list of resources.
     */
    async listResources(source: DataSource) {
        // const oAuth2Client = this.getOAuth2Client(source);
        // const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        // const res = await drive.files.list({ ... });
        // TODO: Implement actual API call with folder selection.
        console.log("Listing resources from Google Drive for source:", source.id);
        return Promise.resolve([
            { id: '123xyz', name: 'Q1_RFP_Responses.gdoc', mimeType: 'application/vnd.google-apps.document', webViewLink: 'https://docs.google.com/document/d/123xyz' },
            { id: '789def', name: 'Pricing.gsheet', mimeType: 'application/vnd.google-apps.spreadsheet', webViewLink: 'https://docs.google.com/spreadsheets/d/789def' },
            { id: '456abc', name: 'Security Folder', mimeType: 'application/vnd.google-apps.folder' },
        ]);
    }

    /**
     * Fetches the content of a specific file from Google Drive.
     * @param source The DataSource containing auth tokens.
     * @param file The file object from listResources.
     * @returns The raw content of the resource (e.g., exported as text or docx).
     */
    async fetchResource(source: DataSource, file: { id: string, mimeType: string }): Promise<{ content: Buffer, mimeType: string }> {
        // const oAuth2Client = this.getOAuth2Client(source);
        // const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        // For Google Docs, you would export them. For other files, you get the content directly.
        // const res = await drive.files.export({ fileId: resourceId, mimeType: 'text/plain' });
        console.log(`Fetching GDrive file ${file.id} for source:`, source.id);
        
        let exportMimeType;
        if (file.mimeType === 'application/vnd.google-apps.document') {
            exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
             exportMimeType = 'application/pdf'; // Default fallback
        }

        return Promise.resolve({ content: Buffer.from("Mock file content from Google Drive."), mimeType: exportMimeType });
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
     * A full sync operation for a Google Drive data source.
     */
    async sync(source: DataSource) {
        console.log(`Starting sync for Google Drive source: ${source.name}`);
        knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const resources = await this.listResources(source);
        const files = resources.filter(r => r.mimeType !== 'application/vnd.google-apps.folder');
        let totalItems = 0;

        for (const file of files) {
            const { content, mimeType } = await this.fetchResource(source, file);
            const { chunks } = await this.parseContent(content, mimeType);
            await knowledgeBaseService.addChunks(source.tenantId, source.id, 'gdrive', file.name, chunks, file.webViewLink);
            totalItems += chunks.length;
        }

        knowledgeBaseService.updateDataSource(source.tenantId, source.id, { itemCount: totalItems });

        return source;
    }
}

export const googleDriveService = new GoogleDriveService();
