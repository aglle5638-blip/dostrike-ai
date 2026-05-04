/**
 * POST /api/admin/trigger-post
 *
 * 管理画面の「今すぐ投稿」ボタン用のサーバーサイドプロキシ。
 * CRON_SECRET をサーバー側で付与して /api/cron/social-post を呼ぶ。
 * クライアントに CRON_SECRET を露出させない設計。
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // ADMIN_SECRET 認証
  if (process.env.NODE_ENV !== 'development') {
    const adminSecret = process.env.ADMIN_SECRET;
    const header = request.headers.get('x-admin-secret');
    if (!adminSecret || header !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const cronSecret = process.env.CRON_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dostrike-ai.vercel.app';

  try {
    const res = await fetch(`${baseUrl}/api/cron/social-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // CRON_SECRET が設定されていない場合でも空文字で呼ぶ
        ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
      },
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error('[trigger-post] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
