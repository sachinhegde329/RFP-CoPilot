
import { embeddingService } from './embedding.service';
import { websiteCrawlerService } from './connectors/websiteCrawler.service';

export type DataSourceType = 'website' | 'document' | 'confluence' | 'sharepoint' | 'gdrive' | 'notion' | 'github' | 'dropbox';
export type SyncStatus = 'Synced' | 'Syncing' | 'Error' | 'Pending';

/**
 * Represents a connection to an external data source for a specific tenant.
 */
export interface DataSource {
  id: string;
  tenantId: string;
  type: DataSourceType;
  name: string;
  status: SyncStatus;
  lastSynced: string;
  itemCount?: number;
  uploader?: string; // For manually uploaded documents
  auth?: {
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenType: string;
    expiryDate: number;
  } | null;
}

/**
 * A chunk of content extracted from a data source, ready for embedding.
 */
export interface DocumentChunk {
  id: string;
  tenantId: string;
  sourceId: string; // Foreign key to DataSource
  title: string; // e.g., page title or document name
  content: string;
  embedding?: number[]; // Vector representation of the content
  metadata: {
    sourceType: DataSourceType;
    url?: string; // URL for websites or external sources
    [key: string]: any;
  };
}

/**
 * A log entry for a synchronization event.
 */
export interface SyncLog {
    id: string;
    sourceId: string;
    tenantId: string;
    timestamp: string;
    status: 'Success' | 'Failure' | 'InProgress';
    message: string;
    itemsProcessed: number;
}


class KnowledgeBaseService {
  private documentChunks: DocumentChunk[] = [];
  private dataSources: DataSource[] = [];
  private syncLogs: SyncLog[] = [];

  constructor() {
    // Initialize with some default data
    const megacorpSources: DataSource[] = [
        { id: 'megacorp-source-1', tenantId: 'megacorp', type: 'document', name: 'Initial Knowledge.docx', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 2 },
        { id: 'megacorp-source-2', tenantId: 'megacorp', type: 'website', name: 'https://en.wikipedia.org/wiki/Mega-corporation', status: 'Error', lastSynced: '1 day ago', itemCount: 87 },
    ];

    // NOTE: Initial chunks do not have embeddings and will not be found by semantic search.
    // Only content added at runtime will be embedded and searchable.
    const megacorpChunks: DocumentChunk[] = [
        { id: 'default-1', tenantId: 'megacorp', sourceId: 'megacorp-source-1', title: 'Initial Knowledge', content: "RFP CoPilot is an AI-powered platform designed to streamline the Request for Proposal (RFP) response process. Its core features include AI-driven document summarization, question extraction, and draft answer generation from an internal knowledge base.", metadata: { sourceType: 'document', chunkIndex: 0 } },
        { id: 'default-2', tenantId: 'megacorp', sourceId: 'megacorp-source-1', title: 'Initial Knowledge', content: "The platform supports various compliance standards like SOC 2 and ISO 27001. All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2+.", metadata: { sourceType: 'document', chunkIndex: 1 } },
    ];
    
    const acmeSources: DataSource[] = [
        { id: 'acme-source-1', tenantId: 'acme', type: 'document', name: 'Acme Inc. Onboarding.pdf', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 1 }
    ];
    const acmeChunks: DocumentChunk[] = [
        { id: 'default-3', tenantId: 'acme', sourceId: 'acme-source-1', title: 'Acme Inc. Onboarding', content: 'Acme Inc. provides enterprise solutions for supply chain management. Our flagship product, "LogiStream", optimizes logistics from end to end.', metadata: { sourceType: 'document', chunkIndex: 0 } }
    ];

    this.dataSources.push(...megacorpSources, ...acmeSources);
    this.documentChunks.push(...megacorpChunks, ...acmeChunks);
  }

  // == SOURCE MANAGEMENT ==
  public getAllDataSources(): DataSource[] {
    return this.dataSources;
  }
  
  public getDataSources(tenantId: string): DataSource[] {
    return this.dataSources.filter(source => source.tenantId === tenantId).sort((a, b) => a.name.localeCompare(b.name));
  }

  public getDataSource(tenantId: string, sourceId: string): DataSource | undefined {
    return this.dataSources.find(s => s.id === sourceId && s.tenantId === tenantId);
  }

  public addDataSource(source: Omit<DataSource, 'id'>): DataSource {
    const newSource: DataSource = {
      ...source,
      id: `${source.tenantId}-${source.type}-${Date.now()}`
    };
    this.dataSources.unshift(newSource);
    return newSource;
  }
  
  public updateDataSource(tenantId: string, sourceId: string, updates: Partial<DataSource>): DataSource | undefined {
      const sourceIndex = this.dataSources.findIndex(s => s.id === sourceId && s.tenantId === tenantId);
      if (sourceIndex > -1) {
          this.dataSources[sourceIndex] = { ...this.dataSources[sourceIndex], ...updates };
          return this.dataSources[sourceIndex];
      }
      return undefined;
  }

