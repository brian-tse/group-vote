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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ballot_records_anonymous: {
        Row: {
          cast_at: string
          choice: Json
          id: string
          vote_id: string
        }
        Insert: {
          cast_at?: string
          choice: Json
          id?: string
          vote_id: string
        }
        Update: {
          cast_at?: string
          choice?: Json
          id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_records_anonymous_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_records_named: {
        Row: {
          cast_at: string
          choice: Json
          id: string
          member_id: string
          vote_id: string
        }
        Insert: {
          cast_at?: string
          choice: Json
          id?: string
          member_id: string
          vote_id: string
        }
        Update: {
          cast_at?: string
          choice?: Json
          id?: string
          member_id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_records_named_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_records_named_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
        }
        Relationships: []
      }
      participation_records: {
        Row: {
          id: string
          member_id: string
          updated_at: string
          vote_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          member_id: string
          updated_at?: string
          vote_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          updated_at?: string
          vote_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participation_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_records_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_options: {
        Row: {
          description: string | null
          display_order: number
          id: string
          label: string
          vote_id: string
        }
        Insert: {
          description?: string | null
          display_order?: number
          id?: string
          label: string
          vote_id: string
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          label?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_options_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_proposals: {
        Row: {
          admin_notes: string | null
          created_at: string
          custom_threshold_percentage: number | null
          description: string | null
          format: Database["public"]["Enums"]["vote_format"]
          id: string
          options: Json
          passing_threshold: Database["public"]["Enums"]["passing_threshold"]
          privacy_level: Database["public"]["Enums"]["privacy_level"]
          proposed_by: string
          quorum_percentage: number
          reviewed_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          title: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          custom_threshold_percentage?: number | null
          description?: string | null
          format: Database["public"]["Enums"]["vote_format"]
          id?: string
          options?: Json
          passing_threshold?: Database["public"]["Enums"]["passing_threshold"]
          privacy_level?: Database["public"]["Enums"]["privacy_level"]
          proposed_by: string
          quorum_percentage?: number
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          title: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          custom_threshold_percentage?: number | null
          description?: string | null
          format?: Database["public"]["Enums"]["vote_format"]
          id?: string
          options?: Json
          passing_threshold?: Database["public"]["Enums"]["passing_threshold"]
          privacy_level?: Database["public"]["Enums"]["privacy_level"]
          proposed_by?: string
          quorum_percentage?: number
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          custom_threshold_percentage: number | null
          deadline: string | null
          description: string | null
          format: Database["public"]["Enums"]["vote_format"]
          id: string
          opened_at: string | null
          passing_threshold: Database["public"]["Enums"]["passing_threshold"]
          privacy_level: Database["public"]["Enums"]["privacy_level"]
          quorum_percentage: number
          status: Database["public"]["Enums"]["vote_status"]
          title: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by: string
          custom_threshold_percentage?: number | null
          deadline?: string | null
          description?: string | null
          format: Database["public"]["Enums"]["vote_format"]
          id?: string
          opened_at?: string | null
          passing_threshold?: Database["public"]["Enums"]["passing_threshold"]
          privacy_level?: Database["public"]["Enums"]["privacy_level"]
          quorum_percentage?: number
          status?: Database["public"]["Enums"]["vote_status"]
          title: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          custom_threshold_percentage?: number | null
          deadline?: string | null
          description?: string | null
          format?: Database["public"]["Enums"]["vote_format"]
          id?: string
          opened_at?: string | null
          passing_threshold?: Database["public"]["Enums"]["passing_threshold"]
          privacy_level?: Database["public"]["Enums"]["privacy_level"]
          quorum_percentage?: number
          status?: Database["public"]["Enums"]["vote_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_member_id: { Args: never; Returns: string }
      is_current_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      member_role: "admin" | "member"
      passing_threshold:
        | "simple_majority"
        | "two_thirds"
        | "three_quarters"
        | "custom"
      privacy_level: "anonymous" | "admin_visible" | "open"
      proposal_status: "pending" | "approved" | "rejected"
      vote_format: "yes_no" | "multiple_choice" | "ranked_choice"
      vote_status: "draft" | "pending_review" | "open" | "closed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ["admin", "member"],
      passing_threshold: [
        "simple_majority",
        "two_thirds",
        "three_quarters",
        "custom",
      ],
      privacy_level: ["anonymous", "admin_visible", "open"],
      proposal_status: ["pending", "approved", "rejected"],
      vote_format: ["yes_no", "multiple_choice", "ranked_choice"],
      vote_status: ["draft", "pending_review", "open", "closed"],
    },
  },
} as const
