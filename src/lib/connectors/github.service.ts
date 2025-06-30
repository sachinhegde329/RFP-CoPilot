/**
 * @fileOverview Connector for GitHub.
 * This service handles authentication and ingesting content from repositories,
 * such as Markdown files in a /docs folder or from a wiki.
 */

import { marked } from 'marked';
import type { DataSource } from '@/lib/knowledge-base';
import { knowledgeBaseService } from '@/lib/knowledge-base';


class GitHubService {
    /**
     * Initiates the connection to GitHub, likely via a GitHub App or PAT.
     */
    async connect() {
        // TODO: Implement GitHub App authentication or PAT flow.
        console.log("Connecting to GitHub...");
        return Promise.resolve();
    }

    /**
     * Lists resources (e.g., Markdown files) from a GitHub repository.
     * @param source The DataSource containing auth tokens and repo config.
     * @returns A list of resources.
     */
    async listResources(source: DataSource) {
        // TODO: Use the GitHub REST API (@octokit/rest) to list files in a directory.
        // API: /repos/{owner}/{repo}/contents/{path}
        console.log("Listing resources from GitHub for source:", source.id);
        return Promise.resolve([
            { path: 'docs/README.md', name: 'README.md', type: 'file', html_url: 'https://github.com/user/repo/blob/main/docs/README.md' },
            { path: 'docs/security.md', name: 'security.md', type: 'file', html_url: 'https://github.com/user/repo/blob/main/docs/security.md' },
        ]);
    }

    /**
     * Fetches the content of a specific file from GitHub.
     * @param source The DataSource containing auth tokens.
     * @param resourcePath The path to the file in the repository.
     * @returns The raw content of the resource (decoded from base64).
     */
    async fetchResource(source: DataSource, resourcePath: string): Promise<any> {
        // TODO: Use the GitHub API to get the content of a file.
        // The content will be base64 encoded.
        console.log(`Fetching GitHub file ${resourcePath} for source:`, source.id);
        const mockContent = Buffer.from("# Mock Markdown\n\nThis is content from a GitHub file.").toString('base64');
        return Promise.resolve({ content: mockContent });
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
     * Parses the raw file content from GitHub into clean text and chunks.
     * @param rawContent The raw content object from fetchResource.
     * @returns The cleaned text content.
     */
    async parseContent(rawContent: { content: string }): Promise<{ text: string, chunks: string[] }> {
        // Content is base64 encoded, so it needs to be decoded first.
        const markdownContent = Buffer.from(rawContent.content, 'base64').toString('utf-8');
        // Convert Markdown to plain text for chunking
        const html = await marked.parse(markdownContent);
        const text = html.replace(/<[^>]*>?/gm, ''); // Basic stripping
        const chunks = this.chunkText(text);
        return { text, chunks };
    }

    /**
     * A full sync operation for a GitHub data source.
     */
    async sync(source: DataSource) {
        console.log(`Starting sync for GitHub source: ${source.name}`);
        knowledgeBaseService.deleteChunksBySourceId(source.tenantId, source.id);

        const resources = await this.listResources(source);
        const files = resources.filter(r => r.type === 'file');
        let totalItems = 0;

        for (const file of files) {
            const rawContent = await this.fetchResource(source, file.path);
            const { chunks } = await this.parseContent(rawContent);
            await knowledgeBaseService.addChunks(source.tenantId, source.id, 'github', file.name, chunks, file.html_url);
            totalItems += chunks.length;
        }

        knowledgeBaseService.updateDataSource(source.tenantId, source.id, { itemCount: totalItems });
        
        return source;
    }
}

export const githubService = new GitHubService();
