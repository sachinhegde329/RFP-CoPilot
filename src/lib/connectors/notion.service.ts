/**
 * @fileOverview Connector for Notion.
 * This service handles authentication and ingesting content from Notion pages and databases.
 */

import { Client } from '@notionhq/client';
import type { DataSource } from '@/lib/knowledge-base';

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
            { id: 'page-1', name: 'Engineering Wiki' },
            { id: 'db-1', name: 'Product Roadmaps' },
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
        return Promise.resolve({
            results: [{ type: 'heading_1', heading_1: { rich_text: [{ plain_text: 'Title' }] } }]
        });
    }
    
    /**
     * Parses a list of Notion blocks into a single string of clean text.
     * @param blocks The array of blocks from the Notion API.
     * @returns The concatenated text content.
     */
    private parseBlocksToText(blocks: any[]): string {
        // This is a complex task. A real implementation would recursively walk the block
        // tree and convert each block type (paragraph, heading, bullet list, etc.) to text.
        return blocks.map(block => {
            const blockType = block.type;
            if (block[blockType]?.rich_text?.[0]?.plain_text) {
                return block[blockType].rich_text[0].plain_text;
            }
            return '';
        }).join('\n');
    }

    /**
     * A full sync operation for a Notion data source.
     */
    async sync(source: DataSource) {
        console.log(`Starting sync for Notion source: ${source.name}`);
        // 1. List pages/databases.
        // 2. For each page, fetch its blocks.
        // 3. Convert the block tree to clean text.
        // 4. Chunk and store in the knowledge base.
        // 5. Update source status.
        return source;
    }
}

export const notionService = new NotionService();
