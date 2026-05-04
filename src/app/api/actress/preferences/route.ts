/**
 * POST /api/actress/preferences
 *
 * スワイプオンボーディングで「好き」と判定した女優を
 * user_actress_preferences に一括保存する。
 *
 * Request:
 *   Authorization: Bearer <token>
 *   { likes: { actress_id: string; actress_name: string; image_url?: string; tags?: string[] }[] }
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
      likes: { actress_id: string; actress_name: string; image_url?: string; tags?: string[] }[];
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

    const { createServiceClient } = await import('@/lib/supabase/server');
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
    }

    // 既存スコアと合算してupsert（スワイプ初回は score=3 で強めの初期値）
    for (const like of body.likes) {
      const { data: existing } = await serviceClient
        .from('user_actress_preferences')
        .select('score')
        .eq('user_id', user.id)
        .eq('actress_id', like.actress_id)
        .single();

      // image_url / tags を含めてupsert（列が存在しない場合は gracefully 無視される）
      const upsertRow: Record<string, unknown> = {
        user_id:      user.id,
        actress_id:   like.actress_id,
        actress_name: like.actress_name,
        score:        (existing?.score ?? 0) + 3,
        last_seen_at: new Date().toISOString(),
      };
      if (like.image_url) upsertRow.image_url = like.image_url;
      if (like.tags)      upsertRow.tags      = like.tags;

      await serviceClient
        .from('user_actress_preferences')
        .upsert(upsertRow);
    }

    return NextResponse.json({ success: true, saved: body.likes.length });
  } catch (err) {
    console.error('[/api/actress/preferences] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
