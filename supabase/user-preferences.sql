-- ================================================================
-- ユーザー好み女優テーブル
-- フィードバック（いいね/キープ）から自動学習
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_actress_preferences (
  user_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  actress_id   TEXT NOT NULL,        -- FANZA 女優 ID
  actress_name TEXT NOT NULL,
  score        INT  NOT NULL DEFAULT 1, -- いいね/キープ累計（解除で-1、最小0）
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url    TEXT,                   -- 女優プロフィール画像 URL
  tags         TEXT[] NOT NULL DEFAULT '{}', -- 体型タグ（グラマー/スレンダー/高身長/小柄等）
  PRIMARY KEY (user_id, actress_id)
);

-- v2 migration: add image_url and tags columns if not exists
-- Run in Supabase SQL Editor:
-- ALTER TABLE public.user_actress_preferences ADD COLUMN IF NOT EXISTS image_url TEXT;
-- ALTER TABLE public.user_actress_preferences ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_user_actress_pref_score
  ON public.user_actress_preferences (user_id, score DESC);

-- RLS
ALTER TABLE public.user_actress_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own actress preferences"
  ON public.user_actress_preferences FOR ALL
  USING (auth.uid() = user_id);

-- service_role can write (for API routes using service client)
CREATE POLICY "service role can manage actress preferences"
  ON public.user_actress_preferences FOR ALL
  TO service_role
  USING (true);
