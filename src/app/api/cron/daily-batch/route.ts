/**
 * GET /api/cron/daily-batch
 *
 * Vercel Cron（毎日 JST 3:00）で実行される日次バッチ。
 * vercel.json に以下を追加して有効化:
 *   "crons": [{ "path": "/api/cron/daily-batch", "schedule": "0 18 * * *" }]
 *   （UTC 18:00 = JST 3:00）
 *
 * 実行内容:
 *   1. 期限切れ video_cache を削除
 *   2. FANZA API が設定済みの場合: 人気タイプ TOP10 の動画を事前キャッシュ
 *   3. FANZA リンク生存確認（キャッシュ済み動画 URL）
 *   4. 処理結果レポートを返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchVideosByTypeIds, validateLink } from '@/lib/fanza/api';
import { createServiceClient } from '@/lib/supabase/server';

// プリウォームするタイプ ID（人気上位）
const PREWARM_TYPES: string[][] = [
  ['A1'],           // 清楚・黒髪ロング（最人気）
  ['B1'],           // キュート・童顔
  ['C1'],           // お姉さん
  ['A1', 'B1'],     // 複合スロット
  ['E2'],           // クール・モデル
  ['D1'],           // ギャル
];

export async function GET(request: NextRequest) {
  // ── 認証 ──────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== 'development') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
  };

  try {
    const supabase = createServiceClient();

    // ── Step 1: 期限切れキャッシュ削除 ───────────────────────────
    let deletedCache = 0;
    if (supabase) {
      const { data: deleted } = await supabase
        .from('video_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');
      deletedCache = deleted?.length ?? 0;
    }
    report.deletedExpiredCache = deletedCache;

    // ── Step 2: 人気タイプのプリウォームキャッシュ ───────────────
    let prewarmed = 0;
    const fanzaReady = !!(process.env.FANZA_AFFILIATE_ID && process.env.FANZA_API_KEY);
    report.fanzaApiReady = fanzaReady;

    if (fanzaReady && supabase) {
      for (const typeIds of PREWARM_TYPES) {
        try {
          const { videos } = await fetchVideosByTypeIds(typeIds, { limit: 12 });
          if (videos.length > 0) {
            const cacheKey = [...typeIds].sort().join(',') + '|match|12|0';
            const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
            await supabase.from('video_cache').upsert({
              cache_key:     cacheKey,
              videos:        videos as unknown as import('@/lib/supabase/types').Json,
              face_type_ids: typeIds,
              sort_by:       'match',
              expires_at:    expiresAt,
            });
            prewarmed++;
          }
        } catch (err) {
          console.error(`[daily-batch] prewarm failed for ${typeIds}:`, err);
        }
      }
    }
    report.prewarmedCacheEntries = prewarmed;

    // ── Step 3: キャッシュ済み動画のリンク生存確認 ───────────────
    let checkedLinks = 0;
    let deadLinks = 0;

    if (supabase && fanzaReady) {
      // 直近 24 時間以内に作成された有効なキャッシュを対象
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: cacheRows } = await supabase
        .from('video_cache')
        .select('id, videos')
        .gt('expires_at', new Date().toISOString())
        .gt('created_at', since)
        .limit(10);  // 過負荷防止: 最大 10 エントリ

      for (const row of cacheRows ?? []) {
        const videos = row.videos as Array<{ affiliateUrl?: string }>;
        for (const video of videos.slice(0, 3)) {  // 各エントリ 3 件まで確認
          if (!video.affiliateUrl) continue;
          const alive = await validateLink(video.affiliateUrl);
          checkedLinks++;
          if (!alive) deadLinks++;
        }
      }
    }
    report.checkedLinks = checkedLinks;
    report.deadLinks    = deadLinks;

    // ── 完了 ─────────────────────────────────────────────────────
    const elapsed = Date.now() - startTime;
    report.completedAt  = new Date().toISOString();
    report.elapsedMs    = elapsed;
    report.message      = '日次バッチが正常に完了しました';

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error('[daily-batch] Fatal error:', err);
    return NextResponse.json(
      { success: false, error: String(err), report },
      { status: 500 }
    );
  }
}
