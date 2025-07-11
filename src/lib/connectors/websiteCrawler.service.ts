
/**
 * @fileOverview A service to fetch, parse, and extract content from a given website URL.
 * This acts as the connector for 'website' type data sources.
 */

import { load } from 'cheerio';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import robotsParser from 'robots-parser';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const USER_AGENT = "RFPCoPilot-Crawler/1.0";

class WebsiteCrawlerService {

  /**
   * Simple text-based chunking for sections that are too long.
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
   * Performs semantic chunking on HTML content by grouping text under headings.
   * @param contentRoot A Cheerio element representing the main content area of the page.
   * @param pageTitle The title of the page, used as a fallback heading.
   * @returns An array of context-rich text chunks.
   */
  private _htmlToSemanticChunks(contentRoot: any, pageTitle: string): string[] {
    const finalChunks: string[] = [];
    let currentHeading = pageTitle;
    let currentContent = '';

    // Function to process the accumulated content for a section
    const processCurrentSection = () => {
      if (currentContent.trim()) {
        // For large sections, split them but maintain the heading context for each sub-chunk
        const sectionChunks = this.chunkText(currentContent.trim(), 450, 50); // Use a smaller size to leave room for the heading
        sectionChunks.forEach(chunk => {
            finalChunks.push(`## ${currentHeading}\n\n${chunk}`);
        });
      }
      currentContent = '';
    };

    contentRoot.children().each((i: number, el: Element) => {
        const element = contentRoot.constructor(el);
        const tagName = el.tagName.toLowerCase();

        if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
            processCurrentSection(); // Process the content gathered for the previous section
            currentHeading = element.text().trim() || currentHeading; // Start a new section with the new heading
        } else if (['p', 'li', 'pre', 'code'].includes(tagName)) {
             currentContent += element.text().trim() + '\n';
        } else if (tagName === 'table') {
            let tableText = '';
            element.find('tr').each((j: number, rowEl: Element) => {
                const rowTexts: string[] = [];
                contentRoot.constructor(rowEl).find('th, td').each((k: number, cellEl: Element) => {
                    rowTexts.push(contentRoot.constructor(cellEl).text().trim());
                });
                tableText += rowTexts.join(' | ') + '\n';
            });
            currentContent += `\n--- Table ---\n${tableText}--- End Table ---\n\n`;
        }
    });

    processCurrentSection(); // Process the last section after the loop finishes

    // If the page has no headings at all, fall back to simple chunking
    if (finalChunks.length === 0 && currentContent.trim()) {
      finalChunks.push(...this.chunkText(currentContent.trim()));
    }

