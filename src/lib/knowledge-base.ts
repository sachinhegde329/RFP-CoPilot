
import { embeddingService } from './embedding.service';
import { getConnectorService } from './connectors';
import { tagContent } from '@/ai/flows/tag-content-flow';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, addDoc } from 'firebase/firestore';


// NOTE: This service is now migrated to use Firestore for data persistence.
// Vector search is still simulated in-memory for this prototype.

export type DataSourceType = 'website' | 'document' | 'confluence' | 'sharepoint' | 'gdrive' | 'notion' | 'github' | 'dropbox';
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
    accessToken: string;
    refreshToken?: string;
    scope: string;
    tokenType: string;
    expiryDate: number;
  } | null;
  config?: {
    maxDepth?: number;
    maxPages?: number;
    filterKeywords?: string[];
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

function sanitizeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

class KnowledgeBaseService {
  private getSourcesCollection(tenantId: string) {
    return collection(db, 'tenants', tenantId, 'knowledge_sources');
  }

  private getChunksCollection(tenantId: string) {
    return collection(db, 'tenants', tenantId, 'knowledge_chunks');
  }

  // == SOURCE MANAGEMENT ==
  public async getAllDataSources(): Promise<DataSource[]> {
    const tenantsCollection = collection(db, 'tenants');
    const tenantsSnapshot = await getDocs(tenantsCollection);
    let allSources: DataSource[] = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
      const sourcesSnapshot = await getDocs(this.getSourcesCollection(tenantDoc.id));
      const sources = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataSource));
      allSources = allSources.concat(sources);
    }
    return sanitizeData(allSources);
  }
  
  public async getDataSources(tenantId: string): Promise<DataSource[]> {
    const sourcesSnapshot = await getDocs(this.getSourcesCollection(tenantId));
    const sources = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DataSource));
    return sanitizeData(sources.sort((a, b) => a.name.localeCompare(b.name)));
  }

  public async getDataSource(tenantId: string, sourceId: string): Promise<DataSource | undefined> {
    const sourceDoc = await getDoc(doc(this.getSourcesCollection(tenantId), sourceId));
    if (!sourceDoc.exists()) return undefined;
    return sanitizeData({ id: sourceDoc.id, ...sourceDoc.data() } as DataSource);
  }

  public async addDataSource(sourceData: Omit<DataSource, 'id'>): Promise<DataSource> {
    const { tenantId, ...rest } = sourceData;
    const newSourceRef = await addDoc(this.getSourcesCollection(tenantId), rest);
    return { id: newSourceRef.id, ...sourceData };
  }
  
  public async updateDataSource(tenantId: string, sourceId: string, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    const sourceRef = doc(this.getSourcesCollection(tenantId), sourceId);
    await updateDoc(sourceRef, updates);
    return this.getDataSource(tenantId, sourceId);
  }

  public async deleteDataSource(tenantId: string, sourceId: string): Promise<boolean> {
    await this.deleteChunksBySourceId(tenantId, sourceId);
    await deleteDoc(doc(this.getSourcesCollection(tenantId), sourceId));
    return true;
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
    if (chunks.length === 0) return;
    const chunksCollection = this.getChunksCollection(tenantId);

    const processingPromises = chunks.map(content => Promise.all([
        embeddingService.generateEmbedding(content),
        tagContent({ content })
    ]));
    const processedChunksData = await Promise.all(processingPromises);
      
    const batch = writeBatch(db);
    processedChunksData.forEach(([embedding, tagResult], index) => {
        const newChunk: Omit<DocumentChunk, 'id'> = {
            tenantId,
            sourceId,
            title,
            content: chunks[index],
            embedding: embedding,
            tags: tagResult.tags,
            metadata: { sourceType, url, chunkIndex: index, ...additionalMetadata }
        };
        const chunkRef = doc(chunksCollection);
        batch.set(chunkRef, newChunk);
    });
    await batch.commit();
  }

  public async deleteChunksBySourceId(tenantId: string, sourceId:string): Promise<boolean> {
    const q = query(this.getChunksCollection(tenantId), where('sourceId', '==', sourceId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return true;
  }

  public async searchChunks(tenantId: string, queryText: string, filters: SearchFilters = {}): Promise<DocumentChunk[]> {
    const { topK = 5, sourceTypes, tags } = filters;
    const chunksCollection = this.getChunksCollection(tenantId);

    // This is still a "fetch all then filter" approach due to Firestore's limitations for vector search.
    // In a production app with a real vector DB, this query would be much more efficient.
    const chunksSnapshot = await getDocs(chunksCollection);
    let potentialChunks = chunksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentChunk));
    
    potentialChunks = potentialChunks.filter(chunk => chunk.embedding);
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
    return sanitizeData(scoredChunks.slice(0, topK));
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
        this.updateDataSource(tenantId, source.id, {
            status: 'Error',
            lastSynced: 'Failed to sync',
        });
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
