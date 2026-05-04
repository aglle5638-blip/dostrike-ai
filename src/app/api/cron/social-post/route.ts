/**
 * POST /api/cron/social-post
 *
 * Vercel Cron（JST 8:00 / 12:00 / 21:00）から呼ばれる自動投稿エンドポイント。
 * 実行内容:
 *   1. X (Twitter) API v2 でテキスト投稿
 *   2. Instagram Graph API でキャプション付き投稿（画像URLが設定されている場合）
 *   3. Supabase の social_posts テーブルに投稿ログを記録
 *
 * ローカルテスト:
 *   curl -X POST http://localhost:3000/api/cron/social-post \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 * 環境変数:
 *   CRON_SECRET                    — Vercel Cron 認証トークン
 *   TWITTER_API_KEY                — X API キー
 *   TWITTER_API_SECRET             — X API シークレット
 *   TWITTER_ACCESS_TOKEN           — X アクセストークン
 *   TWITTER_ACCESS_TOKEN_SECRET    — X アクセストークンシークレット
 *   INSTAGRAM_ACCESS_TOKEN         — Meta Graph API アクセストークン
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID  — Instagram ビジネスアカウント ID
 *   INSTAGRAM_CARD_IMAGE_URL       — 投稿に使う画像の公開URL（省略可）
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import {
  pickTemplate,
  getTodayFaceTypeId,
  truncateForX,
  SITE_URL,
} from '@/lib/social-templates';

// ─────────────────────────────────────────────────────────────────────────────
// X (Twitter) API v2 ヘルパー
// ─────────────────────────────────────────────────────────────────────────────

/** OAuth 1.0a 署名を生成する */
function buildOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  oauthParams: Record<string, string>,
): string {
  const allParams = { ...params, ...oauthParams };
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = [
    encodeURIComponent(process.env.TWITTER_API_SECRET ?? ''),
    encodeURIComponent(process.env.TWITTER_ACCESS_TOKEN_SECRET ?? ''),
  ].join('&');

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  const headerParts = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const headerStr = Object.entries(headerParts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');

  return `OAuth ${headerStr}`;
}

/**
 * X API v2 でツイートを投稿する。
 * @returns 成功時は投稿ID、失敗時は null
 */
async function postToX(text: string): Promise<{ id: string } | { error: string } | null> {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    return { error: 'X API credentials not configured (TWITTER_API_KEY or TWITTER_ACCESS_TOKEN missing)' };
  }

  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const authHeader = buildOAuthHeader(method, url, {}, oauthParams);
  const body = JSON.stringify({ text });

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[social-post] X API error:', res.status, errText);
    return { error: `HTTP ${res.status}: ${errText}` };
  }

  const json = await res.json();
  const postId = json?.data?.id;
  if (!postId) return { error: `Unexpected response: ${JSON.stringify(json)}` };
  return { id: postId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Instagram Graph API ヘルパー
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Instagram にキャプション付き投稿をする。
 * 画像URLが設定されていない場合は投稿をスキップする。
 * @returns 成功時は投稿ID、スキップ・失敗時は null
 */
async function postToInstagram(caption: string): Promise<string | null> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const imageUrl = process.env.INSTAGRAM_CARD_IMAGE_URL;

  if (!accessToken || !accountId) {
    console.warn('[social-post] Instagram credentials not configured, skipping');
    return null;
  }

  if (!imageUrl) {
    console.warn('[social-post] INSTAGRAM_CARD_IMAGE_URL not set, skipping Instagram post');
    return null;
  }

  // Step 1: メディアコンテナ作成
  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    },
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('[social-post] Instagram create media error:', createRes.status, err);
    return null;
  }

  const { id: containerId } = await createRes.json();

  // Step 2: 公開
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    },
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    console.error('[social-post] Instagram publish error:', publishRes.status, err);
    return null;
  }

  const { id: postId } = await publishRes.json();
  return postId ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase ログ保存
// ─────────────────────────────────────────────────────────────────────────────

async function logPost(data: {
  platform: string;
  content: string;
  post_id: string | null;
  status: 'posted' | 'failed' | 'skipped';
  face_type_id?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from('social_posts').insert({
    platform: data.platform,
    template_key: data.face_type_id ?? 'cta',
    content: data.content,
    post_id: data.post_id,
    status: data.status,
    posted_at: data.status === 'posted' ? new Date().toISOString() : null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// メインハンドラー
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 認証 ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET が設定されている場合のみトークン照合する
  // 未設定の場合は管理画面からの手動実行を許可する
  if (process.env.NODE_ENV !== 'development') {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, unknown> = { startedAt: new Date().toISOString() };

  // ── コンテンツ選択 ────────────────────────────────────────────────────────
  const faceTypeId = getTodayFaceTypeId();
  const xText = truncateForX(pickTemplate('x', faceTypeId));
  const igCaption = pickTemplate('instagram');

  results.faceTypeId = faceTypeId;
  results.xTextLength = xText.length;

  // ── X 投稿 ───────────────────────────────────────────────────────────────
  try {
    const xResult = await postToX(xText);
    if (xResult && 'id' in xResult) {
      results.x = { status: 'posted', postId: xResult.id };
      await logPost({ platform: 'x', content: xText, post_id: xResult.id, status: 'posted', face_type_id: faceTypeId });
    } else {
      const errMsg = xResult && 'error' in xResult ? xResult.error : 'unknown error';
      results.x = { status: 'failed', error: errMsg };
      await logPost({ platform: 'x', content: xText, post_id: null, status: 'failed', face_type_id: faceTypeId });
    }
  } catch (err) {
    console.error('[social-post] X error:', err);
    results.x = { status: 'error', error: String(err) };
    await logPost({ platform: 'x', content: xText, post_id: null, status: 'failed', face_type_id: faceTypeId });
  }

  // ── Instagram 投稿 ───────────────────────────────────────────────────────
  let igPostId: string | null = null;
  try {
    igPostId = await postToInstagram(igCaption);
    const status = igPostId ? 'posted' : 'skipped';
    results.instagram = { status, postId: igPostId };
    await logPost({
      platform: 'instagram',
      content: igCaption,
      post_id: igPostId,
      status: igPostId ? 'posted' : 'skipped',
      face_type_id: faceTypeId,
    });
  } catch (err) {
    console.error('[social-post] Instagram error:', err);
    results.instagram = { status: 'error', error: String(err) };
    await logPost({ platform: 'instagram', content: igCaption, post_id: null, status: 'failed', face_type_id: faceTypeId });
  }

  results.completedAt = new Date().toISOString();

  return NextResponse.json({ success: true, results });
}

// Vercel Cron は GET リクエストでも呼び出せるようにする
export async function GET(request: NextRequest) {
  return POST(request);
}
