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

    if (!body.keyword && (!slotTypeIds || !Array.isArray(slotTypeIds) || slotTypeIds.length === 0)) {
      return NextResponse.json(
        { error: 'slotTypeIds は 1 件以上の配列が必要です' },
        { status: 400 }
      );
    }
    if (slotTypeIds && slotTypeIds.length > 5) {
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
    // skipActressMatch=true の場合はキーワード検索のみ（トレンド・発見タブのページネーション用）
    const skipActressMatch = body.skipActressMatch === true;

    const supabase   = createServiceClient();
    const resolvedLimit  = limit  ?? 20;
    const resolvedOffset = offset ?? 0;

    // ── キーワード直接検索（タグ・フリーワード検索時、またはページ指定時） ──
    if (body.keyword || skipActressMatch) {
      const result = await fetchVideosByTypeIds(
        body.keyword ? [] : (slotTypeIds ?? []),
        { sortBy: validSortBy, limit: resolvedLimit, offset: resolvedOffset, keyword: body.keyword }
      );
      return NextResponse.json({ videos: result.videos, source: result.source, usedKeywords: body.keyword ? [body.keyword] : result.usedKeywords });
    }

    const resolvedTypeIds: string[] = slotTypeIds ?? [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート0: ユーザー好み女優（フィードバック学習済み）を最優先
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Authorization ヘッダーからユーザートークンを取得
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ') && supabase) {
      try {
        const token = authHeader.slice(7);
        const { createAuthedClient } = await import('@/lib/supabase/server');
        const authedClient = createAuthedClient(token);
        if (authedClient) {
          const { data: { user } } = await authedClient.auth.getUser();
          if (user) {
            const { data: prefs } = await supabase
              .from('user_actress_preferences')
              .select('actress_id, actress_name, score')
              .eq('user_id', user.id)
              .order('score', { ascending: false })
              .limit(6);

            if (prefs && prefs.length > 0) {
              const prefActressIds = prefs.map(p => p.actress_id);
              const prefVideos = await fetchVideosByActressIds(prefActressIds, {
                limit: resolvedLimit,
                sortBy: validSortBy,
              });
              if (prefVideos.length > 0) {
                console.log('[recommend] user-preference route. actresses:', prefActressIds, 'videos:', prefVideos.length);
                return NextResponse.json({
                  videos: prefVideos,
                  source: 'fanza',
                  usedKeywords: prefActressIds,
                } satisfies RecommendResponse);
              }
            }
          }
        }
      } catch (prefErr) {
        console.error('[recommend] user preference lookup failed:', prefErr);
        // エラー時は次のルートへ
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート① 女優顔マッチング（週次バッチ済みデータがある場合）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (supabase) {
      const { data: matches, error: matchErr } = await supabase
        .from('actress_face_matches')
        .select('actress_id, actress_name, match_score')
        .in('face_type_id', resolvedTypeIds)
        .order('match_score', { ascending: false })
        .limit(10); // 上位10人の女優から動画取得（余裕を持たせる）

      console.log('[recommend] actress_face_matches query. typeIds:', resolvedTypeIds, 'matches:', matches?.length ?? 0, 'err:', matchErr?.message);

      if (matches && matches.length > 0) {
        // 重複除去（スコア合算）
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
          .slice(0, 6)
          .map(([id]) => id);

        console.log('[recommend] top actress IDs:', topActressIds);

        const videos = await fetchVideosByActressIds(topActressIds, {
          limit:  resolvedLimit,
          sortBy: validSortBy,
        });

        console.log('[recommend] fetchVideosByActressIds returned:', videos.length, 'videos');

        if (videos.length > 0) {
          // video_cache にも保存（1時間TTL）
          const cacheKey  = buildCacheKey(resolvedTypeIds, validSortBy, resolvedLimit, resolvedOffset);
          const expiresAt = new Date(Date.now() + CACHE_TTL_SEC * 1000).toISOString();
          await supabase.from('video_cache').upsert({
            cache_key:     cacheKey,
            videos:        videos as unknown as import('@/lib/supabase/types').Json,
            face_type_ids: resolvedTypeIds,
            sort_by:       validSortBy,
            expires_at:    expiresAt,
          });
          return NextResponse.json({
            videos,
            source:       'fanza',
            usedKeywords: topActressIds,
          } satisfies RecommendResponse);
        }
        // videos.length === 0 の場合、女優IDで動画が取れなかった → キーワード検索へフォールバック
        console.log('[recommend] actress videos empty, falling back to keyword search');
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート② Supabase キャッシュ確認（フォールバック）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cacheKey = buildCacheKey(resolvedTypeIds, validSortBy, resolvedLimit, resolvedOffset);

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
          usedKeywords: aggregateKeywords(resolvedTypeIds),
        } satisfies RecommendResponse & { source: string });
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ルート③ キーワード検索（actress_face_matches 未投入時のフォールバック）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[recommend] keyword fallback. typeIds:', resolvedTypeIds);
    const result = await fetchVideosByTypeIds(resolvedTypeIds, {
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
        face_type_ids: resolvedTypeIds,
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
