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
    keyword?: string;
  } = {}
): Promise<{ videos: VideoResult[]; source: 'fanza' | 'mock'; usedKeywords: string[]; totalCount?: number }> {
  const { sortBy = 'match', limit = 12, offset = 0, keyword: keywordOverride } = options;
  const keywords = aggregateKeywords(typeIds);

  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey = process.env.FANZA_API_KEY;

  // ── 本番: FANZA API（キーワードフォールバック付き）────────────────
  if (affiliateId && apiKey) {
    try {
      // キーワード直接指定の場合はそのまま使用
      if (keywordOverride) {
        const videos = await callFanzaApi(
          { keyword: keywordOverride, sort: SORT_MAP[sortBy] as FanzaSearchParams['sort'], hits: limit, offset },
          affiliateId,
          apiKey,
          typeIds
        );
        return { videos, source: 'fanza', usedKeywords: [keywordOverride] };
      }
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
    sampleMovieUrl: item.sampleMovieURL?.size_720_480 ?? item.sampleMovieURL?.size_644_414 ?? item.sampleMovieURL?.size_560_360 ?? item.sampleMovieURL?.size_476_306,
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

// ─── 女優ID指定で動画を取得 ───────────────────────────────────────
/**
 * FANZA ItemList を article=actress で絞り込んで動画を取得する。
 * actress_face_matches テーブルで得た女優IDを渡す。
 */
export async function fetchVideosByActressIds(
  actressIds: string[],
  options: { limit?: number; sortBy?: SortBy } = {}
): Promise<VideoResult[]> {
  const { limit = 20, sortBy = 'rank' } = options;
  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey      = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) return [];

  const perActress = Math.ceil(limit / actressIds.length);

  // 女優ごとのAPIコールを並列実行（直列→並列でレイテンシ大幅削減）
  const results = await Promise.allSettled(
    actressIds.map(async (actressId) => {
      const query = new URLSearchParams({
        site:         'FANZA',
        service:      'digital',
        floor:        'videoa',
        hits:         String(Math.min(perActress + 2, 20)),
        offset:       '1',
        sort:         SORT_MAP[sortBy] ?? 'rank',
        article:      'actress',
        article_id:   actressId,
        affiliate_id: affiliateId,
        api_id:       apiKey,
        output:       'json',
      });
      const res = await fetch(`${FANZA_API_BASE}?${query}`, { next: { revalidate: 3600 } });
      if (!res.ok) return [];
      const data = (await res.json()) as FanzaApiResponse;
      if (data.result.status !== 200) return [];
      return data.result.items ?? [];
    })
  );

  const allVideos: VideoResult[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (!seen.has(item.content_id)) {
        seen.add(item.content_id);
        allVideos.push(mapFanzaItemToVideo(item, allVideos.length, affiliateId, []));
      }
    }
  }

  return allVideos.slice(0, limit);
}

// ─── 女優名検索 ───────────────────────────────────────────────
/**
 * 女優名でFANZA ActressSearch APIを呼び出しIDを取得する
 * フィードバック学習でいいねした女優のIDを特定するために使用
 */
export async function searchActressByName(name: string): Promise<string | null> {
  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) return null;
  try {
    const params = new URLSearchParams({
      site: 'FANZA',
      keyword: name,
      hits: '3',
      offset: '1',
      affiliate_id: affiliateId,
      api_id: apiKey,
      output: 'json',
    });
    const res = await fetch(`https://api.dmm.com/affiliate/v3/ActressSearch?${params}`, {
      next: { revalidate: 86400 }, // 24h cache
    });
    if (!res.ok) return null;
    const data = await res.json() as { result: { status: string | number; actress?: Array<{ id: string; name: string }> } };
    if (String(data.result.status) !== '200') return null;
    const actresses = data.result.actress ?? [];
    // 名前が完全一致するものを優先
    const exact = actresses.find(a => a.name === name);
    return exact?.id ?? actresses[0]?.id ?? null;
  } catch {
    return null;
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
