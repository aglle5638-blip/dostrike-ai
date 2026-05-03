/**
 * POST /api/actress/preferences
 *
 * スワイプオンボーディングで「好き」と判定した女優を
 * user_actress_preferences に一括保存する。
 *
 * Request:
 *   Authorization: Bearer <token>
 *   { likes: { actress_id: string; actress_name: string }[] }
 *
 * Response:
 *   { success: boolean; saved: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const body = await req.json() as {
      likes: { actress_id: string; actress_name: string }[];
    };

    if (!Array.isArray(body.likes) || body.likes.length === 0) {
      return NextResponse.json({ error: 'likes は 1 件以上必要です' }, { status: 400 });
    }

    const authedClient = createAuthedClient(token);
    if (!authedClient) {
      return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
    }

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 既存スコアと合算してupsert（スワイプ初回は score=3 で強めの初期値）
    const rows = body.likes.map(l => ({
      user_id:      user.id,
      actress_id:   l.actress_id,
      actress_name: l.actress_name,
      score:        3,
    }));

    // onConflict で score を加算
    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
    }

    for (const row of rows) {
      const { data: existing } = await serviceClient
        .from('user_actress_preferences')
        .select('score')
        .eq('user_id', row.user_id)
        .eq('actress_id', row.actress_id)
        .single();

      await serviceClient
        .from('user_actress_preferences')
        .upsert({
          user_id:      row.user_id,
          actress_id:   row.actress_id,
          actress_name: row.actress_name,
          score:        (existing?.score ?? 0) + row.score,
        });
    }

    return NextResponse.json({ success: true, saved: rows.length });
  } catch (err) {
    console.error('[/api/actress/preferences] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
