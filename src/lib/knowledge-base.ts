
export type DataSourceType = 'website' | 'document' | 'confluence' | 'sharepoint' | 'gdrive' | 'notion' | 'github' | 'dropbox';
export type SyncStatus = 'Synced' | 'Syncing' | 'Error' | 'Pending';

/**
 * Represents a connection to an external data source for a specific tenant.
 */
export interface DataSource {
  id: string;
  tenantId: string;
  type: DataSourceType;
  name: string; // e.g., "Company Website" or "Q3 Sales Playbook.docx"
  status: SyncStatus;
  lastSynced: string;
  itemCount?: number;
  uploader?: string; // For manually uploaded documents
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

  constructor() {
    // Initialize with some default data
    const megacorpSources: DataSource[] = [
        { id: 'megacorp-source-1', tenantId: 'megacorp', type: 'document', name: 'Initial Knowledge.docx', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 2 },
        { id: 'megacorp-source-2', tenantId: 'megacorp', type: 'website', name: 'www.megacorp-public.com', status: 'Error', lastSynced: '1 day ago', itemCount: 87 },
    ];

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
  public getDataSources(tenantId: string): DataSource[] {
    return this.dataSources.filter(source => source.tenantId === tenantId).sort((a, b) => a.name.localeCompare(b.name));
  }

  public addDataSource(source: Omit<DataSource, 'id'>): DataSource {
    const newSource: DataSource = {
      ...source,
      id: `${source.tenantId}-${source.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`
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


  // == CHUNK MANAGEMENT ==
  public addChunks(tenantId: string, sourceId: string, sourceType: DataSourceType, title: string, chunks: string[], url?: string) {
    const newChunks: DocumentChunk[] = chunks.map((content, index) => ({
      id: `${sourceId}-chunk-${index}-${Date.now()}`,
      tenantId,
      sourceId,
      title,
      content,
      metadata: {
        sourceType,
        url,
        chunkIndex: index,
      }
    }));
    this.documentChunks.unshift(...newChunks);
  }

  public searchChunks(tenantId: string, query: string, topK = 5): DocumentChunk[] {
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 2));
    
    const tenantChunks = this.documentChunks.filter(chunk => chunk.tenantId === tenantId);
    
    if (tenantChunks.length === 0) return [];

    const scoredChunks = tenantChunks
      .map(chunk => {
        const chunkLower = chunk.content.toLowerCase();
        let score = 0;
        queryWords.forEach(word => {
          if (chunkLower.includes(word)) {
            score++;
          }
        });
        // Add a relevance boost for exact phrase matches
        if(chunkLower.includes(queryLower)) {
            score += 2;
        }
        return { ...chunk, score };
      })
      .filter(chunk => chunk.score > 0);
      
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK);
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
