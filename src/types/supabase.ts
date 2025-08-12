
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      clusters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          preview: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          preview?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          preview?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          bucket_path: string
          bucket_url: string
          cluster_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          lat: number
          lng: number
          position: number
          recorded_at: string
          subtitle: string | null
          title: string | null
        }
        Insert: {
          bucket_path: string
          bucket_url: string
          cluster_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          lat: number
          lng: number
          position: number
          recorded_at: string
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          bucket_path?: string
          bucket_url?: string
          cluster_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          lat?: number
          lng?: number
          position?: number
          recorded_at?: string
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "cluster_heads"
            referencedColumns: ["cluster_id"]
          },
          {
            foreignKeyName: "videos_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cluster_heads: {
        Row: {
          cluster_id: string | null
          sort_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_context_videos: {
        Args: { target_id: string } | { target_id: string; range_size: number }
        Returns: {
          id: string
          bucket_url: string
          recorded_at: string
          lat: number
          lng: number
          position: number
        }[]
      }
      get_random_videos: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_path: string
          bucket_url: string
          cluster_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          lat: number
          lng: number
          position: number
          recorded_at: string
          subtitle: string | null
          title: string | null
        }[]
      }
      get_videos_after: {
        Args: { ref_time: string; lim: number }
        Returns: {
          bucket_path: string
          bucket_url: string
          cluster_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          lat: number
          lng: number
          position: number
          recorded_at: string
          subtitle: string | null
          title: string | null
        }[]
      }
      get_videos_before: {
        Args: { ref_time: string; lim: number }
        Returns: {
          bucket_path: string
          bucket_url: string
          cluster_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          lat: number
          lng: number
          position: number
          recorded_at: string
          subtitle: string | null
          title: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
