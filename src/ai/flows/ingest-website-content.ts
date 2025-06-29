'use server';

/**
 * @fileOverview A flow to fetch, parse, and extract content from a given website URL.
 *
 * - ingestWebsiteContent - A function that handles the website ingestion process.
 * - IngestWebsiteContentInput - The input type for the ingestWebsiteContent function.
 * - IngestWebsiteContentOutput - The return type for the ingestWebsiteContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';

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

// Simple chunking function
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = [];
    if (!text) return chunks;

    for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}


const ingestWebsiteContentFlow = ai.defineFlow(
  {
    name: 'ingestWebsiteContentFlow',
    inputSchema: IngestWebsiteContentInputSchema,
    outputSchema: IngestWebsiteContentOutputSchema,
  },
  async ({ url }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();
      
      const $ = cheerio.load(html);

      // Remove common non-content elements
      $('script, style, nav, footer, header, aside, .navbar, .footer, #sidebar').remove();

      const title = $('title').text() || $('h1').first().text();
      
      // Replace block elements with newlines for better formatting
      $('br, p, h1, h2, h3, h4, h5, h6, li, blockquote, pre').after('\n');

      const content = $('body').text();

      // Clean up whitespace
      const cleanedContent = content.replace(/\s\s+/g, ' ').trim();

      const chunks = chunkText(cleanedContent);

      return {
        title: title || 'Untitled',
        content: cleanedContent,
        chunks,
        url,
      };
    } catch (error) {
      console.error(`Error ingesting website content from ${url}:`, error);
      throw new Error(`Failed to ingest content from URL: ${url}`);
    }
  }
);