  public deleteDataSource(tenantId: string, sourceId: string): boolean {
    const initialLength = this.dataSources.length;
    this.dataSources = this.dataSources.filter(s => !(s.id === sourceId && s.tenantId === tenantId));
    // Also delete associated chunks
    this.documentChunks = this.documentChunks.filter(c => !(c.sourceId === sourceId && c.tenantId === tenantId));
    return this.dataSources.length < initialLength;
  }

  /**
   * Calculates the cosine similarity between two vectors.
   * @param vecA The first vector.
   * @param vecB The second vector.
   * @returns The cosine similarity score (0 to 1).
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    const divisor = Math.sqrt(normA) * Math.sqrt(normB);
    if (divisor === 0) {
        return 0;
    }

    return dotProduct / divisor;
  }


  // == CHUNK MANAGEMENT ==
  public async addChunks(tenantId: string, sourceId: string, sourceType: DataSourceType, title: string, chunks: string[], url?: string) {
    // Generate embeddings for all chunks in parallel for efficiency
    const chunkEmbeddings = await Promise.all(
        chunks.map(content => embeddingService.generateEmbedding(content))
    );
      
    const newChunks: DocumentChunk[] = chunks.map((content, index) => ({
      id: `${sourceId}-chunk-${index}-${Date.now()}`,
      tenantId,
      sourceId,
      title,
      content,
      embedding: chunkEmbeddings[index], // Store the generated embedding
      metadata: {
        sourceType,
        url,
        chunkIndex: index,
      }
    }));
    this.documentChunks.unshift(...newChunks);
  }

  public deleteChunksBySourceId(tenantId: string, sourceId:string): boolean {
    const initialLength = this.documentChunks.length;
    this.documentChunks = this.documentChunks.filter(c => !(c.sourceId === sourceId && c.tenantId === tenantId));
    return this.documentChunks.length < initialLength;
  }

  public async searchChunks(tenantId: string, query: string, topK = 5): Promise<DocumentChunk[]> {
    // Filter for chunks that belong to the tenant and have an embedding.
    const tenantChunks = this.documentChunks.filter(chunk => chunk.tenantId === tenantId && chunk.embedding);
    
    if (tenantChunks.length === 0 || !query) {
        return [];
    }
    
    // Generate an embedding for the user's query.
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    if (queryEmbedding.length === 0) {
        return [];
    }
    
    // Calculate the similarity score for each chunk.
    const scoredChunks = tenantChunks.map(chunk => ({
        ...chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));
    
    // Sort chunks by score in descending order.
    scoredChunks.sort((a, b) => b.score - a.score);

    // Return the top K most similar chunks.
    return scoredChunks.slice(0, topK);
  }

  // == SYNCING & LOGGING ==
  
  private async _addSyncLog(log: Omit<SyncLog, 'id' | 'timestamp'>) {
    const newLog = {
      ...log,
      id: `${log.sourceId}-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.syncLogs.unshift(newLog);
  }

  private async _syncWebsiteSource(source: DataSource) {
     // Clear old chunks before syncing
     this.deleteChunksBySourceId(source.tenantId, source.id);

     const ingestResult = await websiteCrawlerService.ingestPage(source.name); // source.name holds the URL
     if (ingestResult.success) {
         await this.addChunks(source.tenantId, source.id, 'website', ingestResult.title || source.name, ingestResult.chunks, ingestResult.url);
         this.updateDataSource(source.tenantId, source.id, {
             status: 'Synced',
             lastSynced: new Date().toLocaleDateString(),
             itemCount: ingestResult.chunks.length,
             name: ingestResult.title || source.name,
         });
         return { itemsProcessed: ingestResult.chunks.length };
     } else {
          throw new Error(ingestResult.error || 'Unknown ingestion error');
     }
  }

  public async syncDataSource(tenantId: string, sourceId: string) {
    const source = this.getDataSource(tenantId, sourceId);
    if (!source) {
      console.error(`syncDataSource failed: Source not found for id ${sourceId}`);
      return;
    }
    
    await this._addSyncLog({
        tenantId,
        sourceId,
        status: 'InProgress',
        message: `Sync started for ${source.name}`,
        itemsProcessed: 0,
    });

    try {
        let result: { itemsProcessed: number } | undefined;
        switch(source.type) {
            case 'website':
                result = await this._syncWebsiteSource(source);
                break;
            // TODO: Add cases for other source types like 'gdrive', 'sharepoint' etc.
            default:
                throw new Error(`Syncing for source type "${source.type}" is not yet implemented.`);
        }
        
        await this._addSyncLog({
            tenantId,
            sourceId,
            status: 'Success',
            message: 'Sync completed successfully.',
            itemsProcessed: result?.itemsProcessed || 0,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
        console.error(`Failed to sync source ${source.name}:`, error);
        this.updateDataSource(tenantId, source.id, {
            status: 'Error',
            lastSynced: 'Failed to sync',
        });
        await this._addSyncLog({
            tenantId,
            sourceId,
            status: 'Failure',
            message: errorMessage,
            itemsProcessed: 0,
        });
    }
  }

}

export const knowledgeBaseService = new KnowledgeBaseService();
