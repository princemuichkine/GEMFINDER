export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      idea_iterations: {
        Row: {
          changes: Json | null
          created_at: string | null
          feedback: string | null
          id: string
          idea_id: string | null
          version: number
        }
        Insert: {
          changes?: Json | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          idea_id?: string | null
          version: number
        }
        Update: {
          changes?: Json | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          idea_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "idea_iterations_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          biz_model: string | null
          bo_potential:
            | Database["public"]["Enums"]["blue_ocean_potential"]
            | null
          bo_score: number | null
          budget_rng: Database["public"]["Enums"]["budget_range_type"] | null
          comp_adv: Json | null
          comp_lvl: Database["public"]["Enums"]["competition_level_type"] | null
          created_at: string | null
          desc: string
          fin_proj: Json | null
          gen_at: string | null
          growth_rt: number | null
          gtm_strat: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          last_iter_at: string | null
          mkt_opp: string | null
          mkt_size: number | null
          prefs: Json | null
          risks: Json | null
          status: Database["public"]["Enums"]["idea_status"] | null
          target_mkt: string | null
          timeline: Database["public"]["Enums"]["timeline_type"] | null
          title: string
          updated_at: string | null
          userid: string | null
          value_prop: string | null
          version: number | null
        }
        Insert: {
          biz_model?: string | null
          bo_potential?:
            | Database["public"]["Enums"]["blue_ocean_potential"]
            | null
          bo_score?: number | null
          budget_rng?: Database["public"]["Enums"]["budget_range_type"] | null
          comp_adv?: Json | null
          comp_lvl?:
            | Database["public"]["Enums"]["competition_level_type"]
            | null
          created_at?: string | null
          desc: string
          fin_proj?: Json | null
          gen_at?: string | null
          growth_rt?: number | null
          gtm_strat?: string | null
          id?: string
          industry: Database["public"]["Enums"]["industry_type"]
          last_iter_at?: string | null
          mkt_opp?: string | null
          mkt_size?: number | null
          prefs?: Json | null
          risks?: Json | null
          status?: Database["public"]["Enums"]["idea_status"] | null
          target_mkt?: string | null
          timeline?: Database["public"]["Enums"]["timeline_type"] | null
          title: string
          updated_at?: string | null
          userid?: string | null
          value_prop?: string | null
          version?: number | null
        }
        Update: {
          biz_model?: string | null
          bo_potential?:
            | Database["public"]["Enums"]["blue_ocean_potential"]
            | null
          bo_score?: number | null
          budget_rng?: Database["public"]["Enums"]["budget_range_type"] | null
          comp_adv?: Json | null
          comp_lvl?:
            | Database["public"]["Enums"]["competition_level_type"]
            | null
          created_at?: string | null
          desc?: string
          fin_proj?: Json | null
          gen_at?: string | null
          growth_rt?: number | null
          gtm_strat?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          last_iter_at?: string | null
          mkt_opp?: string | null
          mkt_size?: number | null
          prefs?: Json | null
          risks?: Json | null
          status?: Database["public"]["Enums"]["idea_status"] | null
          target_mkt?: string | null
          timeline?: Database["public"]["Enums"]["timeline_type"] | null
          title?: string
          updated_at?: string | null
          userid?: string | null
          value_prop?: string | null
          version?: number | null
        }
        Relationships: []
      }
      market_research_cache: {
        Row: {
          cached_at: string | null
          conf: number | null
          data: Json
          data_type: string
          expires_at: string | null
          id: string
          industry: string
          source: string | null
        }
        Insert: {
          cached_at?: string | null
          conf?: number | null
          data: Json
          data_type: string
          expires_at?: string | null
          id?: string
          industry: string
          source?: string | null
        }
        Update: {
          cached_at?: string | null
          conf?: number | null
          data?: Json
          data_type?: string
          expires_at?: string | null
          id?: string
          industry?: string
          source?: string | null
        }
        Relationships: []
      }
      startup_training_data: {
        Row: {
          content: Json
          created_at: string | null
          data_type: Database["public"]["Enums"]["training_data_type"]
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          qual_score: number | null
          source_url: string | null
          tags: string[] | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          data_type: Database["public"]["Enums"]["training_data_type"]
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          qual_score?: number | null
          source_url?: string | null
          tags?: string[] | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          data_type?: Database["public"]["Enums"]["training_data_type"]
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          qual_score?: number | null
          source_url?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          innov_focus: Json | null
          pref_budgets: string[] | null
          pref_inds: Database["public"]["Enums"]["industry_type"][] | null
          pref_timelines: string[] | null
          updated_at: string | null
          userid: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          innov_focus?: Json | null
          pref_budgets?: string[] | null
          pref_inds?: Database["public"]["Enums"]["industry_type"][] | null
          pref_timelines?: string[] | null
          updated_at?: string | null
          userid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          innov_focus?: Json | null
          pref_budgets?: string[] | null
          pref_inds?: Database["public"]["Enums"]["industry_type"][] | null
          pref_timelines?: string[] | null
          updated_at?: string | null
          userid?: string | null
        }
        Relationships: []
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
      budget_range_type:
        | "under_10k"
        | "10k_50k"
        | "50k_100k"
        | "100k_500k"
        | "500k_plus"
      competition_level_type: "low" | "moderate" | "high" | "very_high"
      idea_status:
        | "draft"
        | "generated"
        | "iterating"
        | "completed"
        | "archived"
      industry_type:
        | "technology"
        | "healthcare"
        | "finance"
        | "education"
        | "retail"
        | "manufacturing"
        | "energy"
        | "transportation"
        | "entertainment"
        | "agriculture"
        | "real_estate"
        | "food_beverage"
        | "media"
        | "consulting"
        | "other"
      timeline_type:
        | "1-3_months"
        | "3-6_months"
        | "6-12_months"
        | "1-2_years"
        | "2_plus_years"
      training_data_type: "success" | "failure" | "trend" | "pattern"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      blue_ocean_potential: ["low", "moderate", "good", "excellent"],
      budget_range_type: [
        "under_10k",
        "10k_50k",
        "50k_100k",
        "100k_500k",
        "500k_plus",
      ],
      competition_level_type: ["low", "moderate", "high", "very_high"],
      idea_status: ["draft", "generated", "iterating", "completed", "archived"],
      industry_type: [
        "technology",
        "healthcare",
        "finance",
        "education",
        "retail",
        "manufacturing",
        "energy",
        "transportation",
        "entertainment",
        "agriculture",
        "real_estate",
        "food_beverage",
        "media",
        "consulting",
        "other",
      ],
      timeline_type: [
        "1-3_months",
        "3-6_months",
        "6-12_months",
        "1-2_years",
        "2_plus_years",
      ],
      training_data_type: ["success", "failure", "trend", "pattern"],
    },
  },
} as const
