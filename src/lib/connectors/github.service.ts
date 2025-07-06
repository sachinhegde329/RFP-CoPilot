
/**
 * @fileOverview Connector for GitHub.
 * This service handles authentication and ingesting content from repositories,
 * such as Markdown files in a /docs folder or from a wiki.
 */

import { marked } from 'marked';
import { Octokit } from '@octokit/rest';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';
import * as cheerio from 'cheerio';

class GitHubService {

    private getClient(source: DataSource): Octokit {
        const apiToken = source.auth?.apiKey;
        if (!apiToken) {
            throw new Error("GitHub token is not configured for this source.");
        }
        return new Octokit({ auth: apiToken });
    }

    /**
     * Recursively lists all files in a GitHub repository.
     */
    async listResources(source: DataSource): Promise<any[]> {
        const repoPath = source.config?.url;
        if (!repoPath) {
            throw new Error("GitHub repository is not configured for this source.");
        }
        const [owner, repo] = repoPath.split('/');
        if (!owner || !repo) {
            throw new Error("Invalid GitHub repository format. Expected 'owner/repo'.");
        }
        const octokit = this.getClient(source);

        const { data } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: 'HEAD', // or a specific branch/commit
            recursive: '1',
        });
        
        return data.tree.filter(item => item.type === 'blob'); // 'blob' means file
    }

    /**
     * Fetches the content of a specific file from GitHub.
     */
    async fetchResource(source: DataSource, resourcePath: string): Promise<any> {
        const repoPath = source.config?.url!;
        const [owner, repo] = repoPath.split('/');
        const octokit = this.getClient(source);

        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: resourcePath,
        });

        if (Array.isArray(data) || !('content' in data)) {
            throw new Error(`Could not fetch content for path: ${resourcePath}`);
        }

        return data;
    }

    private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
        const chunks: string[] = [];
        if (!text) return chunks;
        for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    }

    async parseContent(rawContent: { content: string }): Promise<{ text: string, chunks: string[] }> {
        const markdownContent = Buffer.from(rawContent.content, 'base64').toString('utf-8');
        const html = await marked.parse(markdownContent);
        const $ = cheerio.load(html);
        const text = $('body').text().replace(/\s\s+/g, ' ').trim();
        const chunks = this.chunkText(text);
        return { text, chunks };
    }

    async sync(source: DataSource) {
        console.log(`Starting sync for GitHub source: ${source.name}`);
        await knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const files = await this.listResources(source);
        let totalItems = 0;

        for (const file of files) {
            // Only process markdown files for this example
            if (file.path && file.path.endsWith('.md')) {
                try {
                    const rawContent = await this.fetchResource(source, file.path);
                    const { chunks } = await this.parseContent(rawContent);
                    const url = `https://github.com/${source.config?.url}/blob/main/${file.path}`;
                    await knowledgeBaseService.addChunks(source.tenantId, source.id, 'github', file.path, chunks, url);
                    totalItems += chunks.length;
                } catch (error) {
                    console.error(`Skipping file ${file.path} due to error:`, error);
                }
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

export const githubService = new GitHubService();
