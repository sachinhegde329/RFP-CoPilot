
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

interface TenantData {
    sources: DataSource[];
    chunks: DocumentChunk[];
    logs: SyncLog[];
}

class KnowledgeBaseService {
  private tenantData: Record<string, TenantData> = {};

  constructor() {
    // Initialize with default data for tenants
    this.tenantData['megacorp'] = {
        sources: [
            { id: 'megacorp-source-1', tenantId: 'megacorp', type: 'document', name: 'Initial Knowledge.docx', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 2 },
            { id: 'megacorp-source-2', tenantId: 'megacorp', type: 'website', name: 'https://en.wikipedia.org/wiki/Mega-corporation', status: 'Error', lastSynced: '1 day ago', itemCount: 87 },
        ],
        chunks: [
            { id: 'default-1', tenantId: 'megacorp', sourceId: 'megacorp-source-1', title: 'Initial Knowledge', content: "RFP CoPilot is an AI-powered platform designed to streamline the Request for Proposal (RFP) response process. Its core features include AI-driven document summarization, question extraction, and draft answer generation from an internal knowledge base.", metadata: { sourceType: 'document', chunkIndex: 0 } },
            { id: 'default-2', tenantId: 'megacorp', sourceId: 'megacorp-source-1', title: 'Initial Knowledge', content: "The platform supports various compliance standards like SOC 2 and ISO 27001. All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2+.", metadata: { sourceType: 'document', chunkIndex: 1 } },
        ],
        logs: [],
    };
    this.tenantData['acme'] = {
        sources: [
            { id: 'acme-source-1', tenantId: 'acme', type: 'document', name: 'Acme Inc. Onboarding.pdf', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 1 }
        ],
        chunks: [
            { id: 'default-3', tenantId: 'acme', sourceId: 'acme-source-1', title: 'Acme Inc. Onboarding', content: 'Acme Inc. provides enterprise solutions for supply chain management. Our flagship product, "LogiStream", optimizes logistics from end to end.', metadata: { sourceType: 'document', chunkIndex: 0 } }
        ],
        logs: [],
    };
  }

  private _ensureTenantData(tenantId: string) {
    if (!this.tenantData[tenantId]) {
      this.tenantData[tenantId] = {
        sources: [],
        chunks: [],
        logs: [],
      };
    }
  }

  // == SOURCE MANAGEMENT ==
  public getAllDataSources(): DataSource[] {
    return Object.values(this.tenantData).flatMap(data => data.sources);
  }
  
  public getDataSources(tenantId: string): DataSource[] {
    const sources = this.tenantData[tenantId]?.sources || [];
    // Return a copy and sort it
    return [...sources].sort((a, b) => a.name.localeCompare(b.name));
  }

  public getDataSource(tenantId: string, sourceId: string): DataSource | undefined {
    return this.tenantData[tenantId]?.sources.find(s => s.id === sourceId);
  }

  public addDataSource(source: Omit<DataSource, 'id'>): DataSource {
    this._ensureTenantData(source.tenantId);
    const newSource: DataSource = {
      ...source,
      id: `${source.tenantId}-${source.type}-${Date.now()}`
    };
    this.tenantData[source.tenantId].sources.unshift(newSource);
    return newSource;
  }
  
  public updateDataSource(tenantId: string, sourceId: string, updates: Partial<DataSource>): DataSource | undefined {
      this._ensureTenantData(tenantId);
      const sources = this.tenantData[tenantId].sources;
      const sourceIndex = sources.findIndex(s => s.id === sourceId);
      if (sourceIndex > -1) {
          sources[sourceIndex] = { ...sources[sourceIndex], ...updates };
          return sources[sourceIndex];
      }
      return undefined;
  }

  public deleteDataSource(tenantId: string, sourceId: string): boolean {
    const tenantData = this.tenantData[tenantId];
    if (!tenantData?.sources) return false;

    const initialLength = tenantData.sources.length;
    tenantData.sources = tenantData.sources.filter(s => s.id !== sourceId);
    
    // Also delete associated chunks and logs
    this.deleteChunksBySourceId(tenantId, sourceId);
    if (tenantData.logs) {
        tenantData.logs = tenantData.logs.filter(l => l.sourceId !== sourceId);
    }

    return tenantData.sources.length < initialLength;
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
    this._ensureTenantData(tenantId);
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
    this.tenantData[tenantId].chunks.unshift(...newChunks);
  }

  public deleteChunksBySourceId(tenantId: string, sourceId:string): boolean {
    const tenantChunks = this.tenantData[tenantId]?.chunks;
    if (!tenantChunks) return false;
    
    const initialLength = tenantChunks.length;
    this.tenantData[tenantId].chunks = tenantChunks.filter(c => c.sourceId !== sourceId);
    return this.tenantData[tenantId].chunks.length < initialLength;
  }

  public async searchChunks(tenantId: string, query: string, topK = 5): Promise<DocumentChunk[]> {
    // Filter for chunks that belong to the tenant and have an embedding.
    const tenantChunks = this.tenantData[tenantId]?.chunks.filter(chunk => chunk.embedding) || [];
    
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
    this._ensureTenantData(log.tenantId);
    const newLog = {
      ...log,
      id: `${log.sourceId}-log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.tenantData[log.tenantId].logs.unshift(newLog);
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
