/**
 * GET /api/actress/preferences/count
 *
 * ログインユーザーの user_actress_preferences の件数を返す。
 * スワイプオンボーディング表示判定に使用。
 *
 * Response: { count: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ count: 0 });
    }
    const token = authHeader.slice(7);

    const authedClient = createAuthedClient(token);
    if (!authedClient) return NextResponse.json({ count: 0 });

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) return NextResponse.json({ count: 0 });

    const serviceClient = createServiceClient();
    if (!serviceClient) return NextResponse.json({ count: 0 });

    const { count } = await serviceClient
      .from('user_actress_preferences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
