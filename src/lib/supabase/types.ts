/**
 * Supabase データベース型定義
 *
 * テーブル設計:
 *   user_profiles  - VIP フラグ・登録日
 *   user_slots     - 好みの顔タイプスロット（最大 5）
 *   user_feedback  - キープ/ストライク履歴
 *   video_cache    - FANZA API レスポンスキャッシュ
 *
 * マイグレーション SQL は supabase/schema.sql を参照。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ── ユーザープロフィール ────────────────────────────────────
      user_profiles: {
        Row: {
          id: string;             // UUID (auth.users.id と紐付き)
          is_vip: boolean;
          vip_expires_at: string | null;  // ISO 8601
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          is_vip?: boolean;
          vip_expires_at?: string | null;
        };
        Update: {
          is_vip?: boolean;
          vip_expires_at?: string | null;
          updated_at?: string;
        };
      };

      // ── 好みの顔タイプスロット ──────────────────────────────────
      user_slots: {
        Row: {
          id: string;
          user_id: string;
          slot_index: number;     // 0–4
          face_type_id: string;   // 例: "A1", "B3"
          updated_at: string;
        };
        Insert: {
          user_id: string;
          slot_index: number;
          face_type_id: string;
        };
        Update: {
          face_type_id?: string;
          updated_at?: string;
        };
      };

      // ── ユーザーフィードバック（キープ/ストライク） ──────────────
      user_feedback: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          action: 'keep' | 'strike' | '';
          face_type_id: string | null;  // フィードバック時のアクティブタイプ
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          video_id: string;
          action: 'keep' | 'strike' | '';
          face_type_id?: string | null;
        };
        Update: {
          action?: 'keep' | 'strike' | '';
          updated_at?: string;
        };
      };

      // ── 動画キャッシュ ─────────────────────────────────────────
      video_cache: {
        Row: {
          id: string;
          cache_key: string;          // SHA-256(typeIds + sortBy)
          videos: Json;               // VideoResult[]
          face_type_ids: string[];
          sort_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          cache_key: string;
          videos: Json;
          face_type_ids: string[];
          sort_by: string;
          expires_at: string;
        };
        Update: {
          videos?: Json;
          expires_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── 便利型エイリアス ─────────────────────────────────────────────
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserSlot    = Database['public']['Tables']['user_slots']['Row'];
export type UserFeedback = Database['public']['Tables']['user_feedback']['Row'];
export type VideoCache  = Database['public']['Tables']['video_cache']['Row'];
