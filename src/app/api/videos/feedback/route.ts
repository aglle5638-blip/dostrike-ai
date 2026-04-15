/**
 * POST /api/videos/feedback   - キープ/ストライクを保存
 * GET  /api/videos/feedback   - ユーザーのフィードバック一覧を取得
 *
 * Authorization: Bearer <supabase-access-token> ヘッダーが必要。
 * 未認証の場合は { success: true } / { feedback: {} } を返す（ローカルステートで管理）。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import type { FeedbackRequest, FeedbackResponse } from '@/lib/fanza/types';

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
    const { videoId, action, faceTypeId } = body;

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId が必要です' }, { status: 400 });
    }
    if (action === undefined || !VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
      return NextResponse.json({ error: 'action は keep | strike | \'\' のいずれかです' }, { status: 400 });
    }

    const token = extractToken(req);
    if (!token) {
      // 未認証: フロントのローカルステートに任せる
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
    } else {
      await supabase.from('user_feedback').upsert({
        user_id:      user.id,
        video_id:     videoId,
        action:       action as 'keep' | 'strike',
        face_type_id: faceTypeId ?? null,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id,video_id' });
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
    if (!token) return NextResponse.json({ feedback: {} });

    const supabase = createAuthedClient(token);
    if (!supabase) return NextResponse.json({ feedback: {} });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ feedback: {} });

    const { data, error } = await supabase
      .from('user_feedback')
      .select('video_id, action')
      .eq('user_id', user.id)
      .neq('action', '');

    if (error) throw error;

    const feedback: Record<string, string> = {};
    for (const row of data ?? []) {
      feedback[row.video_id] = row.action;
    }

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error('[/api/videos/feedback] GET error:', err);
    return NextResponse.json({ feedback: {} });
  }
}
