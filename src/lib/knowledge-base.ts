
export interface KnowledgeChunk {
  id: string;
  tenantId: string;
  sourceId: string; // Link back to the source
  sourceType: 'website' | 'document';
  sourceName: string; // e.g., file name or website URL
  content: string;
}

export type SourceStatus = 'Synced' | 'Syncing' | 'Error' | 'Pending';

export interface KnowledgeSource {
  id: string;
  tenantId: string;
  type: 'website' | 'document';
  name: string;
  status: SourceStatus;
  lastSynced: string;
  // For documents, uploader might be useful
  uploader?: string; 
  // For websites, docsSynced is less relevant, maybe pagesCrawled
  itemCount?: number; 
}


class KnowledgeBaseService {
  private chunks: KnowledgeChunk[] = [];
  private sources: KnowledgeSource[] = [];

  constructor() {
    // Initialize with some default data
    const megacorpSources: KnowledgeSource[] = [
        { id: 'megacorp-source-1', tenantId: 'megacorp', type: 'document', name: 'Initial Knowledge.docx', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 2 },
        { id: 'megacorp-source-2', tenantId: 'megacorp', type: 'website', name: 'www.megacorp-public.com', status: 'Error', lastSynced: '1 day ago', itemCount: 87 },
    ];

    const megacorpChunks: KnowledgeChunk[] = [
        { id: 'default-1', tenantId: 'megacorp', sourceId: 'megacorp-source-1', sourceType: 'document', sourceName: 'Initial Knowledge', content: "RFP CoPilot is an AI-powered platform designed to streamline the Request for Proposal (RFP) response process. Its core features include AI-driven document summarization, question extraction, and draft answer generation from an internal knowledge base." },
        { id: 'default-2', tenantId: 'megacorp', sourceId: 'megacorp-source-1', sourceType: 'document', sourceName: 'Initial Knowledge', content: "The platform supports various compliance standards like SOC 2 and ISO 27001. All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2+." },
    ];
    
    const acmeSources: KnowledgeSource[] = [
        { id: 'acme-source-1', tenantId: 'acme', type: 'document', name: 'Acme Inc. Onboarding.pdf', status: 'Synced', lastSynced: 'Initial Setup', uploader: 'System', itemCount: 1 }
    ];
    const acmeChunks: KnowledgeChunk[] = [
        { id: 'default-3', tenantId: 'acme', sourceId: 'acme-source-1', sourceType: 'document', sourceName: 'Acme Inc. Onboarding', content: 'Acme Inc. provides enterprise solutions for supply chain management. Our flagship product, "LogiStream", optimizes logistics from end to end.' }
    ];

    this.sources.push(...megacorpSources, ...acmeSources);
    this.chunks.push(...megacorpChunks, ...acmeChunks);
  }

  // == SOURCE MANAGEMENT ==
  public getSources(tenantId: string): KnowledgeSource[] {
    return this.sources.filter(source => source.tenantId === tenantId).sort((a, b) => a.name.localeCompare(b.name));
  }

  public addSource(source: Omit<KnowledgeSource, 'id'>): KnowledgeSource {
    const newSource: KnowledgeSource = {
      ...source,
      id: `${source.tenantId}-${source.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`
    };
    this.sources.unshift(newSource);
    return newSource;
  }
  
  public updateSource(tenantId: string, sourceId: string, updates: Partial<KnowledgeSource>): KnowledgeSource | undefined {
      const sourceIndex = this.sources.findIndex(s => s.id === sourceId && s.tenantId === tenantId);
      if (sourceIndex > -1) {
          this.sources[sourceIndex] = { ...this.sources[sourceIndex], ...updates };
          return this.sources[sourceIndex];
      }
      return undefined;
  }

  public deleteSource(tenantId: string, sourceId: string): boolean {
    const initialLength = this.sources.length;
    this.sources = this.sources.filter(s => !(s.id === sourceId && s.tenantId === tenantId));
    // Also delete associated chunks
    this.chunks = this.chunks.filter(c => !(c.sourceId === sourceId && c.tenantId === tenantId));
    return this.sources.length < initialLength;
  }


  // == CHUNK MANAGEMENT ==
  public addChunks(tenantId: string, sourceId: string, sourceType: 'website' | 'document', sourceName:string, chunks: string[]) {
    const newChunks: KnowledgeChunk[] = chunks.map((content, index) => ({
      id: `${sourceId}-${index}-${Date.now()}`,
      tenantId,
      sourceId,
      sourceType,
      sourceName,
      content,
    }));
    this.chunks.unshift(...newChunks);
  }

  public searchChunks(tenantId: string, query: string, topK = 5): KnowledgeChunk[] {
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 2));
    
    const tenantChunks = this.chunks.filter(chunk => chunk.tenantId === tenantId);
    
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
