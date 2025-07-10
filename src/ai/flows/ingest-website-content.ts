'use server';

/**
 * @fileOverview A flow to fetch, parse, and extract content from a given website URL.
 * @deprecated This flow's logic has been moved to `src/lib/connectors/websiteCrawler.service.ts`.
 * This file is kept for historical purposes and will be removed. New code should use the service directly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { websiteCrawlerService } from '@/lib/connectors/websiteCrawler.service';


const IngestWebsiteContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the website to ingest.'),
});
export type IngestWebsiteContentInput = z.infer<typeof IngestWebsiteContentInputSchema>;

const IngestWebsiteContentOutputSchema = z.object({
  title: z.string().describe('The title of the web page.'),
  content: z.string().describe('The cleaned main text content of the web page.'),
  chunks: z.array(z.string()).describe('An array of text chunks extracted from the page.'),
  url: z.string().url().describe('The original URL.'),
});
export type IngestWebsiteContentOutput = z.infer<typeof IngestWebsiteContentOutputSchema>;

export async function ingestWebsiteContent(input: IngestWebsiteContentInput): Promise<IngestWebsiteContentOutput> {
  return ingestWebsiteContentFlow(input);
}


const ingestWebsiteContentFlow = ai.defineFlow(
  {
    name: 'ingestWebsiteContentFlow',
    inputSchema: IngestWebsiteContentInputSchema,
    outputSchema: IngestWebsiteContentOutputSchema,
  },
  async ({ url }) => {
    const result = await websiteCrawlerService.ingestPage(url);
    if (!result.success) {
      throw new Error(result.error || `Failed to ingest content from URL: ${url}`);
    }
    return {
      title: result.title || 'Untitled',
      content: result.content || '',
      chunks: result.chunks || [],
      url: result.url || url,
    }
  }
);
