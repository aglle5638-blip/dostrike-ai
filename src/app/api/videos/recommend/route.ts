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
import { fetchVideosByTypeIds, fetchVideosByActressIds } from '@/lib/fanza/api';
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

    const supabase   = createServiceClient();
    const resolvedLimit  = limit  ?? 20;
    const resolvedOffset = offset ?? 0;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート① 女優顔マッチング（週次バッチ済みデータがある場合）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (supabase) {
      const { data: matches } = await supabase
        .from('actress_face_matches')
        .select('actress_id, actress_name, match_score')
        .in('face_type_id', slotTypeIds)
        .order('match_score', { ascending: false })
        .limit(6); // 上位6人の女優

      if (matches && matches.length > 0) {
        // 同じ女優が複数タイプにマッチする場合は重複除去（スコア合算）
        const actressMap = new Map<string, { name: string; score: number }>();
        for (const m of matches) {
          const existing = actressMap.get(m.actress_id);
          actressMap.set(m.actress_id, {
            name:  m.actress_name,
            score: (existing?.score ?? 0) + m.match_score,
          });
        }
        const topActressIds = [...actressMap.entries()]
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, 5)
          .map(([id]) => id);

        const videos = await fetchVideosByActressIds(topActressIds, {
          limit:  resolvedLimit,
          sortBy: validSortBy,
        });

        if (videos.length > 0) {
          console.log('[recommend] actress-match route. actresses:', topActressIds, 'videos:', videos.length);
          // video_cache にも保存（1時間TTL）
          if (supabase) {
            const cacheKey  = buildCacheKey(slotTypeIds, validSortBy, resolvedLimit, resolvedOffset);
            const expiresAt = new Date(Date.now() + CACHE_TTL_SEC * 1000).toISOString();
            await supabase.from('video_cache').upsert({
              cache_key:     cacheKey,
              videos:        videos as unknown as import('@/lib/supabase/types').Json,
              face_type_ids: slotTypeIds,
              sort_by:       validSortBy,
              expires_at:    expiresAt,
            });
          }
          return NextResponse.json({
            videos,
            source:       'fanza',
            usedKeywords: topActressIds,
          } satisfies RecommendResponse);
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート② Supabase キャッシュ確認（フォールバック）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cacheKey = buildCacheKey(slotTypeIds, validSortBy, resolvedLimit, resolvedOffset);

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート③ キーワード検索（actress_face_matches 未投入時のフォールバック）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[recommend] keyword fallback. typeIds:', slotTypeIds);
    const result = await fetchVideosByTypeIds(slotTypeIds, {
      sortBy: validSortBy,
      limit:  resolvedLimit,
      offset: resolvedOffset,
    });
    console.log('[recommend] source:', result.source, 'keywords:', result.usedKeywords, 'count:', result.videos.length);

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

    return NextResponse.json({
      videos:       result.videos,
      source:       result.source,
      usedKeywords: result.usedKeywords,
    } satisfies RecommendResponse);
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
