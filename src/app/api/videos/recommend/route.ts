/**
 * POST /api/videos/recommend
 *
 * ダッシュボードのスロットに登録された顔タイプ ID から
 * マッチする動画を返すメインエンドポイント。
 *
 * Request:
 *   { slotTypeIds: string[], sortBy?: SortBy, limit?: number, offset?: number }
 *
 * Response:
 *   { videos: VideoResult[], source: 'fanza'|'mock', usedKeywords: string[], totalCount?: number }
 *
 * キャッシュ戦略:
 *   1. Supabase video_cache テーブル（TTL 1 時間）
 *   2. Next.js fetch キャッシュ（fetchVideosByTypeIds 内部）
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchVideosByTypeIds } from '@/lib/fanza/api';
import { aggregateKeywords } from '@/lib/fanza/keywords';
import { createServiceClient } from '@/lib/supabase/server';
import type { SortBy, RecommendRequest, RecommendResponse, VideoResult } from '@/lib/fanza/types';

const VALID_SORT: SortBy[] = ['match', 'rank', 'date', 'review', 'price_asc', 'price_desc'];
const CACHE_TTL_SEC = 3600; // 1 時間

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RecommendRequest>;

    // ── バリデーション ────────────────────────────────────────────
    const { slotTypeIds, sortBy = 'match', limit = 12, offset = 0 } = body;

    if (!slotTypeIds || !Array.isArray(slotTypeIds) || slotTypeIds.length === 0) {
      return NextResponse.json(
        { error: 'slotTypeIds は 1 件以上の配列が必要です' },
        { status: 400 }
      );
    }
    if (slotTypeIds.length > 5) {
      return NextResponse.json(
        { error: 'slotTypeIds は最大 5 件です' },
        { status: 400 }
      );
    }
    if (sortBy && !VALID_SORT.includes(sortBy)) {
      return NextResponse.json(
        { error: `sortBy は ${VALID_SORT.join(' | ')} のいずれかです` },
        { status: 400 }
      );
    }
    if (limit && (limit < 1 || limit > 50)) {
      return NextResponse.json(
        { error: 'limit は 1–50 の範囲です' },
        { status: 400 }
      );
    }

    const validSortBy = (sortBy as SortBy) ?? 'match';

    // ── Supabase キャッシュ確認 ───────────────────────────────────
    const cacheKey = buildCacheKey(slotTypeIds, validSortBy, limit ?? 12, offset ?? 0);
    const supabase = createServiceClient();

    if (supabase) {
      const { data: cached } = await supabase
        .from('video_cache')
        .select('videos, face_type_ids')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached?.videos) {
        const videos = cached.videos as VideoResult[];
        console.log('[recommend] cache HIT. key:', cacheKey, 'count:', videos.length);
        return NextResponse.json({
          videos,
          source: 'cache',
          usedKeywords: aggregateKeywords(slotTypeIds),
        } satisfies RecommendResponse & { source: string });
      }
    }

    // ── FANZA API / モック ────────────────────────────────────────
    console.log('[recommend] cache MISS – calling API. typeIds:', slotTypeIds, 'cacheKey:', cacheKey);
    const result = await fetchVideosByTypeIds(slotTypeIds, {
      sortBy: validSortBy,
      limit: limit ?? 12,
      offset: offset ?? 0,
    });
    console.log('[recommend] source:', result.source, 'keywords:', result.usedKeywords, 'count:', result.videos.length);

    // ── Supabase にキャッシュ書き込み ─────────────────────────────
    if (supabase && result.videos.length > 0) {
      const expiresAt = new Date(Date.now() + CACHE_TTL_SEC * 1000).toISOString();
      await supabase.from('video_cache').upsert({
        cache_key:     cacheKey,
        videos:        result.videos as unknown as import('@/lib/supabase/types').Json,
        face_type_ids: slotTypeIds,
        sort_by:       validSortBy,
        expires_at:    expiresAt,
      });
    }

    const response: RecommendResponse = {
      videos:       result.videos,
      source:       result.source,
      usedKeywords: result.usedKeywords,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[/api/videos/recommend] Error:', err);
    return NextResponse.json(
      { error: '動画の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// ── キャッシュキー生成 ────────────────────────────────────────────
function buildCacheKey(
  typeIds: string[],
  sortBy: string,
  limit: number,
  offset: number
): string {
  // ソートした ID 配列 + ソート種別 + ページング でユニーク
  return [...typeIds].sort().join(',') + `|${sortBy}|${limit}|${offset}`;
}
