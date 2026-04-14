/**
 * POST /api/videos/feedback   - キープ/ストライクを保存
 * GET  /api/videos/feedback   - ユーザーのフィードバック一覧を取得
 * DELETE /api/videos/feedback - フィードバックを削除（action を '' にリセット）
 *
 * Supabase 未設定時はエラーを返さず { success: true } を返す（フロントはローカルステートで管理）。
 * Supabase 設定後は DB に永続化し、デバイス間で同期する。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAnonServerClient } from '@/lib/supabase/server';
import type { FeedbackRequest, FeedbackResponse } from '@/lib/fanza/types';

const VALID_ACTIONS = ['keep', 'strike', ''] as const;

// ─── POST: フィードバック保存 ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<FeedbackRequest>;
    const { videoId, action, faceTypeId } = body;

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId が必要です' }, { status: 400 });
    }
    if (action === undefined || !VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
      return NextResponse.json(
        { error: `action は keep | strike | '' のいずれかです` },
        { status: 400 }
      );
    }

    const supabase = createAnonServerClient();

    // ── Supabase 未設定時: フロントのローカルステートに任せる ────────
    if (!supabase) {
      return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
    }

    // ── ユーザー認証確認 ──────────────────────────────────────────
    // Authorization: Bearer <supabase-access-token> ヘッダーを期待
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // 未認証でも 401 にしない（匿名ユーザーはローカルステートで管理）
      return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: true, videoId, action } satisfies FeedbackResponse);
    }

    // ── DB 書き込み（upsert） ──────────────────────────────────────
    if (action === '') {
      // 空文字 = 解除 → レコード自体を削除
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
      });
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
    const supabase = createAnonServerClient();
    if (!supabase) {
      return NextResponse.json({ feedback: {} });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ feedback: {} });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ feedback: {} });
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .select('video_id, action')
      .eq('user_id', user.id)
      .neq('action', '');

    if (error) throw error;

    // { videoId: action } のマップで返す（フロントの feedback state と同形）
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
