/**
 * @fileOverview Connector for Notion.
 * This service handles authentication and ingesting content from Notion pages and databases.
 */

import { Client } from '@notionhq/client';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';

// A mock to simulate the Notion API block structure
const mockNotionBlocks = [
    { type: 'heading_1', heading_1: { rich_text: [{ plain_text: 'Engineering Wiki Main Page' }] } },
    { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'This is the central hub for all engineering documentation. Please refer to the sections below for more information on our development practices, security protocols, and architecture guidelines.' }] } },
    { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Security Protocols' }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'All data is encrypted at rest using AES-256.' }] } },
];


class NotionService {
    /**
     * Returns an authenticated Notion client.
     * @param source The DataSource containing the Notion integration token.
     * @returns An authenticated Notion client instance.
     */
    private getClient(source: DataSource) {
        if (!source.auth?.accessToken) {
            throw new Error("Notion source is not authenticated with an integration token.");
        }
        return new Client({ auth: source.auth.accessToken });
    }

    /**
     * Lists resources (e.g., pages, databases) accessible by the integration.
     * @param source The DataSource containing auth tokens.
     * @returns A list of resources.
     */
    async listResources(source: DataSource) {
        // const notion = this.getClient(source);
        // const response = await notion.search({});
        // TODO: Implement actual API call to list pages/databases.
        console.log("Listing resources from Notion for source:", source.id);
        return Promise.resolve([
            { id: 'page-1', object: 'page', 'url': 'https://www.notion.so/page-1' },
            { id: 'db-1', object: 'database', 'url': 'https://www.notion.so/db-1' },
        ]);
    }

    /**
     * Fetches the content (blocks) of a specific Notion page.
     * @param source The DataSource containing auth tokens.
     * @param resourceId The ID of the Notion page.
     * @returns The list of blocks from the page.
     */
    async fetchResource(source: DataSource, resourceId: string): Promise<any> {
        // const notion = this.getClient(source);
        // const response = await notion.blocks.children.list({ block_id: resourceId });
        console.log(`Fetching Notion page ${resourceId} for source:`, source.id);
        const pageInfo = await this.listResources(source).then(res => res.find(r => r.id === resourceId));
        return Promise.resolve({
            id: resourceId,
            title: 'Engineering Wiki Main Page',
            url: pageInfo?.url,
            blocks: mockNotionBlocks,
        });
    }

    /**
     * Simple chunking function to split text into smaller pieces.
     */
    private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
        const chunks: string[] = [];
        if (!text) return chunks;

        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    }
    
    /**
     * Parses a list of Notion blocks into a single string of clean text and then into chunks.
     * @param blocks The array of blocks from the Notion API.
     * @returns The concatenated text content.
     */
    private parseContent(pageContent: any): { title: string, text: string, chunks: string[], url?: string } {
        // This is a complex task. A real implementation would recursively walk the block
        // tree and convert each block type (paragraph, heading, bullet list, etc.) to text.
        const text = pageContent.blocks.map((block: any) => {
            const blockType = block.type;
            if (block[blockType]?.rich_text?.[0]?.plain_text) {
                return block[blockType].rich_text[0].plain_text;
            }
            return '';
        }).join('\n\n');

        const chunks = this.chunkText(text);
        return { title: pageContent.title, text, chunks, url: pageContent.url };
    }

    /**
     * A full sync operation for a Notion data source.
     */
    async sync(source: DataSource) {
        console.log(`Starting sync for Notion source: ${source.name}`);
        knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const resources = await this.listResources(source);
        const pages = resources.filter(r => r.object === 'page');
        let totalItems = 0;

        for (const page of pages) {
            const pageContent = await this.fetchResource(source, page.id);
            const { title, chunks, url } = this.parseContent(pageContent);
            await knowledgeBaseService.addChunks(source.tenantId, source.id, 'notion', title, chunks, url);
            totalItems += chunks.length;
        }

        knowledgeBaseService.updateDataSource(source.tenantId, source.id, { itemCount: totalItems });
        
        return source;
    }
}

export const notionService = new NotionService();
