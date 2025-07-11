import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase instance (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase instance (for API routes, with service role)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types (you can generate these from Supabase CLI)
export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          subdomain: string;
          name: string;
          onboarding_completed: boolean;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subdomain: string;
          name: string;
          onboarding_completed?: boolean;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subdomain?: string;
          name?: string;
          onboarding_completed?: boolean;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rfps: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          status: string;
          topics: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          status?: string;
          topics?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          status?: string;
          topics?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: number;
          rfp_id: string;
          question: string;
          answer: string;
          category: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          rfp_id: string;
          question: string;
          answer: string;
          category?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          rfp_id?: string;
          question?: string;
          answer?: string;
          category?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      data_sources: {
        Row: {
          id: string;
          tenant_id: string;
          type: string;
          name: string;
          status: string;
          last_synced: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          type: string;
          name: string;
          status?: string;
          last_synced?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          type?: string;
          name?: string;
          status?: string;
          last_synced?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_chunks: {
        Row: {
          id: string;
          tenant_id: string;
          source_id: string;
          title: string;
          content: string;
          embedding: number[];
          tags: string[];
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          source_id: string;
          title: string;
          content: string;
          embedding: number[];
          tags?: string[];
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          source_id?: string;
          title?: string;
          content?: string;
          embedding?: number[];
          tags?: string[];
          metadata?: any;
          created_at?: string;
        };
      };
    };
  };
}; 