    return finalChunks;
  }

  /**
   * Fetches and parses a single web page.
   * @deprecated This method is kept for backward compatibility with existing flows. New sync logic uses the `sync` method.
   */
  async ingestPage(url: string) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const html = await response.text();
      
      const $ = load(html);
      const contentRoot = $('main, article, #content, #main, .main-content').first().length > 0
        ? $('main, article, #content, #main, .main-content').first()
        : $('body');
        
      const title = $('title').text() || $('h1').first().text();
      
      const chunks = this._htmlToSemanticChunks(contentRoot, title);
      const content = chunks.join('\n\n');

      return {
        success: true,
        title: title || 'Untitled',
        content,
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
  private async _fetchAndParsePage(url: string): Promise<{ title: string; chunks: string[]; links: string[]; url: string, section: string }> {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }});
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        throw new Error(`Skipping non-HTML page: ${url}`);
      }
      const html = await response.text();
      const $ = load(html);

      const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || url;
      
      let contentRoot = $('main, article, #content, #main, .main-content').first();
      if (contentRoot.length === 0) contentRoot = $('body'); 

      const breadcrumbItems: string[] = [];
      $('nav[aria-label="breadcrumb"], .breadcrumb, [class*="breadcrumbs"]').find('li, a, span').each((i, el) => {
          const text = $(el).text().trim().replace(/>/g, '').trim();
          if (text) {
              breadcrumbItems.push(text);
          }
      });
      const section = breadcrumbItems.filter(item => item.toLowerCase() !== 'home').join(' / ');
      
      contentRoot.find('script, style, nav, footer, header, aside, form, .navbar, .footer, #sidebar, [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]').remove();
      
      const chunks = this._htmlToSemanticChunks(contentRoot, pageTitle);
      
      const links: string[] = [];
      const baseOrigin = new URL(url).origin;

      $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
              try {
                  const absoluteUrl = new URL(href, url).href.split('#')[0].split('?')[0];
                  if (new URL(absoluteUrl).origin === baseOrigin && !/\.(jpg|jpeg|png|gif|pdf|zip|css|js|svg|ico)$/i.test(absoluteUrl)) {
                      links.push(absoluteUrl);
                  }
              } catch (e) { /* ignore invalid URLs */ }
          }
      });
      const uniqueLinks = [...new Set(links)];

      return { title: pageTitle, chunks, links: uniqueLinks, url, section };
  }


  /**
   * Performs a multi-page crawl of a website based on the source configuration.
   */
  async sync(source: DataSource) {
    console.log(`Starting sync for website source: ${source.name}`);
    await knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

    const { maxDepth = 2, maxPages = 10, filterKeywords = [], scopePath = '', excludePaths = [] } = source.config || {};
    const rateLimitMs = 1000;

    const rootUrl = new URL(source.name);
    const fullScopeUrl = (rootUrl.origin + (scopePath.startsWith('/') ? '' : '/') + scopePath).replace(/\/$/, '');
    
    const robotsTxtUrl = new URL('/robots.txt', rootUrl.origin).href;
    let robots;
    try {
        const robotsTxtResponse = await fetch(robotsTxtUrl, { headers: { 'User-Agent': USER_AGENT }});
        if (robotsTxtResponse.ok) {
            const robotsTxtContent = await robotsTxtResponse.text();
            robots = robotsParser(robotsTxtUrl, robotsTxtContent);
            console.log(`Successfully parsed robots.txt for ${rootUrl.origin}`);
        } else {
             console.log(`No robots.txt found for ${rootUrl.origin}, proceeding without restrictions.`);
        }
    } catch (error) {
        console.warn(`Could not fetch or parse robots.txt for ${rootUrl.origin}:`, error);
    }

    const queue: { url: string; depth: number }[] = [];
    const visited = new Set<string>();
    let pagesCrawled = 0;
    let totalItems = 0;

    const hasKeywords = filterKeywords.length > 0;
    const matchesKeywords = (text: string): boolean => {
        if (!hasKeywords) return true;
        return filterKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
    };
    
    // Attempt to use sitemap first
    try {
        const sitemapUrl = new URL('/sitemap.xml', rootUrl.origin).href;
        console.log(`Attempting to fetch sitemap from: ${sitemapUrl}`);
        const sitemapResponse = await fetch(sitemapUrl, { headers: { 'User-Agent': USER_AGENT }});
        if (sitemapResponse.ok) {
            const sitemapText = await sitemapResponse.text();
            const $ = load(sitemapText, { xmlMode: true });
            
            $('loc').each((i, el) => {
                const sitemapLoc = $(el).text();
                try {
                   const parsedUrl = new URL(sitemapLoc);
                   if (parsedUrl.href.startsWith(fullScopeUrl) && !excludePaths.some(p => parsedUrl.pathname.startsWith(p))) {
                        if (matchesKeywords(sitemapLoc)) {
                            queue.push({ url: sitemapLoc, depth: 0 });
                            visited.add(sitemapLoc);
                        }
                   }
                } catch (e) { /* Ignore invalid URLs in sitemap */ }
            });
            console.log(`Parsed sitemap.xml, enqueued ${queue.length} URLs that match config.`);
        }
    } catch (error) {
        console.warn(`Could not fetch sitemap.xml. Falling back to root URL crawl.`);
    }

    // Always add the root/scope URL if it wasn't already in the visited set
    if (!visited.has(fullScopeUrl)) {
        queue.unshift({ url: fullScopeUrl, depth: 0 });
        visited.add(fullScopeUrl);
    }

    while (queue.length > 0 && pagesCrawled < maxPages) {
        const { url, depth } = queue.shift()!;

        if (robots && !robots.isAllowed(url, USER_AGENT)) {
            console.log(`Skipping disallowed URL by robots.txt: ${url}`);
            continue;
        }
        
        try {
            console.log(`Crawling (${pagesCrawled + 1}/${maxPages}): ${url} at depth ${depth}`);
            const pageData = await this._fetchAndParsePage(url);
            
            if (hasKeywords && !matchesKeywords(pageData.url) && !matchesKeywords(pageData.title) && !matchesKeywords(pageData.section)) {
                console.log(`Skipping page (no keyword match): ${url}`);
                continue; 
            }

            pagesCrawled++;
            
            if (pageData.chunks.length > 0) {
                await knowledgeBaseService.addChunks(source.tenantId, source.id, 'website', pageData.title, pageData.chunks, pageData.url, { section: pageData.section });
                totalItems += pageData.chunks.length;
            }

            if (depth < maxDepth) {
                for (const link of pageData.links) {
                    if (!visited.has(link) && link.startsWith(fullScopeUrl) && !excludePaths.some(p => new URL(link).pathname.startsWith(p))) {
                        visited.add(link);
                        if (matchesKeywords(link)) {
                           queue.push({ url: link, depth: depth + 1 });
                        }
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
