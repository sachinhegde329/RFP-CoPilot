
import { embeddingService } from './embedding.service';
import { getConnectorService } from './connectors';
import { tagContent } from '@/ai/flows/tag-content-flow';
import { pineconeService } from './pinecone.service';
import { secretsService } from './secrets.service';
import { uploadToWasabi, getFromWasabi } from './wasabi.service';
import InfisicalClient from 'infisical-node';

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
  // This is a reference to the secret in Infisical, not the raw token.
  secretPath?: string;
  // Populated at runtime for sync jobs, but never persisted.
  auth?: {
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
    tokenType?: string;
    expiryDate?: number;
    apiKey?: string;
    username?: string;
  } | null;
  config?: {
    maxDepth?: number;
    maxPages?: number;
    filterKeywords?: string[];
    scopePath?: string;
    excludePaths?: string[];
    url?: string;
    folderId?: string;
    path?: string;
    driveName?: string;
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

// In-memory store for demo purposes, keyed by tenantId (orgId)
let inMemorySources: Record<string, DataSource[]> = {};

const initializeDemoData = (tenantId: string) => {
    if (!inMemorySources[tenantId]) {
        inMemorySources[tenantId] = [];
    }
}

// Utility to get an Infisical client (token should be set in env or securely fetched)
function getInfisicalClient() {
  return new InfisicalClient({ token: process.env.INFISICAL_TOKEN! });
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
    const { tenantId, auth, ...rest } = sourceData;
    initializeDemoData(tenantId);
    
    // Create the source object first to generate an ID
    const newSource: DataSource = { 
        id: `source-${Date.now()}-${Math.random()}`, 
        tenantId,
        ...rest 
    };

    // If auth data is provided, securely store it and get the reference path.
    if (auth) {
        newSource.secretPath = await secretsService.createOrUpdateSecret(tenantId, newSource.id, auth);
    }
    
    // Store the source object in-memory (without the raw auth object).
    if (!inMemorySources[tenantId]) {
        inMemorySources[tenantId] = [];
    }
    inMemorySources[tenantId].push(newSource);
    
    return newSource;
  }
  
  public async updateDataSource(tenantId: string, sourceId: string, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    initializeDemoData(tenantId);
    const tenantSources = inMemorySources[tenantId];
    if (tenantSources) {
      const sourceIndex = tenantSources.findIndex(s => s.id === sourceId);
      if (sourceIndex > -1) {
        
        // If auth data is being updated, store it securely.
        if (updates.auth) {
            const secretPath = await secretsService.createOrUpdateSecret(tenantId, sourceId, updates.auth);
            tenantSources[sourceIndex].secretPath = secretPath;
            // IMPORTANT: Remove the raw auth data from the updates object to avoid storing it in-memory.
            delete updates.auth;
        }

        tenantSources[sourceIndex] = { ...tenantSources[sourceIndex], ...updates };
        return tenantSources[sourceIndex];
      }
    }
    return undefined;
  }

  public async deleteDataSource(tenantId: string, sourceId: string): Promise<boolean> {
    initializeDemoData(tenantId);
    const source = await this.getDataSource(tenantId, sourceId);
    if (!source) return false;

    // Delete associated vectors and secrets first
    await pineconeService.deleteBySourceId(tenantId, sourceId);
    if(source.secretPath) {
        await secretsService.deleteSecret(tenantId, sourceId);
    }
    
    const tenantSources = inMemorySources[tenantId];
    const initialLength = tenantSources.length;
    inMemorySources[tenantId] = tenantSources.filter(s => s.id !== sourceId);
    return inMemorySources[tenantId].length < initialLength;
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

    // Upload each chunk to Wasabi and store the key
    const newChunks: DocumentChunk[] = await Promise.all(processedChunksData.map(async ([embedding, tagResult], index) => {
      const wasabiKey = `kb/${tenantId}/${sourceId}/${Date.now()}-${index}.txt`;
      await uploadToWasabi(wasabiKey, chunks[index], 'text/plain');
      return {
        id: `chunk-${sourceId}-${index}`,
        tenantId,
        sourceId,
        title,
        content: '', // Content is now in Wasabi, not stored here
        embedding: embedding,
        tags: tagResult.tags,
        metadata: { sourceType, url, chunkIndex: index, wasabiKey, ...additionalMetadata }
      };
    }));

    await pineconeService.upsert(tenantId, newChunks);
  }

  // Helper to fetch chunk content from Wasabi
  public async getChunkContentFromWasabi(wasabiKey: string): Promise<string> {
    const obj = await getFromWasabi(wasabiKey);
    // Node.js: stream to string
    if (obj.Body && typeof obj.Body.transformToString === 'function') {
      return await obj.Body.transformToString();
    }
    // Fallback: try to read as Buffer
    if (obj.Body && typeof obj.Body === 'object' && 'toString' in obj.Body) {
      return obj.Body.toString();
    }
    return '';
  }

  public async deleteChunksBySourceId(tenantId: string, sourceId:string): Promise<boolean> {
    await pineconeService.deleteBySourceId(tenantId, sourceId);
    return true;
  }

  public async searchChunks(tenantId: string, queryText: string, filters: SearchFilters = {}): Promise<DocumentChunk[]> {
    const { topK = 5, sourceTypes, tags } = filters;
    
    if (!queryText) return [];

    const queryEmbedding = await embeddingService.generateEmbedding(queryText);
    if (queryEmbedding.length === 0) return [];

    const pineconeFilter: any = {};
    if (sourceTypes && sourceTypes.length > 0) {
        pineconeFilter.sourceType = { '$in': sourceTypes };
    }
    if (tags && tags.length > 0) {
        pineconeFilter.tags = { '$in': tags };
    }

    const results = await pineconeService.query(
        tenantId, 
        queryEmbedding, 
        topK,
        Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined
    );
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
        // If the source has a secret path, fetch the credentials before syncing.
        if (source.secretPath) {
            source.auth = await secretsService.getSecret(tenantId, sourceId);
        }

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

  // Store customer integration secret in Infisical and save only the secretPath in Supabase
  public async saveIntegrationSecret(tenantId: string, sourceId: string, integrationType: string, secretObj: Record<string, any>): Promise<string> {
    const secretPath = `/integrations/${tenantId}/${integrationType}/${sourceId}`;
    const client = getInfisicalClient();
    await client.createSecret(secretPath, JSON.stringify(secretObj));
    return secretPath;
  }

  // Fetch customer integration secret from Infisical
  public async getIntegrationSecret(secretPath: string): Promise<Record<string, any> | null> {
    const client = getInfisicalClient();
    const secret = await client.getSecret(secretPath);
    if (secret && secret.secretValue) {
      return JSON.parse(secret.secretValue);
    }
    return null;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
