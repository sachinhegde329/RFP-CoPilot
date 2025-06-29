
'use server';

export interface KnowledgeChunk {
  id: string;
  tenantId: string;
  sourceType: 'website' | 'document';
  sourceName: string; // e.g., file name or website URL
  content: string;
}

class KnowledgeBaseService {
  private chunks: KnowledgeChunk[] = [];

  constructor() {
    this.chunks.push({
      id: 'default-1',
      tenantId: 'megacorp',
      sourceType: 'document',
      sourceName: 'Initial Knowledge',
      content: "RFP CoPilot is an AI-powered platform designed to streamline the Request for Proposal (RFP) response process. Its core features include AI-driven document summarization, question extraction, and draft answer generation from an internal knowledge base.",
    }, {
      id: 'default-2',
      tenantId: 'megacorp',
      sourceType: 'document',
      sourceName: 'Initial Knowledge',
      content: "The platform supports various compliance standards like SOC 2 and ISO 27001. All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2+.",
    },
    {
      id: 'default-3',
      tenantId: 'acme',
      sourceType: 'document',
      sourceName: 'Acme Inc. Onboarding',
      content: 'Acme Inc. provides enterprise solutions for supply chain management. Our flagship product, "LogiStream", optimizes logistics from end to end.'
    });
  }

  public addChunks(tenantId: string, sourceType: 'website' | 'document', sourceName:string, chunks: string[]) {
    const newChunks: KnowledgeChunk[] = chunks.map((content, index) => ({
      id: `${tenantId}-${sourceName}-${index}-${Date.now()}`,
      tenantId,
      sourceType,
      sourceName,
      content,
    }));
    this.chunks.unshift(...newChunks);
  }

  public searchChunks(tenantId: string, query: string, topK = 5): KnowledgeChunk[] {
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 2));
    
    const scoredChunks = this.chunks
      .filter(chunk => chunk.tenantId === tenantId)
      .map(chunk => {
        const chunkLower = chunk.content.toLowerCase();
        let score = 0;
        queryWords.forEach(word => {
          if (chunkLower.includes(word)) {
            score++;
          }
        });
        return { ...chunk, score };
      })
      .filter(chunk => chunk.score > 0);
      
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK);
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
