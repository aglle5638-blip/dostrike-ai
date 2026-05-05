-- ============================================================
-- ドストライクAI — social_posts テーブル
-- SNS自動投稿ログ・スケジュール管理
-- 実行方法: Supabase Dashboard > SQL Editor に貼り付けて実行
-- ============================================================

-- ── social_posts テーブル ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      TEXT        NOT NULL CHECK (platform IN ('x', 'instagram')),
  template_key  TEXT        NOT NULL DEFAULT 'cta',  -- 顔タイプID or 'cta'
  content       TEXT        NOT NULL,                -- 実際の投稿テキスト
  post_id       TEXT,                                -- プラットフォーム上の投稿ID
  posted_at     TIMESTAMPTZ,                         -- 実際に投稿された日時
  likes         INT         NOT NULL DEFAULT 0,
  retweets      INT         NOT NULL DEFAULT 0,      -- X リツイート / Insta 保存数
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  error_message TEXT,                                -- エラー時の詳細
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── インデックス ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_posts_platform   ON public.social_posts (platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at  ON public.social_posts (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_status     ON public.social_posts (status);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- 読み取りはサービスロールのみ（一般ユーザーには非公開）
-- ※ 管理画面は SUPABASE_SERVICE_ROLE_KEY を使ったサーバーサイドAPIで取得する

-- ── エンゲージメント取得のためのヘルパービュー ──────────────
CREATE OR REPLACE VIEW public.social_post_stats AS
SELECT
  platform,
  DATE(posted_at AT TIME ZONE 'Asia/Tokyo') AS posted_date,
  COUNT(*) FILTER (WHERE status = 'posted')  AS post_count,
  SUM(likes)                                 AS total_likes,
  SUM(retweets)                              AS total_retweets
FROM public.social_posts
WHERE status = 'posted'
GROUP BY platform, DATE(posted_at AT TIME ZONE 'Asia/Tokyo')
ORDER BY posted_date DESC;
