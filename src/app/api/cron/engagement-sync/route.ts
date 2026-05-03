/**
 * GET /api/cron/engagement-sync
 *
 * Vercel Cron（毎日 JST 10:00）から呼ばれる、
 * 投稿済みツイートのエンゲージメント（いいね・RT）を取得して
 * Supabase の social_posts テーブルを更新するバッチ。
 *
 * 注意: X API v2 のいいね・RT 取得は Basic プラン（$100/月）以上が必要。
 * Free tier では利用不可。
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

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
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  const headerParts = { ...oauthParams, oauth_signature: signature };
  return `OAuth ${Object.entries(headerParts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')}`;
}

async function fetchTweetMetrics(tweetId: string): Promise<{ likes: number; retweets: number } | null> {
  const apiKey = process.env.TWITTER_API_KEY;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  if (!apiKey || !accessToken) return null;

  const url = `https://api.twitter.com/2/tweets/${tweetId}`;
  const queryParams = { 'tweet.fields': 'public_metrics' };
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

  const authHeader = buildOAuthHeader('GET', url, queryParams, oauthParams);
  const res = await fetch(`${url}?${new URLSearchParams(queryParams)}`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) return null;
  const json = await res.json();
  const metrics = json?.data?.public_metrics;
  if (!metrics) return null;
  return {
    likes: metrics.like_count ?? 0,
    retweets: metrics.retweet_count ?? 0,
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== 'development') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // 過去7日以内の投稿済みXツイートを取得
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts } = await supabase
    .from('social_posts')
    .select('id, post_id, likes, retweets')
    .eq('platform', 'x')
    .eq('status', 'posted')
    .not('post_id', 'is', null)
    .gte('posted_at', since)
    .limit(20);

  if (!posts?.length) {
    return NextResponse.json({ success: true, message: '更新対象なし', updated: 0 });
  }

  let updated = 0;
  for (const post of posts) {
    if (!post.post_id) continue;
    try {
      const metrics = await fetchTweetMetrics(post.post_id);
      if (!metrics) continue;

      if (metrics.likes !== post.likes || metrics.retweets !== post.retweets) {
        await supabase
          .from('social_posts')
          .update({ likes: metrics.likes, retweets: metrics.retweets })
          .eq('id', post.id);
        updated++;
      }

      // API レート制限を避けるため 500ms 待機
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error('[engagement-sync] error for', post.post_id, err);
    }
  }

  return NextResponse.json({ success: true, checked: posts.length, updated });
}
