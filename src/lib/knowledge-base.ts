
import { embeddingService } from './embedding.service';
import { getConnectorService } from './connectors';
import { tagContent } from '@/ai/flows/tag-content-flow';
import { pineconeService } from './pinecone.service';

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
  score?: number;
}

export interface SearchFilters {
    topK?: number;
    sourceTypes?: DataSourceType[];
    tags?: string[];
}

// In-memory store for demo purposes, keyed by tenantId
let inMemorySources: Record<string, DataSource[]> = {};

const initializeDemoData = (tenantId: string) => {
    if (!inMemorySources[tenantId]) {
        inMemorySources[tenantId] = [];
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

  // == CHUNK MANAGEMENT ==
  public async addChunks(tenantId: string, sourceId: string, sourceType: DataSourceType, title: string, chunks: string[], url?: string, additionalMetadata: Record<string, any> = {}) {
    initializeDemoData(tenantId);
    if (chunks.length === 0) return;

    const processingPromises = chunks.map(content => Promise.all([
        embeddingService.generateEmbedding(content),
        tagContent({ content })
    ]));
    const processedChunksData = await Promise.all(processingPromises);
      
    const newChunks: DocumentChunk[] = processedChunksData.map(([embedding, tagResult], index) => ({
      id: `chunk-${sourceId}-${index}`,
      tenantId,
      sourceId,
      title,
      content: chunks[index],
      embedding: embedding,
      tags: tagResult.tags,
      metadata: { sourceType, url, chunkIndex: index, ...additionalMetadata }
    }));

    await pineconeService.upsert(tenantId, newChunks);
  }

  public async deleteChunksBySourceId(tenantId: string, sourceId:string): Promise<boolean> {
    await pineconeService.deleteBySourceId(tenantId, sourceId);
    return true;
  }

  public async searchChunks(tenantId: string, queryText: string, filters: SearchFilters = {}): Promise<DocumentChunk[]> {
    const { topK = 5, sourceTypes, tags } = filters;
    // Note: The filter logic for sourceTypes and tags is not implemented in this version of the Pinecone integration.
    
    if (!queryText) return [];

    const queryEmbedding = await embeddingService.generateEmbedding(queryText);
    if (queryEmbedding.length === 0) return [];

    const results = await pineconeService.query(tenantId, queryEmbedding, topK);
    return results;
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
