/**
 * POST /api/cron/social-post
 *
 * Vercel Cron（JST 8:00 / 12:00 / 21:00）から呼ばれる自動投稿エンドポイント。
 * 実行内容:
 *   1. X (Twitter) API v2 でテキスト投稿
 *      - 画像①: FANZA ActressSearch でキーワード一致の女優プロフィール写真
 *      - 画像②: generate-marketing-image でスマホモックアップを動的生成
 *   2. Supabase の social_posts テーブルに投稿ログを記録
 *
 * ローカルテスト:
 *   curl -X POST http://localhost:3000/api/cron/social-post \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import {
  getTodayMarketingSet,
  fillTemplate,
  truncateForX,
  X_TIME_TEMPLATES,
  SITE_URL,
} from '@/lib/social-templates';

// ─────────────────────────────────────────────────────────────────────────────
// FANZA ActressSearch: キーワード一致の女優プロフィール写真を取得
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 女優名で FANZA ActressSearch を呼び出しプロフィール写真URL を返す。
 * 動画サムネイル（パッケ画）より一貫性が高く、テキストと整合した画像を得られる。
 */
async function fetchActressProfileImage(actressName: string): Promise<string | null> {
  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) return null;
  try {
    const params = new URLSearchParams({
      site: 'FANZA',
      keyword: actressName,
      hits: '5',
      offset: '1',
      affiliate_id: affiliateId,
      api_id: apiKey,
      output: 'json',
    });
    const res = await fetch(
      `https://api.dmm.com/affiliate/v3/ActressSearch?${params}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      result: {
        status: string | number;
        actress?: Array<{ name: string; imageURL?: { large?: string; small?: string } }>;
      };
    };
    if (String(data.result.status) !== '200') return null;
    const actresses = data.result.actress ?? [];
    // 完全一致優先、なければ先頭
    const pick = actresses.find(a => a.name === actressName) ?? actresses[0];
    return pick?.imageURL?.large ?? pick?.imageURL?.small ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// X 画像アップロード (multipart/form-data)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 画像URLを取得して X Media Upload API (v1.1) にアップロードする。
 * multipart/form-data + raw binary を使用（base64 URL エンコードの二重エンコード問題を回避）。
 * @returns media_id_string または null
 */
async function uploadImageToX(imageUrl: string): Promise<string | null> {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  if (!apiKey || !accessToken) {
    console.warn('[social-post] Twitter credentials missing, skipping image upload');
    return null;
  }

  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) {
      console.error('[social-post] Failed to fetch image:', imgRes.status, imageUrl.slice(0, 100));
      return null;
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    console.log(`[social-post] Fetched image: ${arrayBuffer.byteLength} bytes, type: ${mimeType}`);

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
    // multipart/form-data: ボディパラメータは OAuth シグネチャに含めない
    const authHeader = buildOAuthHeader(uploadMethod, uploadUrl, {}, oauthParams);

    // FormData (multipart) + raw binary — base64 URLエンコードの問題を回避
    const form = new FormData();
    form.append('media', new Blob([arrayBuffer], { type: mimeType }), 'upload');

    const uploadRes = await fetch(uploadUrl, {
      method: uploadMethod,
      headers: { Authorization: authHeader },
      // Content-Type は fetch が multipart/form-data; boundary=... を自動設定
      body: form,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('[social-post] Media upload error:', uploadRes.status, err);
      return null;
    }

    const uploadJson = await uploadRes.json();
    const mediaId = uploadJson?.media_id_string ?? null;
    console.log('[social-post] Uploaded media_id:', mediaId);
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
async function postToX(
  text: string,
  mediaIds?: string[],
): Promise<{ id: string } | { error: string } | null> {
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
  const payload: Record<string, unknown> = { text };
  if (mediaIds && mediaIds.length > 0) payload.media = { media_ids: mediaIds };
  const body = JSON.stringify(payload);

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

  if (process.env.NODE_ENV !== 'development') {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, unknown> = { startedAt: new Date().toISOString() };

  // ── 時間帯判定（UTC→JST）────────────────────────────────────────────────
  const jstHour = (new Date().getUTCHours() + 9) % 24;
  const timeSlot = jstHour < 10 ? 'morning' : jstHour < 17 ? 'noon' : 'evening';

  // ── コンテンツ選択 ────────────────────────────────────────────────────────
  const marketingSet = getTodayMarketingSet();
  const faceTypeId = marketingSet.id;

  const useTimeTemplate = marketingSet.id === 'ui_mockup' && Math.random() < 0.5;
  const timeTemplates = X_TIME_TEMPLATES[timeSlot];

  let rawXText = '';
  if (useTimeTemplate && timeTemplates?.length) {
    rawXText = timeTemplates[Math.floor(Math.random() * timeTemplates.length)];
  } else {
    rawXText = marketingSet.templates[Math.floor(Math.random() * marketingSet.templates.length)];
  }
  rawXText = fillTemplate(rawXText, { URL: SITE_URL });

  const xText = truncateForX(rawXText);

  results.faceTypeId = faceTypeId;
  results.timeSlot = timeSlot;
  results.xTextLength = xText.length;

  // ── 画像選択 ────────────────────────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dostrike-ai.vercel.app';
  const extSet = marketingSet as typeof marketingSet & { searchKeyword?: string; cardTag?: string };
  const keyword = extSet.searchKeyword;
  const cardTag = extSet.cardTag ?? 'AI提案';

  // ① コンテンツ画像: FANZA で女優名を取得 → ActressSearch でプロフィール写真を取得
  //    投稿テキストの女優タイプ（清楚/ギャル/クール等）と画像を確実に一致させる
  let contentImageUrl: string = `${baseUrl}/post-images/${marketingSet.imageFile}`;
  let actressNameForCard = '';

  try {
    const { fetchVideosByTypeIds } = await import('@/lib/fanza/api');
    const { videos } = await fetchVideosByTypeIds(
      [marketingSet.faceTypeId],
      { limit: 10, keyword },
    );
    if (videos.length > 0) {
      const pick = videos[Math.floor(Math.random() * videos.length)];
      if (pick.actress) actressNameForCard = pick.actress.split(/[・、,，]/)[0].trim();
    }
  } catch (err) {
    console.warn('[social-post] Failed to fetch actress name from FANZA:', err);
  }

  // ActressSearch でプロフィール写真を取得（動画サムネイルより一貫性が高い）
  if (actressNameForCard) {
    try {
      const profileUrl = await fetchActressProfileImage(actressNameForCard);
      if (profileUrl) {
        contentImageUrl = profileUrl;
        console.log(`[social-post] Using actress profile photo for "${actressNameForCard}": ${profileUrl.slice(0, 80)}`);
      } else {
        console.warn(`[social-post] No profile photo found for "${actressNameForCard}", using fallback`);
      }
    } catch (err) {
      console.warn('[social-post] fetchActressProfileImage error:', err);
    }
  }

  // ② スマホモックアップ画像: generate-marketing-image で動的生成
  //    女優プロフィール写真をカード内に埋め込み、使いたくなるビジュアルを生成
  const mockupParams = new URLSearchParams({ liked: 'true', tag: cardTag });
  // 静的フォールバック画像以外ならカード内画像として渡す
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
    try {
      const mediaId = await uploadImageToX(url);
      if (mediaId) uploadedMediaIds.push(mediaId);
      else console.warn('[social-post] uploadImageToX returned null for:', url.slice(0, 100));
    } catch (err) {
      console.warn('[social-post] Image upload failed for', url.slice(0, 100), ':', err);
    }
  }

  results.uploadedMediaIds = uploadedMediaIds.length > 0 ? uploadedMediaIds : 'none';

  // ── X 投稿 ───────────────────────────────────────────────────────────────
  try {
    const xResult = await postToX(xText, uploadedMediaIds);
    if (xResult && 'id' in xResult) {
      results.x = { status: 'posted', postId: xResult.id, images: uploadedMediaIds.length };
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

  results.completedAt = new Date().toISOString();

  return NextResponse.json({ success: true, results });
}

// Vercel Cron は GET リクエストでも呼び出せるようにする
export async function GET(request: NextRequest) {
  return POST(request);
}
