import { supabase, supabaseAdmin, type Database } from './supabase';
import type { Tenant, TeamMember } from './tenant-types';
import type { RFP, Question, RfpStatus } from './rfp-types';
import type { DataSource, DocumentChunk } from './knowledge-base';

type TenantRow = Database['public']['Tables']['tenants']['Row'];
type RfpRow = Database['public']['Tables']['rfps']['Row'];
type QuestionRow = Database['public']['Tables']['questions']['Row'];
type DataSourceRow = Database['public']['Tables']['data_sources']['Row'];
type DocumentChunkRow = Database['public']['Tables']['document_chunks']['Row'];

class SupabaseService {
  // ===== TENANT OPERATIONS =====
  
  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .single();
    
    if (error || !data) return null;
    
    return this.mapTenantRowToTenant(data);
  }

  async createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .insert([{
        subdomain: tenant.subdomain,
        name: tenant.name,
        onboarding_completed: tenant.onboardingCompleted,
        plan: tenant.plan,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return this.mapTenantRowToTenant(data);
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        name: updates.name,
        onboarding_completed: updates.onboardingCompleted,
        plan: updates.plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapTenantRowToTenant(data);
  }

  // ===== RFP OPERATIONS =====
  
  async getRfps(tenantId: string): Promise<RFP[]> {
    const { data, error } = await supabase
      .from('rfps')
      .select(`
        *,
        questions (*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(row => this.mapRfpRowToRfp(row));
  }

  async getRfp(id: string): Promise<RFP | null> {
    const { data, error } = await supabase
      .from('rfps')
      .select(`
        *,
        questions (*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return this.mapRfpRowToRfp(data);
  }

  async createRfp(rfp: Omit<RFP, 'id'>): Promise<RFP> {
    const { data, error } = await supabase
      .from('rfps')
      .insert([{
        tenant_id: rfp.tenantId,
        name: rfp.name,
        status: rfp.status,
        topics: rfp.topics,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return this.mapRfpRowToRfp(data);
  }

  async updateRfp(id: string, updates: Partial<RFP>): Promise<RFP> {
    const { data, error } = await supabase
      .from('rfps')
      .update({
        name: updates.name,
        status: updates.status,
        topics: updates.topics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapRfpRowToRfp(data);
  }

  async deleteRfp(id: string): Promise<void> {
    const { error } = await supabase
      .from('rfps')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ===== QUESTION OPERATIONS =====
  
  async getQuestions(rfpId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('rfp_id', rfpId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data.map(row => this.mapQuestionRowToQuestion(row));
  }

  async createQuestion(question: Omit<Question, 'id'> & { rfpId: string }): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert([{
        rfp_id: question.rfpId,
        question: question.question,
        answer: question.answer,
        category: question.category,
        tags: question.tags,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return this.mapQuestionRowToQuestion(data);
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update({
        question: updates.question,
        answer: updates.answer,
        category: updates.category,
        tags: updates.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapQuestionRowToQuestion(data);
  }

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ===== DATA SOURCE OPERATIONS =====
  
  async getDataSources(tenantId: string): Promise<DataSource[]> {
    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(row => this.mapDataSourceRowToDataSource(row));
  }

  async createDataSource(source: Omit<DataSource, 'id'>): Promise<DataSource> {
    const { data, error } = await supabase
      .from('data_sources')
      .insert([{
        tenant_id: source.tenantId,
        type: source.type,
        name: source.name,
        status: source.status,
        last_synced: source.lastSynced,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return this.mapDataSourceRowToDataSource(data);
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource> {
    const { data, error } = await supabase
      .from('data_sources')
      .update({
        name: updates.name,
        status: updates.status,
        last_synced: updates.lastSynced,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapDataSourceRowToDataSource(data);
  }

  async deleteDataSource(id: string): Promise<void> {
    const { error } = await supabase
      .from('data_sources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ===== DOCUMENT CHUNK OPERATIONS =====
  
  async addDocumentChunks(chunks: Omit<DocumentChunk, 'id'>[]): Promise<void> {
    if (chunks.length === 0) return;
    
    const { error } = await supabase
      .from('document_chunks')
      .insert(chunks.map(chunk => ({
        tenant_id: chunk.tenantId,
        source_id: chunk.sourceId,
        title: chunk.title,
        content: chunk.content,
        embedding: chunk.embedding,
        tags: chunk.tags,
        metadata: chunk.metadata,
      })));
    
    if (error) throw error;
  }

  async searchDocumentChunks(
    tenantId: string, 
    queryEmbedding: number[], 
    topK: number = 5,
    filters?: { sourceTypes?: string[], tags?: string[] }
  ): Promise<DocumentChunk[]> {
    // For vector similarity search, you'll need to use pgvector
    // This is a simplified version - you may need to adjust based on your setup
    let query = supabase
      .from('document_chunks')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(topK);
    
    if (filters?.sourceTypes?.length) {
      query = query.in('metadata->>sourceType', filters.sourceTypes);
    }
    
    if (filters?.tags?.length) {
      query = query.overlaps('tags', filters.tags);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.map(row => this.mapDocumentChunkRowToDocumentChunk(row));
  }

  async deleteDocumentChunksBySource(tenantId: string, sourceId: string): Promise<void> {
    const { error } = await supabase
      .from('document_chunks')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('source_id', sourceId);
    
    if (error) throw error;
  }

  // ===== MAPPING FUNCTIONS =====
  
  private mapTenantRowToTenant(row: TenantRow): Tenant {
    return {
      id: row.id,
      subdomain: row.subdomain,
      name: row.name,
      onboardingCompleted: row.onboarding_completed,
      domains: [], // This would need a separate table
      plan: row.plan as any,
      members: [], // This would need a separate table
      branding: { logoUrl: 'https://placehold.co/128x32.png', logoDataAiHint: 'company logo' },
      defaultTone: 'Formal',
      limits: { rfps: 10, aiAnswers: 100, fileSizeMb: 100, seats: 5 }, // Default limits
    };
  }

  private mapRfpRowToRfp(row: RfpRow & { questions?: QuestionRow[] }): RFP {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      status: row.status as RfpStatus,
      topics: row.topics || [],
      questions: row.questions?.map(q => this.mapQuestionRowToQuestion(q)) || [],
    };
  }

  private mapQuestionRowToQuestion(row: QuestionRow): Question {
    return {
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category,
      compliance: 'pending' as any,
      status: 'Unassigned' as any,
      tags: row.tags || [],
    };
  }

  private mapDataSourceRowToDataSource(row: DataSourceRow): DataSource {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type as any,
      name: row.name,
      status: row.status as any,
      lastSynced: row.last_synced,
    };
  }

  private mapDocumentChunkRowToDocumentChunk(row: DocumentChunkRow): DocumentChunk {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      sourceId: row.source_id,
      title: row.title,
      content: row.content,
      embedding: row.embedding,
      tags: row.tags || [],
      metadata: row.metadata || {},
    };
  }
}

export const supabaseService = new SupabaseService(); 