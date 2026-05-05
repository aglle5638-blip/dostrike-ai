/**
 * FANZA API v3 の型定義
 * https://affiliate.dmm.com/api/v3/
 *
 * API キー到着後、これらの型が実レスポンスと 1:1 で対応します。
 */

// ─── FANZA API リクエストパラメータ ───────────────────────────────
export interface FanzaSearchParams {
  site?: 'FANZA' | 'DMM.co.jp';
  service?: 'digital' | 'mono' | 'rental';
  floor?: 'videoa' | 'videoc' | 'anime' | 'doujin' | 'pcgame';
  hits?: number;         // 1–100
  offset?: number;       // ページネーション
  sort?: FanzaSortType;
  keyword?: string;
  article?: string;      // 絞り込み種別 (actress, genre など)
  article_id?: number;
}

export type FanzaSortType =
  | 'rank'        // 売上ランキング
  | 'date'        // 新着
  | 'review'      // レビュー評価順
  | 'price_asc'
  | 'price_desc';

// ─── FANZA API レスポンス ─────────────────────────────────────────
export interface FanzaApiResponse {
  result: {
    status: number;
    result_count: number;
    total_count: number;
    first_position: number;
    site_name: string;
    site_code: string;
    service_name: string;
    service_code: string;
    floor_id: string;
    floor_name: string;
    floor_code: string;
    items: FanzaApiItem[];
  };
}

export interface FanzaApiItem {
  service_code: string;
  service_name: string;
  floor_code: string;
  floor_name: string;
  category_name: string;
  content_id: string;
  product_id: string;
  title: string;
  volume: string;          // 分数
  URL: string;             // 商品ページ
  affiliateURL: string;    // アフィリエイトURL
  date: string;            // "YYYY-MM-DD HH:MM:SS"
  imageURL: {
    list: string;          // サムネイル（小）
    small: string;
    large: string;
  };
  sampleImageURL?: {
    sample_s?: Record<string, string>;  // "1": url, "2": url …
  };
  sampleMovieURL?: {
    size_476_306?: string;
    size_560_360?: string;
    size_644_414?: string;
    size_720_480?: string;
  };
  prices: {
    price: string;         // "1,980" 単位: 円
    list_price?: string;
    deliveries?: {
      delivery: {
        type: string;
        price: string;
      }[];
    };
  };
  review?: {
    count: number;
    average: string;       // "4.50"
  };
  iteminfo?: {
    actress?: { id: number; name: string; ruby?: string }[];
    genre?: { id: number; name: string }[];
    series?: { id: number; name: string }[];
    maker?: { id: number; name: string }[];
    label?: { id: number; name: string }[];
    director?: { id: number; name: string }[];
    keyword?: { id: number; name: string }[];
  };
}

// ─── アプリ内の統一ビデオ型 ──────────────────────────────────────
export interface VideoResult {
  id: string;
  title: string;
  actress: string;
  thumbnailUrl: string;
  sampleImageUrl?: string;
  sampleMovieUrl?: string;
  durationMin?: number;     // 再生時間（分）
  price?: string;
  reviewCount?: number;
  reviewAverage?: number;
  releaseDate?: string;
  tags: string[];
  affiliateUrl: string;
  matchScore: number;       // 0–100
  source: 'fanza' | 'mock';
}

// ─── /api/videos/recommend のリクエスト/レスポンス ────────────────
export interface RecommendRequest {
  slotTypeIds: string[];    // 例: ["A1", "B3"]
  sortBy?: SortBy;
  limit?: number;
  offset?: number;
  keyword?: string;
  skipActressMatch?: boolean; // true = トレンドモード：女優ルートをスキップしキーワード検索へ直行
}

export type SortBy = 'match' | 'rank' | 'date' | 'review' | 'price_asc' | 'price_desc';

export interface RecommendResponse {
  videos: VideoResult[];
  source: 'fanza' | 'mock' | 'cache';
  usedKeywords: string[];
  totalCount?: number;
}

// ─── /api/videos/feedback のリクエスト/レスポンス ─────────────────
export interface FeedbackRequest {
  videoId: string;
  action: 'keep' | 'strike' | '';  // '' = 解除
  faceTypeId?: string;              // フィードバック時のアクティブタイプ
  videoMeta?: Pick<VideoResult, 'title' | 'thumbnailUrl' | 'affiliateUrl' | 'actress' | 'matchScore' | 'tags' | 'price' | 'reviewAverage' | 'durationMin'>;
}

export interface FeedbackResponse {
  success: boolean;
  videoId: string;
  action: string;
}

/** GET /api/videos/feedback のレスポンス */
export interface FeedbackListResponse {
  feedback: Record<string, string>;                    // videoId → action
  videoMeta: Record<string, FeedbackRequest['videoMeta']>; // videoId → metadata
}
