/**
 * FANZA API クライアント
 *
 * ## キー到着後の接続手順
 * 1. .env.local に以下を追記:
 *    FANZA_AFFILIATE_ID=xxxx-999
 *    FANZA_API_KEY=xxxxxxxxxxxxxxxx
 * 2. このファイルへの変更は不要。自動的に実 API に切り替わる。
 *
 * ## 開発中（キーなし）
 * mock-data.ts のモックデータを返す。
 */

import type {
  FanzaSearchParams,
  FanzaApiResponse,
  FanzaApiItem,
  VideoResult,
  SortBy,
} from './types';
import { aggregateKeywords, buildFanzaKeyword, buildFanzaKeywordCandidates, calcMatchScore } from './keywords';
import { generateMockVideos } from './mock-data';

const FANZA_API_BASE = 'https://api.dmm.com/affiliate/v3/ItemList';

// ─── ソート変換マップ ─────────────────────────────────────────────
const SORT_MAP: Record<SortBy, string> = {
  match:      'rank',
  rank:       'rank',
  date:       'date',
  review:     'review',
  price_asc:  'price_asc',
  price_desc: 'price_desc',
};

// ─── FANZA API アフィリエイト URL ビルダー ────────────────────────
/**
 * FANZA アフィリエイト URL を構築する。
 * キーなし環境では FANZA の商品ページ URL をそのまま返す。
 */
export function buildAffiliateUrl(productUrl: string, affiliateId?: string): string {
  if (!affiliateId) return productUrl;
  const encoded = encodeURIComponent(productUrl);
  return `https://al.dmm.co.jp/?lurl=${encoded}&af_id=${affiliateId}&ch=api`;
}

// ─── メイン: 動画検索 ─────────────────────────────────────────────
/**
 * 顔タイプ ID 配列から動画を検索する。
 * - FANZA_AFFILIATE_ID / FANZA_API_KEY が設定されていれば実 API
 * - 未設定ならモックデータ
 */
export async function fetchVideosByTypeIds(
  typeIds: string[],
  options: {
    sortBy?: SortBy;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ videos: VideoResult[]; source: 'fanza' | 'mock'; usedKeywords: string[]; totalCount?: number }> {
  const { sortBy = 'match', limit = 12, offset = 0 } = options;
  const keywords = aggregateKeywords(typeIds);

  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey = process.env.FANZA_API_KEY;

  // ── 本番: FANZA API（キーワードフォールバック付き）────────────────
  if (affiliateId && apiKey) {
    try {
      const candidates = buildFanzaKeywordCandidates(typeIds);
      let videos: VideoResult[] = [];
      for (const keyword of candidates) {
        videos = await callFanzaApi(
          { keyword, sort: SORT_MAP[sortBy] as FanzaSearchParams['sort'], hits: limit, offset },
          affiliateId,
          apiKey,
          typeIds
        );
        if (videos.length >= 5) break; // 十分な件数が取れたら終了
        console.log(`[fanza/api] keyword "${keyword}" returned ${videos.length} results, trying next candidate...`);
      }
      return { videos, source: 'fanza', usedKeywords: keywords };
    } catch (err) {
      console.error('[fanza/api] Real API failed, falling back to mock:', err);
    }
  }

  // ── モック ───────────────────────────────────────────────────────
  const videos = generateMockVideos(typeIds, limit, sortBy);
  return { videos, source: 'mock', usedKeywords: keywords };
}

// ─── FANZA API 呼び出し（内部） ───────────────────────────────────
async function callFanzaApi(
  params: FanzaSearchParams,
  affiliateId: string,
  apiKey: string,
  typeIds: string[]
): Promise<VideoResult[]> {
  const query = new URLSearchParams({
    site:         params.site ?? 'FANZA',
    service:      params.service ?? 'digital',
    floor:        params.floor ?? 'videoa',
    hits:         String(params.hits ?? 12),
    offset:       String((params.offset ?? 0) + 1),  // FANZA は 1-origin
    sort:         params.sort ?? 'rank',
    keyword:      params.keyword ?? '',
    affiliate_id: affiliateId,
    api_id:       apiKey,
    output:       'json',
  });

  const res = await fetch(`${FANZA_API_BASE}?${query.toString()}`, {
    next: { revalidate: 3600 }, // Next.js キャッシュ 1 時間
  });

  if (!res.ok) {
    throw new Error(`FANZA API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as FanzaApiResponse;

  if (data.result.status !== 200) {
    throw new Error(`FANZA API status ${data.result.status}`);
  }

  return data.result.items.map((item, i) =>
    mapFanzaItemToVideo(item, i, affiliateId, typeIds)
  );
}

// ─── FANZA レスポンス → VideoResult 変換 ─────────────────────────
function mapFanzaItemToVideo(
  item: FanzaApiItem,
  index: number,
  affiliateId: string,
  typeIds: string[]
): VideoResult {
  const actress = item.iteminfo?.actress?.[0]?.name ?? '不明';
  const tags = [
    ...(item.iteminfo?.genre?.map(g => g.name) ?? []),
    ...(item.iteminfo?.keyword?.map(k => k.name) ?? []),
  ].slice(0, 5);

  const reviewAvg = item.review?.average
    ? parseFloat(item.review.average)
    : undefined;

  const duration = item.volume ? parseInt(item.volume) : undefined;

  return {
    id: item.content_id,
    title: item.title,
    actress,
    thumbnailUrl: item.imageURL?.large ?? item.imageURL?.small ?? '',
    sampleImageUrl: item.sampleImageURL?.sample_s?.['1'],
    durationMin: duration,
    price: item.prices?.price,
    reviewCount: item.review?.count,
    reviewAverage: reviewAvg,
    releaseDate: item.date?.slice(0, 10),
    tags,
    affiliateUrl: item.affiliateURL || buildAffiliateUrl(item.URL, affiliateId),
    matchScore: calcMatchScore(tags, typeIds, Math.max(65, 99 - index * 2)),
    source: 'fanza',
  };
}

// ─── リンク生存確認 ───────────────────────────────────────────────
/**
 * URL が生きているか HEAD リクエストで確認する。
 * cron バッチで定期チェックに使用。
 */
export async function validateLink(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── レガシー互換 ─────────────────────────────────────────────────
/** @deprecated match-videos route との互換用。新規コードは fetchVideosByTypeIds を使うこと。 */
export interface FanzaItem {
  id: string;
  title: string;
  sampleImageUrl: string;
}

/** @deprecated */
export async function fetchFanzaItems(): Promise<FanzaItem[]> {
  const { videos } = await fetchVideosByTypeIds(['A1'], { limit: 10 });
  return videos.map(v => ({ id: v.id, title: v.title, sampleImageUrl: v.thumbnailUrl }));
}
