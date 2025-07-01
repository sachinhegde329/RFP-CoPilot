/**
 * @fileOverview A service to fetch, parse, and extract content from a given website URL.
 * This acts as the connector for 'website' type data sources.
 */

import * as cheerio from 'cheerio';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import robotsParser from 'robots-parser';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const USER_AGENT = "RFPCoPilot-Crawler/1.0";

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
   * @deprecated This method is kept for backward compatibility with existing flows. New sync logic uses the `sync` method.
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

  /**
   * Private helper to fetch and parse a page for the new sync method.
   */
  private async _fetchAndParsePage(url: string): Promise<{ title: string, content: string, links: string[], url: string }> {
      const response = await fetch(url);
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        throw new Error(`Skipping non-HTML page: ${url}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('title').text() || $('h1').first().text() || url;
      $('script, style, nav, footer, header, aside, .navbar, .footer, #sidebar').remove();
      $('br, p, h1, h2, h3, h4, h5, h6, li, blockquote, pre').after('\n');
      const content = $('body').text().replace(/\s\s+/g, ' ').trim();
      
      const links: string[] = [];
      const baseOrigin = new URL(url).origin;
      $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
              try {
                  const absoluteUrl = new URL(href, url).href.split('#')[0];
                  if (new URL(absoluteUrl).origin === baseOrigin) {
                      links.push(absoluteUrl);
                  }
              } catch (e) { /* ignore invalid URLs */ }
          }
      });
      const uniqueLinks = [...new Set(links)];

      return { title, content, links: uniqueLinks, url };
  }

  /**
   * Performs a multi-page crawl of a website based on the source configuration.
   * @param source The DataSource containing the root URL and crawl configuration.
   */
  async sync(source: DataSource) {
    console.log(`Starting sync for website source: ${source.name}`);
    await knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

    const { maxDepth = 2, maxPages = 10 } = source.config || {};
    const rateLimitMs = 1000; // 1 req/sec

    // Fetch and parse robots.txt
    const rootUrl = new URL(source.name);
    const robotsTxtUrl = new URL('/robots.txt', rootUrl.origin).href;
    let robots;
    try {
        const robotsTxtResponse = await fetch(robotsTxtUrl);
        if (robotsTxtResponse.ok) {
            const robotsTxtContent = await robotsTxtResponse.text();
            robots = robotsParser(robotsTxtUrl, robotsTxtContent);
            console.log(`Successfully parsed robots.txt for ${rootUrl.origin}`);
        } else {
             console.log(`No robots.txt found or accessible for ${rootUrl.origin}, proceeding without restrictions.`);
        }
    } catch (error) {
        console.warn(`Could not fetch or parse robots.txt for ${rootUrl.origin}:`, error);
    }

    const queue: { url: string; depth: number }[] = [{ url: source.name, depth: 0 }];
    const visited = new Set<string>();
    let pagesCrawled = 0;
    let totalItems = 0;

    while (queue.length > 0 && pagesCrawled < maxPages) {
        const { url, depth } = queue.shift()!;

        if (visited.has(url)) {
            continue;
        }

        visited.add(url);

        // Respect robots.txt
        if (robots && !robots.isAllowed(url, USER_AGENT)) {
            console.log(`Skipping disallowed URL by robots.txt: ${url}`);
            continue;
        }
        
        try {
            console.log(`Crawling (${pagesCrawled + 1}/${maxPages}): ${url} at depth ${depth}`);
            const pageData = await this._fetchAndParsePage(url);
            pagesCrawled++;

            const chunks = this.chunkText(pageData.content);
            
            if (chunks.length > 0) {
                await knowledgeBaseService.addChunks(source.tenantId, source.id, 'website', pageData.title, chunks, pageData.url);
                totalItems += chunks.length;
            }

            if (depth < maxDepth) {
                for (const link of pageData.links) {
                    if (!visited.has(link)) {
                        queue.push({ url: link, depth: depth + 1 });
                    }
                }
            }

        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error);
        }

        await sleep(rateLimitMs);
    }
    
    knowledgeBaseService.updateDataSource(source.tenantId, source.id, {
        status: 'Synced',
        itemCount: totalItems,
        lastSynced: new Date().toLocaleDateString(),
    });

    console.log(`Finished sync for ${source.name}. Crawled ${pagesCrawled} pages, found ${totalItems} chunks.`);
    return source;
  }
}

export const websiteCrawlerService = new WebsiteCrawlerService();
