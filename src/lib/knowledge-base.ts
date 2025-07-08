
import { embeddingService } from './embedding.service';
import { getConnectorService } from './connectors';
import { tagContent } from '@/ai/flows/tag-content-flow';

// NOTE: With Firebase removed, this service now uses a temporary in-memory store.
// Data will NOT persist across server restarts or be shared across requests.

export type DataSourceType = 'website' | 'document' | 'confluence' | 'sharepoint' | 'gdrive' | 'notion' | 'github' | 'dropbox' | 'highspot' | 'showpad' | 'seismic' | 'mindtickle' | 'enableus';
export type SyncStatus = 'Synced' | 'Syncing' | 'Error' | 'Pending';

export interface DataSource {
  id: string;
  tenantId: string;
  type: DataSourceType;
  name: string;
  status: SyncStatus;
  lastSynced: string;
  itemCount?: number;
  uploader?: string; 
  auth?: {
    // OAuth specific
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
    tokenType?: string;
    expiryDate?: number;
    // API Key/Token specific
    apiKey?: string;
    username?: string;
  } | null;
  config?: {
    // Website crawler specific
    maxDepth?: number;
    maxPages?: number;
    filterKeywords?: string[];
    scopePath?: string;
    excludePaths?: string[];
    // For other connectors
    url?: string; // e.g., Confluence URL, GitHub repo (owner/repo)
    folderId?: string; // e.g., Google Drive folder ID
    path?: string; // e.g., Dropbox folder path
    driveName?: string; // e.g., SharePoint drive name
  };
}

export interface DocumentChunk {
  id: string;
  tenantId: string;
  sourceId: string;
  title: string; 
  content: string;
  embedding?: number[];
  tags?: string[]; 
  metadata: {
    sourceType: DataSourceType;
    url?: string;
    [key: string]: any;
  };
}

export interface SearchFilters {
    topK?: number;
    sourceTypes?: DataSourceType[];
    tags?: string[];
}

// In-memory store for demo purposes, keyed by tenantId (orgId)
let inMemorySources: Record<string, DataSource[]> = {};
let inMemoryChunks: Record<string, DocumentChunk[]> = {};

const initializeDemoData = (tenantId: string) => {
    if (!inMemorySources[tenantId]) {
        inMemorySources[tenantId] = [];
        inMemoryChunks[tenantId] = [];
    }
}

class KnowledgeBaseService {

  // == SOURCE MANAGEMENT ==
  public async getAllDataSources(): Promise<DataSource[]> {
    return Object.values(inMemorySources).flat();
  }
  
  public async getDataSources(tenantId: string): Promise<DataSource[]> {
    initializeDemoData(tenantId);
    return (inMemorySources[tenantId] || []).sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getDataSource(tenantId: string, sourceId: string): Promise<DataSource | undefined> {
    initializeDemoData(tenantId);
    const tenantSources = inMemorySources[tenantId] || [];
    return tenantSources.find(s => s.id === sourceId);
  }

  public async addDataSource(sourceData: Omit<DataSource, 'id'>): Promise<DataSource> {
    const { tenantId } = sourceData;
    initializeDemoData(tenantId);
    if (!inMemorySources[tenantId]) {
        inMemorySources[tenantId] = [];
    }
    const newSource = { id: `source-${Date.now()}-${Math.random()}`, ...sourceData };
    inMemorySources[tenantId].push(newSource);
    return newSource;
  }
  
  public async updateDataSource(tenantId: string, sourceId: string, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    initializeDemoData(tenantId);
    const tenantSources = inMemorySources[tenantId];
    if (tenantSources) {
      const sourceIndex = tenantSources.findIndex(s => s.id === sourceId);
      if (sourceIndex > -1) {
        tenantSources[sourceIndex] = { ...tenantSources[sourceIndex], ...updates };
        return tenantSources[sourceIndex];
      }
    }
    return undefined;
  }

  public async deleteDataSource(tenantId: string, sourceId: string): Promise<boolean> {
    initializeDemoData(tenantId);
    await this.deleteChunksBySourceId(tenantId, sourceId);
    
    const tenantSources = inMemorySources[tenantId];
    if (tenantSources) {
      const initialLength = tenantSources.length;
      inMemorySources[tenantId] = tenantSources.filter(s => s.id !== sourceId);
      return inMemorySources[tenantId].length < initialLength;
    }
    return false;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const divisor = Math.sqrt(normA) * Math.sqrt(normB);
    return divisor === 0 ? 0 : dotProduct / divisor;
  }


  // == CHUNK MANAGEMENT ==
  public async addChunks(tenantId: string, sourceId: string, sourceType: DataSourceType, title: string, chunks: string[], url?: string, additionalMetadata: Record<string, any> = {}) {
    initializeDemoData(tenantId);
    if (chunks.length === 0) return;
    if (!inMemoryChunks[tenantId]) {
        inMemoryChunks[tenantId] = [];
    }

    const processingPromises = chunks.map(content => Promise.all([
        embeddingService.generateEmbedding(content),
        tagContent({ content })
    ]));
    const processedChunksData = await Promise.all(processingPromises);
      
    processedChunksData.forEach(([embedding, tagResult], index) => {
        const newChunk: DocumentChunk = {
            id: `chunk-${Date.now()}-${index}`,
            tenantId,
            sourceId,
            title,
            content: chunks[index],
            embedding: embedding,
            tags: tagResult.tags,
            metadata: { sourceType, url, chunkIndex: index, ...additionalMetadata }
        };
        inMemoryChunks[tenantId].push(newChunk);
    });
  }

  public async deleteChunksBySourceId(tenantId: string, sourceId:string): Promise<boolean> {
    initializeDemoData(tenantId);
    const tenantChunks = inMemoryChunks[tenantId];
    if (!tenantChunks) return false;

    const initialLength = tenantChunks.length;
    inMemoryChunks[tenantId] = tenantChunks.filter(c => c.sourceId !== sourceId);
    return inMemoryChunks[tenantId].length < initialLength;
  }

  public async searchChunks(tenantId: string, queryText: string, filters: SearchFilters = {}): Promise<DocumentChunk[]> {
    initializeDemoData(tenantId);
    const { topK = 5, sourceTypes, tags } = filters;
    let potentialChunks = inMemoryChunks[tenantId] || [];
    
    if (potentialChunks.length === 0 || !queryText) return [];

    if (sourceTypes && sourceTypes.length > 0) {
        potentialChunks = potentialChunks.filter(chunk => sourceTypes.includes(chunk.metadata.sourceType));
    }
    if (tags && tags.length > 0) {
        const lowerCaseTags = tags.map(t => t.toLowerCase());
        potentialChunks = potentialChunks.filter(chunk => 
            chunk.tags?.some(tag => lowerCaseTags.includes(tag.toLowerCase()))
        );
    }
    
    const queryEmbedding = await embeddingService.generateEmbedding(queryText);
    if (queryEmbedding.length === 0) return [];
    
    const scoredChunks = potentialChunks.map(chunk => ({
        ...chunk,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));
    
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  }

  // == SYNCING & LOGGING ==
  public async syncDataSource(tenantId: string, sourceId: string) {
    const source = await this.getDataSource(tenantId, sourceId);
    if (!source) {
      console.error(`syncDataSource failed: Source not found for id ${sourceId}`);
      return;
    }
    
    try {
        const connector = getConnectorService(source.type);
        await connector.sync(source);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
        console.error(`Failed to sync source ${source.name}:`, error);
        await this.updateDataSource(tenantId, source.id, {
            status: 'Error',
            lastSynced: 'Failed to sync',
        });
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();

    