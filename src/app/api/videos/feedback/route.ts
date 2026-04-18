/**
 * POST /api/videos/feedback   - キープ/ストライクを保存
 * GET  /api/videos/feedback   - ユーザーのフィードバック一覧を取得
 *
 * Authorization: Bearer <supabase-access-token> ヘッダーが必要。
 * 未認証の場合は { success: true } / { feedback: {}, videoMeta: {} } を返す。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import type { FeedbackRequest, FeedbackResponse, FeedbackListResponse } from '@/lib/fanza/types';

const VALID_ACTIONS = ['keep', 'strike', ''] as const;

/** Authorization ヘッダーからトークンを取り出す */
function extractToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// ─── POST: フィードバック保存 ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<FeedbackRequest>;
    const { videoId, action, faceTypeId, videoMeta } = body;

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId が必要です' }, { status: 400 });
    }
    if (action === undefined || !VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
      return NextResponse.json({ error: 'action は keep | strike | \'\' のいずれかです' }, { status: 400 });
    }

    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
    }

    const supabase = createAuthedClient(token);
    if (!supabase) {
      return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
    }

    // ── ユーザー確認 ──────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
    }

    // ── DB 書き込み ───────────────────────────────────────────────
    if (action === '') {
      // 解除 → レコード削除
      await supabase
        .from('user_feedback')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      // 解除時はスコアを減らす
      if (videoMeta?.actress && videoMeta.actress !== '不明') {
        try {
          const { searchActressByName } = await import('@/lib/fanza/api');
          const { createServiceClient } = await import('@/lib/supabase/server');
          const actressId = await searchActressByName(videoMeta.actress);
          if (actressId) {
            const sc = createServiceClient();
            if (sc) {
              const { data: existing } = await sc
                .from('user_actress_preferences')
                .select('score')
                .eq('user_id', user.id)
                .eq('actress_id', actressId)
                .single();
              const newScore = Math.max(0, (existing?.score ?? 1) - 1);
              if (newScore === 0) {
                await sc.from('user_actress_preferences').delete()
                  .eq('user_id', user.id).eq('actress_id', actressId);
              } else {
                await sc.from('user_actress_preferences').update({ score: newScore })
                  .eq('user_id', user.id).eq('actress_id', actressId);
              }
            }
          }
        } catch (prefErr) {
          console.error('[feedback] actress preference decrement failed:', prefErr);
        }
      }
    } else {
      await supabase.from('user_feedback').upsert({
        user_id:      user.id,
        video_id:     videoId,
        action:       action as 'keep' | 'strike',
        face_type_id: faceTypeId ?? null,
        video_meta:   videoMeta ?? null,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id,video_id' });

      // 女優好み学習
      if (videoMeta?.actress && videoMeta.actress !== '不明') {
        try {
          const { searchActressByName } = await import('@/lib/fanza/api');
          const { createServiceClient } = await import('@/lib/supabase/server');
          const actressId = await searchActressByName(videoMeta.actress);
          if (actressId) {
            const sc = createServiceClient();
            if (sc) {
              // 既存スコアを取得してインクリメント
              const { data: existing } = await sc
                .from('user_actress_preferences')
                .select('score')
                .eq('user_id', user.id)
                .eq('actress_id', actressId)
                .single();
              const newScore = (existing?.score ?? 0) + 1;
              await sc.from('user_actress_preferences').upsert({
                user_id:      user.id,
                actress_id:   actressId,
                actress_name: videoMeta.actress,
                score:        newScore,
                last_seen_at: new Date().toISOString(),
              }, { onConflict: 'user_id,actress_id' });
            }
          }
        } catch (prefErr) {
          console.error('[feedback] actress preference update failed:', prefErr);
          // 失敗してもフィードバック自体は成功として返す
        }
      }
    }

    return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
  } catch (err) {
    console.error('[/api/videos/feedback] POST error:', err);
    return NextResponse.json({ error: 'フィードバック保存中にエラーが発生しました' }, { status: 500 });
  }
}

// ─── GET: フィードバック一覧 ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ feedback: {}, videoMeta: {} } satisfies FeedbackListResponse);

    const supabase = createAuthedClient(token);
    if (!supabase) return NextResponse.json({ feedback: {}, videoMeta: {} } satisfies FeedbackListResponse);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ feedback: {}, videoMeta: {} } satisfies FeedbackListResponse);

    const { data, error } = await supabase
      .from('user_feedback')
      .select('video_id, action, video_meta, created_at')
      .eq('user_id', user.id)
      .neq('action', '')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const feedback: Record<string, string> = {};
    const videoMeta: FeedbackListResponse['videoMeta'] = {};

    for (const row of data ?? []) {
      feedback[row.video_id] = row.action;
      if (row.video_meta) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoMeta[row.video_id] = row.video_meta as any;
      }
    }

    return NextResponse.json({ feedback, videoMeta } satisfies FeedbackListResponse);
  } catch (err) {
    console.error('[/api/videos/feedback] GET error:', err);
    return NextResponse.json({ feedback: {}, videoMeta: {} } satisfies FeedbackListResponse);
  }
}
