/**
 * GET /api/admin/social-posts
 *
 * 管理画面向け: 投稿ログを取得する API。
 * CRON_SECRET を Bearer トークンとして認証する。
 *
 * クエリパラメータ:
 *   platform  - 'x' | 'instagram' | 全件(省略)
 *   status    - 'posted' | 'failed' | 'skipped' | 全件(省略)
 *   limit     - 件数上限 (デフォルト 50)
 *   page      - ページ番号 (デフォルト 0)
 *
 * POST /api/admin/social-posts/trigger
 *   手動投稿トリガー（管理画面の「今すぐ投稿」ボタン用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'x-admin-secret, content-type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false; // 本番では必ず設定すること
  const header = request.headers.get('x-admin-secret');
  return header === adminSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const status   = searchParams.get('status');
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);
  const page     = parseInt(searchParams.get('page') ?? '0', 10);

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  let query = supabase
    .from('social_posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (platform) query = query.eq('platform', platform);
  if (status)   query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin/social-posts] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 集計統計
  const { data: stats } = await supabase
    .from('social_posts')
    .select('platform, status')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const summary = {
    total: count ?? 0,
    lastWeek: {
      x: {
        posted: stats?.filter((r) => r.platform === 'x' && r.status === 'posted').length ?? 0,
        failed: stats?.filter((r) => r.platform === 'x' && r.status === 'failed').length ?? 0,
      },
      instagram: {
        posted: stats?.filter((r) => r.platform === 'instagram' && r.status === 'posted').length ?? 0,
        failed: stats?.filter((r) => r.platform === 'instagram' && r.status === 'failed').length ?? 0,
      },
    },
  };

  return NextResponse.json({ posts: data, summary }, { headers: CORS });
}

