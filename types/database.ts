export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_pinned: boolean;
          mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          is_pinned?: boolean;
          mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          is_pinned?: boolean;
          mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          attachments: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          attachments?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          attachments?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          category: string;
          importance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          category?: string;
          importance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          category?: string;
          importance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          content_text: string | null;
          embedding: number[] | null;
          status: "processing" | "ready" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          content_text?: string | null;
          embedding?: number[] | null;
          status?: "processing" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          content_text?: string | null;
          embedding?: number[] | null;
          status?: "processing" | "ready" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      images: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          analysis: string | null;
          ocr_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          analysis?: string | null;
          ocr_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          analysis?: string | null;
          ocr_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          user_id: string;
          theme: string;
          language: string;
          voice_name: string;
          wake_mode_enabled: boolean;
          wake_word: string;
          clap_detection_enabled: boolean;
          clap_sensitivity: number;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          language?: string;
          voice_name?: string;
          wake_mode_enabled?: boolean;
          wake_word?: string;
          clap_detection_enabled?: boolean;
          clap_sensitivity?: number;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          language?: string;
          voice_name?: string;
          wake_mode_enabled?: boolean;
          wake_word?: string;
          clap_detection_enabled?: boolean;
          clap_sensitivity?: number;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro" | "ultra";
          status: "active" | "canceled" | "past_due";
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "free" | "pro" | "ultra";
          status?: "active" | "canceled" | "past_due";
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "free" | "pro" | "ultra";
          status?: "active" | "canceled" | "past_due";
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      voice_logs: {
        Row: {
          id: string;
          user_id: string;
          trigger: "wake_word" | "double_clap" | "manual";
          transcript: string | null;
          response: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trigger: "wake_word" | "double_clap" | "manual";
          transcript?: string | null;
          response?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trigger?: "wake_word" | "double_clap" | "manual";
          transcript?: string | null;
          response?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Memory = Database["public"]["Tables"]["memories"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type ImageRow = Database["public"]["Tables"]["images"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type VoiceLog = Database["public"]["Tables"]["voice_logs"]["Row"];
