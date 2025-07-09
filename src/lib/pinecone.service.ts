import { Pinecone } from '@pinecone-database/pinecone';
import type { DocumentChunk } from './knowledge-base';

class PineconeService {
    private pinecone: Pinecone | null = null;
    private indexName = 'rfp-copilot-index';

    constructor() {
        if (!process.env.PINECONE_API_KEY) {
            console.warn("PINECONE_API_KEY not set. Pinecone service will be disabled.");
            return;
        }
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }

    private async getIndex() {
        if (!this.pinecone) {
            throw new Error("Pinecone client not initialized.");
        }

        const indexList = await this.pinecone.listIndexes();
        if (!indexList.indexes?.some(index => index.name === this.indexName)) {
            console.log(`Creating Pinecone index: ${this.indexName}`);
            await this.pinecone.createIndex({
                name: this.indexName,
                dimension: 768, // Dimension for text-embedding-004
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
        }
        return this.pinecone.index(this.indexName);
    }

    async upsert(tenantId: string, chunks: DocumentChunk[]) {
        if (!this.pinecone || chunks.length === 0) return;
        
        const index = await this.getIndex();
        const namespace = index.namespace(tenantId);

        const vectors = chunks.map(chunk => ({
            id: chunk.id,
            values: chunk.embedding!,
            metadata: {
                sourceId: chunk.sourceId,
                sourceType: chunk.metadata.sourceType,
                title: chunk.title,
                content: chunk.content, // Store content in metadata for retrieval
                url: chunk.metadata.url || '',
                tags: chunk.tags || [],
            }
        }));

        // Upsert in batches of 100
        for (let i = 0; i < vectors.length; i += 100) {
            const batch = vectors.slice(i, i + 100);
            await namespace.upsert(batch);
        }
    }

    async query(tenantId: string, embedding: number[], topK: number, filter?: any): Promise<DocumentChunk[]> {
        if (!this.pinecone) return [];
        const index = await this.getIndex();
        const namespace = index.namespace(tenantId);

        const queryResult = await namespace.query({
            vector: embedding,
            topK,
            filter,
            includeMetadata: true,
        });

        if (!queryResult.matches) return [];

        return queryResult.matches.map(match => ({
            id: match.id,
            tenantId,
            score: match.score, // Include the similarity score
            sourceId: (match.metadata as any)?.sourceId || '',
            title: (match.metadata as any)?.title || '',
            content: (match.metadata as any)?.content || '',
            embedding: match.values,
            tags: (match.metadata as any)?.tags || [],
            metadata: {
                sourceType: (match.metadata as any)?.sourceType,
                url: (match.metadata as any)?.url,
            },
        }));
    }

    async deleteBySourceId(tenantId: string, sourceId: string) {
        if (!this.pinecone) return;
        const index = await this.getIndex();
        const namespace = index.namespace(tenantId);
        
        await namespace.deleteMany({ sourceId });
    }
    
    async deleteAllFromNamespace(tenantId: string) {
        if (!this.pinecone) return;
        const index = await this.getIndex();
        const namespace = index.namespace(tenantId);
        await namespace.deleteAll();
    }
}

export const pineconeService = new PineconeService();
