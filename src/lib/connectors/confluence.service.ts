/**
 * @fileOverview Connector for Confluence Cloud.
 * This service will handle authentication, listing spaces/pages,
 * and ingesting content from Confluence.
 */
import * as cheerio from 'cheerio';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';

class ConfluenceService {

    private getAuthHeaders(): HeadersInit {
        const { CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN } = process.env;
        if (!CONFLUENCE_USERNAME || !CONFLUENCE_API_TOKEN) {
            throw new Error("Confluence credentials are not configured in .env file.");
        }
        const encoded = Buffer.from(`${CONFLUENCE_USERNAME}:${CONFLUENCE_API_TOKEN}`).toString('base64');
        return {
            'Authorization': `Basic ${encoded}`,
            'Accept': 'application/json',
        };
    }
    
    /**
     * Lists all pages from all spaces in Confluence.
     * @returns A list of page resources.
     */
    async listResources(source: DataSource): Promise<any[]> {
        const { CONFLUENCE_URL } = process.env;
        if (!CONFLUENCE_URL) {
            throw new Error("Confluence URL is not configured in .env file.");
        }

        let allPages: any[] = [];
        let nextUrl: string | null = `${CONFLUENCE_URL}/wiki/rest/api/content?type=page&limit=50&expand=space`;

        while (nextUrl) {
            const response = await fetch(nextUrl, { headers: this.getAuthHeaders() });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to list Confluence resources: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            allPages = allPages.concat(data.results);
            nextUrl = data._links.next ? `${CONFLUENCE_URL}${data._links.next}` : null;
        }

        return allPages;
    }

    /**
     * Fetches the content of a specific page from Confluence.
     * @param resourceId The ID of the Confluence page.
     * @returns The raw content of the resource.
     */
    async fetchResource(source: DataSource, resourceId: string): Promise<any> {
        const { CONFLUENCE_URL } = process.env;
        const url = `${CONFLUENCE_URL}/wiki/rest/api/content/${resourceId}?expand=body.storage`;
        const response = await fetch(url, { headers: this.getAuthHeaders() });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Confluence page ${resourceId}: ${response.status} ${errorText}`);
        }
        
        return response.json();
    }

    private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
        const chunks: string[] = [];
        if (!text) return chunks;
        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    }

    parseContent(rawContent: any): { title: string, text: string, chunks: string[], url?: string } {
        const { CONFLUENCE_URL } = process.env;
        const storageValue = rawContent.body?.storage?.value || '';
        const $ = cheerio.load(storageValue);
        $('br, p, h1, h2, h3, h4, h5, h6, li, blockquote, pre').after('\n');
        const text = $('body').text().replace(/\s\s+/g, ' ').trim();
        const chunks = this.chunkText(text);
        const url = rawContent._links?.webui ? `${CONFLUENCE_URL}/wiki${rawContent._links.webui}` : undefined;
        return { title: rawContent.title, text, chunks, url };
    }

    async sync(source: DataSource) {
        console.log(`Starting sync for Confluence source: ${source.name}`);
        knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const pages = await this.listResources(source);
        let totalItems = 0;

        for (const page of pages) {
            const rawContent = await this.fetchResource(source, page.id);
            const { title, chunks, url } = this.parseContent(rawContent);
            await knowledgeBaseService.addChunks(source.tenantId, source.id, 'confluence', title, chunks, url);
            totalItems += chunks.length;
        }

        knowledgeBaseService.updateDataSource(source.tenantId, source.id, {
            status: 'Synced',
            itemCount: totalItems,
            lastSynced: new Date().toLocaleDateString(),
        });
        
        return source;
    }
}

export const confluenceService = new ConfluenceService();
