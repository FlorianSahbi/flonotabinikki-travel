
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
    PostgrestVersion: "13.0.4"
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
      cluster_heads: {
        Row: {
          cluster_id: string
          sort_at: string
        }
        Insert: {
          cluster_id: string
          sort_at: string
        }
        Update: {
          cluster_id?: string
          sort_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_heads_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: true
            referencedRelation: "cluster_first_video"
            referencedColumns: ["cluster_id"]
          },
          {
            foreignKeyName: "cluster_heads_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: true
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          preview: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          preview?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          preview?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          alt_m: number | null
          audio_bitrate_bps: number | null
          audio_channels: number | null
          audio_codec: string | null
          audio_layout: string | null
          bitrate_bps: number | null
          bucket_path: string | null
          bucket_url: string | null
          city: string | null
          cluster_id: string | null
          color_primaries: string | null
          color_range: string | null
          color_space: string | null
          color_transfer: string | null
          container: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          description: string | null
          duration_s: number | null
          file_ext: string | null
          file_mime: string | null
          file_name: string
          file_size_bytes: number | null
          fps: number | null
          has_audio: boolean | null
          height: number | null
          id: string
          lat: number | null
          level: number | null
          lng: number | null
          main_url: string | null
          nb_frames: number | null
          pix_fmt: string | null
          place_name: string | null
          postcode: string | null
          poster_url: string | null
          preview_url: string | null
          qt_create: string | null
          qt_modify: string | null
          recorded_at_local: string | null
          sample_rate_hz: number | null
          size_bytes: number | null
          subtitle: string | null
          thumbs: Json | null
          title: string | null
          video_codec: string | null
          video_profile: string | null
          width: number | null
        }
        Insert: {
          alt_m?: number | null
          audio_bitrate_bps?: number | null
          audio_channels?: number | null
          audio_codec?: string | null
          audio_layout?: string | null
          bitrate_bps?: number | null
          bucket_path?: string | null
          bucket_url?: string | null
          city?: string | null
          cluster_id?: string | null
          color_primaries?: string | null
          color_range?: string | null
          color_space?: string | null
          color_transfer?: string | null
          container?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          duration_s?: number | null
          file_ext?: string | null
          file_mime?: string | null
          file_name: string
          file_size_bytes?: number | null
          fps?: number | null
          has_audio?: boolean | null
          height?: number | null
          id?: string
          lat?: number | null
          level?: number | null
          lng?: number | null
          main_url?: string | null
          nb_frames?: number | null
          pix_fmt?: string | null
          place_name?: string | null
          postcode?: string | null
          poster_url?: string | null
          preview_url?: string | null
          qt_create?: string | null
          qt_modify?: string | null
          recorded_at_local?: string | null
          sample_rate_hz?: number | null
          size_bytes?: number | null
          subtitle?: string | null
          thumbs?: Json | null
          title?: string | null
          video_codec?: string | null
          video_profile?: string | null
          width?: number | null
        }
        Update: {
          alt_m?: number | null
          audio_bitrate_bps?: number | null
          audio_channels?: number | null
          audio_codec?: string | null
          audio_layout?: string | null
          bitrate_bps?: number | null
          bucket_path?: string | null
          bucket_url?: string | null
          city?: string | null
          cluster_id?: string | null
          color_primaries?: string | null
          color_range?: string | null
          color_space?: string | null
          color_transfer?: string | null
          container?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          description?: string | null
          duration_s?: number | null
          file_ext?: string | null
          file_mime?: string | null
          file_name?: string
          file_size_bytes?: number | null
          fps?: number | null
          has_audio?: boolean | null
          height?: number | null
          id?: string
          lat?: number | null
          level?: number | null
          lng?: number | null
          main_url?: string | null
          nb_frames?: number | null
          pix_fmt?: string | null
          place_name?: string | null
          postcode?: string | null
          poster_url?: string | null
          preview_url?: string | null
          qt_create?: string | null
          qt_modify?: string | null
          recorded_at_local?: string | null
          sample_rate_hz?: number | null
          size_bytes?: number | null
          subtitle?: string | null
          thumbs?: Json | null
          title?: string | null
          video_codec?: string | null
          video_profile?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "cluster_first_video"
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
      cluster_first_video: {
        Row: {
          cluster_id: string | null
          lat: number | null
          lng: number | null
          recorded_at: string | null
          video_id: string | null
        }
        Relationships: []
      }
      map_points_simple: {
        Row: {
          id: string | null
          kind: string | null
          lat: number | null
          lng: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      feed__cluster_items_after: {
        Args: { lim: number; ref_time: string; skip_cluster_id?: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      feed__cluster_items_before: {
        Args: { lim: number; ref_time: string; skip_cluster_id?: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      feed__standalone_videos_after: {
        Args: { lim: number; ref_time: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      feed__standalone_videos_before: {
        Args: { lim: number; ref_time: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      feed_get_context_items: {
        Args: { range_size: number; target_id: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      feed_get_items_after: {
        Args: { lim: number; ref_time: string; skip_cluster_id?: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      feed_get_items_before: {
        Args: { lim: number; ref_time: string; skip_cluster_id?: string }
        Returns: {
          description: string
          id: string
          kind: string
          lat: number
          lng: number
          main_url: string
          position: number
          poster_url: string
          preview: string
          recorded_at: string
          title: string
        }[]
      }
      get_random_map_points: {
        Args: { lim?: number }
        Returns: {
          id: string
          kind: string
          lat: number
          lng: number
        }[]
      }
      get_random_videos: {
        Args: never
        Returns: {
          alt_m: number | null
          audio_bitrate_bps: number | null
          audio_channels: number | null
          audio_codec: string | null
          audio_layout: string | null
          bitrate_bps: number | null
          bucket_path: string | null
          bucket_url: string | null
          city: string | null
          cluster_id: string | null
          color_primaries: string | null
          color_range: string | null
          color_space: string | null
          color_transfer: string | null
          container: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          description: string | null
          duration_s: number | null
          file_ext: string | null
          file_mime: string | null
          file_name: string
          file_size_bytes: number | null
          fps: number | null
          has_audio: boolean | null
          height: number | null
          id: string
          lat: number | null
          level: number | null
          lng: number | null
          main_url: string | null
          nb_frames: number | null
          pix_fmt: string | null
          place_name: string | null
          postcode: string | null
          poster_url: string | null
          preview_url: string | null
          qt_create: string | null
          qt_modify: string | null
          recorded_at_local: string | null
          sample_rate_hz: number | null
          size_bytes: number | null
          subtitle: string | null
          thumbs: Json | null
          title: string | null
          video_codec: string | null
          video_profile: string | null
          width: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "videos"
          isOneToOne: false
          isSetofReturn: true
        }
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
