-- fanza_actresses: FANZA女優データのローカルキャッシュ（Supabase無料プラン対応）
-- 全ユーザー共有データ。1000ユーザーが利用しても肥大化しない設計。
-- 推定: 5000女優 × 400bytes = 2MB (free plan 500MB内)

CREATE TABLE IF NOT EXISTS public.fanza_actresses (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  image_url    TEXT,              -- large (高解像度)
  image_small  TEXT,             -- small
  bust         INTEGER,
  height       INTEGER,
  birthday     TEXT,             -- YYYY-MM-DD
  age_group    TEXT,             -- '10代' | '20代' | '30代以上'
  body_type    TEXT,             -- 'スレンダー' | '普通' | 'グラマー'
  tags         TEXT[] DEFAULT '{}',
  synced_at    TIMESTAMPTZ DEFAULT now()
);

-- フィルタリング用インデックス
CREATE INDEX IF NOT EXISTS idx_fa_body    ON public.fanza_actresses(body_type) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fa_age     ON public.fanza_actresses(age_group)  WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fa_synced  ON public.fanza_actresses(synced_at DESC);
