
/**
 * @fileOverview Connector for Notion.
 * This service handles authentication and ingesting content from Notion pages and databases.
 */

import { Client } from '@notionhq/client';
import type { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';

class NotionService {
    private getClient(source: DataSource): Client {
        const apiKey = source.auth?.apiKey;
        if (!apiKey) {
            throw new Error("Notion API Key is not configured for this source.");
        }
        return new Client({ auth: apiKey });
    }

    /**
     * Lists resources (pages and databases) accessible by the integration.
     */
    async listResources(source: DataSource): Promise<(PageObjectResponse)[]> {
        const notion = this.getClient(source);
        const response = await notion.search({ filter: { value: 'page', property: 'object' } });
        return response.results as PageObjectResponse[];
    }

    /**
     * Fetches all blocks for a specific Notion page.
     */
    private async fetchAllBlocks(notion: Client, pageId: string): Promise<BlockObjectResponse[]> {
        let allBlocks: BlockObjectResponse[] = [];
        let hasMore = true;
        let startCursor: string | undefined = undefined;
        
        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: pageId,
                start_cursor: startCursor,
            });
            allBlocks = allBlocks.concat(response.results as BlockObjectResponse[]);
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }
        return allBlocks;
    }
    
    /**
     * Converts an array of Notion blocks to a single string of plain text.
     */
    private blocksToText(blocks: BlockObjectResponse[]): string {
        return blocks
            .map(block => {
                if ('type' in block && (block as any)[block.type]?.rich_text) {
                    return (block as any)[block.type].rich_text
                        .map((t: any) => t.plain_text)
                        .join('');
                }
                return '';
            })
            .join('\n\n');
    }

    private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
        const chunks: string[] = [];
        if (!text) return chunks;
        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    }

    private parseContent(page: PageObjectResponse, blocks: BlockObjectResponse[]): { title: string, chunks: string[] } {
        const pageTitle = (page.properties.title as any)?.title?.[0]?.plain_text || 'Untitled Notion Page';
        const textContent = this.blocksToText(blocks);
        const chunks = this.chunkText(textContent);
        return { title: pageTitle, chunks };
    }

    async sync(source: DataSource) {
        console.log(`Starting sync for Notion source: ${source.name}`);
        await knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);
        const notion = this.getClient(source);

        const pages = await this.listResources(source);
        let totalItems = 0;

        for (const page of pages) {
            try {
                const blocks = await this.fetchAllBlocks(notion, page.id);
                const { title, chunks } = await this.parseContent(page, blocks);
                await knowledgeBaseService.addChunks(source.tenantId, source.id, 'notion', title, chunks, page.url);
                totalItems += chunks.length;
            } catch (error) {
                console.error(`Skipping Notion page ${page.id} due to error:`, error);
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

export const notionService = new NotionService();
