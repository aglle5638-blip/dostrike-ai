-- ================================================================
-- 女優顔マッチング用テーブル
-- Supabase SQL Editor で実行してください
-- ================================================================

-- 女優プロフィール（週次バッチで更新）
CREATE TABLE IF NOT EXISTS actress_profiles (
  id          TEXT PRIMARY KEY,          -- FANZA 女優 ID
  name        TEXT NOT NULL,
  image_url   TEXT,                      -- FANZA プロフィール画像 URL
  face_features JSONB,                   -- Gemini Vision 分析結果 (FaceFeatures)
  analyzed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 顔タイプ → 女優マッチング（週次バッチで更新）
CREATE TABLE IF NOT EXISTS actress_face_matches (
  face_type_id  TEXT    NOT NULL,        -- 例: 'A1', 'B3'
  actress_id    TEXT    NOT NULL,
  actress_name  TEXT    NOT NULL,
  match_score   FLOAT   NOT NULL,        -- 0–100
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (face_type_id, actress_id)
);

CREATE INDEX IF NOT EXISTS idx_actress_face_matches_type_score
  ON actress_face_matches (face_type_id, match_score DESC);
