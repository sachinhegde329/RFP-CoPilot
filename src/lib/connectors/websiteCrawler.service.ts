/**
 * @fileOverview A service to fetch, parse, and extract content from a given website URL.
 * This acts as the connector for 'website' type data sources.
 */

import * as cheerio from 'cheerio';
import type { DataSource } from '@/lib/knowledge-base';

class WebsiteCrawlerService {

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
   * Fetches and parses a single web page.
   * In a full implementation, this would be the core of the crawler that gets called
   * for each discovered URL.
   * @param url The URL of the web page to ingest.
   * @returns An object with the title, cleaned content, and text chunks.
   */
  async ingestPage(url: string) {
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

      const chunks = this.chunkText(cleanedContent);

      return {
        success: true,
        title: title || 'Untitled',
        content: cleanedContent,
        chunks,
        url,
      };
    } catch (error) {
      console.error(`Error ingesting website content from ${url}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  }
}

export const websiteCrawlerService = new WebsiteCrawlerService();
