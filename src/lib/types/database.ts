export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          user_id: string | null
          title: string
          description: string
          industry: Database["public"]["Enums"]["industry_type"]
          target_market: string | null
          budget_range: string | null
          timeline: string | null
          preferences: Json
          value_proposition: string | null
          business_model: string | null
          market_opportunity: string | null
          competitive_advantages: Json
          financial_projections: Json | null
          risks: Json
          go_to_market_strategy: string | null
          market_size: number | null
          growth_rate: number | null
          competition_level: string | null
          blue_ocean_score: number | null
          blue_ocean_potential: Database["public"]["Enums"]["blue_ocean_potential"] | null
          status: Database["public"]["Enums"]["idea_status"]
          version: number
          created_at: string
          updated_at: string
          generated_at: string | null
          last_iterated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          description: string
          industry: Database["public"]["Enums"]["industry_type"]
          target_market?: string | null
          budget_range?: string | null
          timeline?: string | null
          preferences?: Json
          value_proposition?: string | null
          business_model?: string | null
          market_opportunity?: string | null
          competitive_advantages?: Json
          financial_projections?: Json | null
          risks?: Json
          go_to_market_strategy?: string | null
          market_size?: number | null
          growth_rate?: number | null
          competition_level?: string | null
          blue_ocean_score?: number | null
          blue_ocean_potential?: Database["public"]["Enums"]["blue_ocean_potential"] | null
          status?: Database["public"]["Enums"]["idea_status"]
          version?: number
          created_at?: string
          updated_at?: string
          generated_at?: string | null
          last_iterated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          description?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          target_market?: string | null
          budget_range?: string | null
          timeline?: string | null
          preferences?: Json
          value_proposition?: string | null
          business_model?: string | null
          market_opportunity?: string | null
          competitive_advantages?: Json
          financial_projections?: Json | null
          risks?: Json
          go_to_market_strategy?: string | null
          market_size?: number | null
          growth_rate?: number | null
          competition_level?: string | null
          blue_ocean_score?: number | null
          blue_ocean_potential?: Database["public"]["Enums"]["blue_ocean_potential"] | null
          status?: Database["public"]["Enums"]["idea_status"]
          version?: number
          created_at?: string
          updated_at?: string
          generated_at?: string | null
          last_iterated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      idea_iterations: {
        Row: {
          id: string
          idea_id: string
          version: number
          feedback: string | null
          changes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          version: number
          feedback?: string | null
          changes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          version?: number
          feedback?: string | null
          changes?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_iterations_idea_id_fkey"
            columns: ["idea_id"]
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          }
        ]
      }
      market_research_cache: {
        Row: {
          id: string
          industry: string
          data_type: string
          data: Json
          source: string | null
          confidence: number | null
          cached_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          industry: string
          data_type: string
          data: Json
          source?: string | null
          confidence?: number | null
          cached_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          industry?: string
          data_type?: string
          data?: Json
          source?: string | null
          confidence?: number | null
          cached_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      startup_training_data: {
        Row: {
          id: string
          data_type: string
          content: Json
          industry: Database["public"]["Enums"]["industry_type"] | null
          tags: string[] | null
          quality_score: number
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          data_type: string
          content: Json
          industry?: Database["public"]["Enums"]["industry_type"] | null
          tags?: string[] | null
          quality_score: number
          source_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          data_type?: string
          content?: Json
          industry?: Database["public"]["Enums"]["industry_type"] | null
          tags?: string[] | null
          quality_score?: number
          source_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_industries: Database["public"]["Enums"]["industry_type"][] | null
          preferred_budget_ranges: string[] | null
          preferred_timelines: string[] | null
          innovation_focus: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_industries?: Database["public"]["Enums"]["industry_type"][] | null
          preferred_budget_ranges: string[] | null
          preferred_timelines: string[] | null
          innovation_focus?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_industries?: Database["public"]["Enums"]["industry_type"][] | null
          preferred_budget_ranges?: string[] | null
          preferred_timelines?: string[] | null
          innovation_focus?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      blue_ocean_potential: "low" | "moderate" | "good" | "excellent"
      idea_status: "draft" | "generated" | "iterating" | "completed" | "archived"
      industry_type: "technology" | "healthcare" | "finance" | "education" | "retail" | "manufacturing" | "energy" | "transportation" | "entertainment" | "agriculture" | "real_estate" | "food_beverage" | "media" | "consulting" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Idea = Database['public']['Tables']['ideas']['Row']
export type IdeaInsert = Database['public']['Tables']['ideas']['Insert']
export type IdeaUpdate = Database['public']['Tables']['ideas']['Update']

export type IdeaIteration = Database['public']['Tables']['idea_iterations']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']

export type IndustryType = Database['public']['Enums']['industry_type']
export type IdeaStatus = Database['public']['Enums']['idea_status']
export type BlueOceanPotential = Database['public']['Enums']['blue_ocean_potential']
