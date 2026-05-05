/**
 * POST /api/cron/social-post
 *
 * Vercel Cron（JST 8:00 / 12:00 / 21:00）から呼ばれる自動投稿エンドポイント。
 * 実行内容:
 *   1. 今日のマーケティングセットを取得（22種類を日別ローテーション）
 *   2. searchKeyword で FANZA 動画を検索 → パッケージ画像を取得
 *      - テキスト内容（清楚系/ギャル系/etc.）と動画パッケ画が確実に一致
 *   3. X (Twitter) API v2 でテキスト+画像投稿
 *      - 画像①: FANZAパッケ画（テキストと同一キーワードで検索）
 *      - 画像②: generate-marketing-image でスマホモックアップを動的生成
 *   4. Supabase の social_posts テーブルに投稿ログを記録
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import {
  getTodayMarketingSet,
  fillTemplate,
  truncateForX,
  SITE_URL,
} from '@/lib/social-templates';

// ─────────────────────────────────────────────────────────────────────────────
// X 画像アップロード (multipart/form-data)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 画像URLを取得して X Media Upload API (v1.1) にアップロードする。
 * multipart/form-data + raw binary を使用（URLSearchParams base64の二重エンコード問題を回避）。
 */
async function uploadImageToX(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  if (!apiKey || !accessToken) {
    console.warn('[social-post] Twitter credentials missing, skipping upload');
    return null;
  }

  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) {
      console.error('[social-post] Image fetch failed:', imgRes.status, imageUrl.slice(0, 120));
      return null;
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    console.log(`[social-post] Fetched ${arrayBuffer.byteLength}B ${mimeType}`);

    const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const uploadMethod = 'POST';
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
    // multipart/form-data: ボディは OAuth シグネチャに含めない
    const authHeader = buildOAuthHeader(uploadMethod, uploadUrl, {}, oauthParams);

    const form = new FormData();
    form.append('media', new Blob([arrayBuffer], { type: mimeType }), 'upload');

    const uploadRes = await fetch(uploadUrl, {
      method: uploadMethod,
      headers: { Authorization: authHeader },
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('[social-post] Media upload failed:', uploadRes.status, err);
      return null;
    }

    const json = await uploadRes.json();
    const mediaId = json?.media_id_string ?? null;
    console.log('[social-post] media_id:', mediaId);
    return mediaId;
  } catch (err) {
    console.error('[social-post] uploadImageToX error:', err);
    return null;
  }
}

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

  const headerParts = { ...oauthParams, oauth_signature: signature };
  const headerStr = Object.entries(headerParts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');

  return `OAuth ${headerStr}`;
}

async function postToX(
  text: string,
  mediaIds?: string[],
): Promise<{ id: string } | { error: string }> {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;

  if (!apiKey || !accessToken) {
    return { error: 'Twitter credentials not configured' };
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
  const payload: Record<string, unknown> = { text };
  if (mediaIds && mediaIds.length > 0) payload.media = { media_ids: mediaIds };

  const res = await fetch(url, {
    method,
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
// Supabase ログ
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
  if (process.env.NODE_ENV !== 'development') {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, unknown> = { startedAt: new Date().toISOString() };

  // ── マーケティングセット選択（22種類を日別ローテーション）─────────────────
  const marketingSet = getTodayMarketingSet();
  const faceTypeId = marketingSet.id;
  const extSet = marketingSet as typeof marketingSet & { searchKeyword?: string; cardTag?: string };
  const searchKeyword = extSet.searchKeyword;
  const cardTag = extSet.cardTag ?? 'AI提案';

  // テンプレートをランダムに選択
  const rawXText = fillTemplate(
    marketingSet.templates[Math.floor(Math.random() * marketingSet.templates.length)],
    { URL: SITE_URL },
  );
  const xText = truncateForX(rawXText);

  results.setId = faceTypeId;
  results.label = marketingSet.label;
  results.keyword = searchKeyword;

  // ── 画像選択 ────────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dostrike-ai.vercel.app';

  // ① FANZAパッケ画: searchKeyword と完全一致したキーワードで検索
  //    「清楚系」テキスト → keyword:'清楚' → FANZAの清楚系パッケ画
  //    「ギャル系」テキスト → keyword:'ギャル' → FANZAのギャル系パッケ画
  let contentImageUrl: string = `${baseUrl}/post-images/${marketingSet.imageFile}`;
  let actressNameForCard = '';

  try {
    const { fetchVideosByTypeIds } = await import('@/lib/fanza/api');
    const { videos } = await fetchVideosByTypeIds(
      [marketingSet.faceTypeId],
      { limit: 10, keyword: searchKeyword },
    );
    if (videos.length > 0) {
      const pick = videos[Math.floor(Math.random() * videos.length)];
      if (pick.thumbnailUrl) {
        contentImageUrl = pick.thumbnailUrl;
        console.log('[social-post] FANZA thumbnail:', contentImageUrl.slice(0, 80));
      }
      if (pick.actress) {
        actressNameForCard = pick.actress.split(/[・、,，]/)[0].trim();
      }
    }
  } catch (err) {
    console.warn('[social-post] FANZA fetch failed, using fallback:', err);
  }

  // ② スマホモックアップ: generate-marketing-image でパッケ画をUI内に組み込む
  const mockupParams = new URLSearchParams({ liked: 'true', tag: cardTag });
  if (!contentImageUrl.includes('/post-images/')) {
    mockupParams.set('imageUrl', contentImageUrl);
  }
  if (actressNameForCard) mockupParams.set('name', actressNameForCard);
  const uiMockupImageUrl = `${baseUrl}/api/generate-marketing-image?${mockupParams}`;

  results.contentImageUrl = contentImageUrl.slice(0, 100);
  results.actressName = actressNameForCard;

  // ── 画像アップロード ────────────────────────────────────────────────────
  const uploadedMediaIds: string[] = [];
  for (const url of [contentImageUrl, uiMockupImageUrl]) {
    const mediaId = await uploadImageToX(url);
    if (mediaId) uploadedMediaIds.push(mediaId);
    else console.warn('[social-post] Upload returned null for:', url.slice(0, 100));
  }
  results.uploadedMediaIds = uploadedMediaIds.length > 0 ? uploadedMediaIds : 'none';

  // ── X 投稿 ───────────────────────────────────────────────────────────────
  try {
    const xResult = await postToX(xText, uploadedMediaIds);
    if ('id' in xResult) {
      results.x = { status: 'posted', postId: xResult.id, images: uploadedMediaIds.length };
      await logPost({ platform: 'x', content: xText, post_id: xResult.id, status: 'posted', face_type_id: faceTypeId });
    } else {
      results.x = { status: 'failed', error: xResult.error };
      await logPost({ platform: 'x', content: xText, post_id: null, status: 'failed', face_type_id: faceTypeId });
    }
  } catch (err) {
    console.error('[social-post] X post error:', err);
    results.x = { status: 'error', error: String(err) };
    await logPost({ platform: 'x', content: xText, post_id: null, status: 'failed', face_type_id: faceTypeId });
  }

  results.completedAt = new Date().toISOString();
  return NextResponse.json({ success: true, results });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
