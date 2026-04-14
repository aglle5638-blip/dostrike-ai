-- ============================================================
-- ドストライクAI - Supabase スキーマ
-- 実行方法: Supabase Dashboard > SQL Editor に貼り付けて実行
-- ============================================================

-- ── 拡張機能 ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── user_profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_vip          BOOLEAN NOT NULL DEFAULT FALSE,
  vip_expires_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 新規ユーザー登録時に自動でプロフィールを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── user_slots ───────────────────────────────────────────────────
-- 顔タイプスロット（最大 5 スロット / ユーザー）
CREATE TABLE IF NOT EXISTS public.user_slots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  slot_index    SMALLINT NOT NULL CHECK (slot_index BETWEEN 0 AND 4),
  face_type_id  TEXT NOT NULL,   -- 例: "A1", "B3"
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slot_index)
);

-- ── user_feedback ────────────────────────────────────────────────
-- キープ / ドストライク / 解除
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  video_id      TEXT NOT NULL,
  action        TEXT NOT NULL DEFAULT '' CHECK (action IN ('keep', 'strike', '')),
  face_type_id  TEXT,           -- フィードバック時のアクティブタイプ ID
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

-- ── video_cache ──────────────────────────────────────────────────
-- FANZA API レスポンスを最大 1 時間キャッシュ
CREATE TABLE IF NOT EXISTS public.video_cache (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key     TEXT UNIQUE NOT NULL,   -- SHA-256(typeIds+sortBy)
  videos        JSONB NOT NULL,
  face_type_ids TEXT[] NOT NULL,
  sort_by       TEXT NOT NULL DEFAULT 'match',
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 期限切れキャッシュを自動削除するインデックス
CREATE INDEX IF NOT EXISTS idx_video_cache_expires ON public.video_cache (expires_at);

-- ── RLS (Row Level Security) ──────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_slots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_cache   ENABLE ROW LEVEL SECURITY;

-- user_profiles: 自分のレコードのみ読み書き可
CREATE POLICY "users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- user_slots: 自分のスロットのみ CRUD
CREATE POLICY "users can manage own slots"
  ON public.user_slots FOR ALL
  USING (auth.uid() = user_id);

-- user_feedback: 自分のフィードバックのみ CRUD
CREATE POLICY "users can manage own feedback"
  ON public.user_feedback FOR ALL
  USING (auth.uid() = user_id);

-- video_cache: 全ユーザーが読める（書き込みはサービスロールのみ）
CREATE POLICY "all users can read cache"
  ON public.video_cache FOR SELECT
  USING (true);

-- ── 便利ビュー ───────────────────────────────────────────────────
-- ユーザーのアクティブスロット一覧（null スロットを除く）
CREATE OR REPLACE VIEW public.user_active_slots AS
  SELECT user_id, slot_index, face_type_id, updated_at
  FROM public.user_slots
  ORDER BY user_id, slot_index;

-- ── キャッシュ自動クリーンアップ（pg_cron が使える場合） ──────────
-- SELECT cron.schedule('cleanup-video-cache', '0 * * * *',
--   'DELETE FROM public.video_cache WHERE expires_at < NOW()');
