import { NextRequest, NextResponse } from "next/server";
import type { FaceFeatures } from "../analyze-face/route";

/**
 * POST /api/match-videos
 * Body: { features: FaceFeatures, searchKeywords: string[], sortBy?: string }
 *
 * FANZA API未取得の間はモックデータを返す。
 * FANZA APIキーが設定されたら自動的にリアルデータに切り替わる。
 *
 * Returns: { videos: VideoResult[], source: 'fanza' | 'mock', usedKeywords: string[] }
 */

export interface VideoResult {
  id: string;
  title: string;
  actress: string;
  thumbnailUrl: string;
  sampleUrl?: string;
  price?: string;
  reviewCount?: number;
  reviewAverage?: number;
  releaseDate?: string;
  tags: string[];
  affiliateUrl: string;
  matchScore: number; // 0-100
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { features, searchKeywords, sortBy = "match" } = body as {
      features: FaceFeatures;
      searchKeywords: string[];
      sortBy?: string;
    };

    if (!features || !searchKeywords) {
      return NextResponse.json(
        { error: "featuresとsearchKeywordsは必須です" },
        { status: 400 }
      );
    }

    // FANZA APIキーが設定されていればリアルAPIを使用
    const fanzaAffiliateId = process.env.FANZA_AFFILIATE_ID;
    const fanzaApiKey = process.env.FANZA_API_KEY;

    if (fanzaAffiliateId && fanzaApiKey) {
      return await fetchFromFanza(features, searchKeywords, sortBy, fanzaAffiliateId, fanzaApiKey);
    }

    // FANZAキー未設定: モックデータでPoC検証
    return mockMatchVideos(features, searchKeywords, sortBy);
  } catch (err) {
    console.error("[match-videos] Error:", err);
    return NextResponse.json(
      { error: "マッチング処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// ============================================================
// FANZA API実装（APIキー取得後に有効化される）
// ============================================================
async function fetchFromFanza(
  features: FaceFeatures,
  keywords: string[],
  sortBy: string,
  affiliateId: string,
  _apiKey: string
): Promise<NextResponse> {
  // FANZAのソートパラメータへの変換
  const sortMap: Record<string, string> = {
    match: "rank",
    rank: "rank",
    date: "date",
    review: "review",
    price_asc: "price_asc",
    price_desc: "price_desc",
  };
  const fanzaSort = sortMap[sortBy] ?? "rank";

  // 上位3キーワードを使って検索
  const keyword = keywords.slice(0, 3).join(" ");

  const params = new URLSearchParams({
    site: "FANZA",
    service: "digital",
    floor: "videoa",
    hits: "20",
    sort: fanzaSort,
    keyword,
    affiliate_id: affiliateId,
    api_id: "dummy", // FANZA APIはaffiliate_idのみで動作
    output: "json",
  });

  const url = `https://api.dmm.com/affiliate/v3/ItemList?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FANZA API error: ${res.status}`);
  }

  const data = await res.json();
  const items = data?.result?.items ?? [];

  const videos: VideoResult[] = items.map((item: Record<string, unknown>, i: number) => {
    const reviewData = item.review as Record<string, number> | undefined;
    const imageUrls = item.imageURL as Record<string, string> | undefined;
    const sampleImages = item.sampleImageURL as { sample_s?: Record<string, string> } | undefined;
    const prices = item.prices as Record<string, string> | undefined;
    const itemInfo = item.iteminfo as Record<string, { id: number; name: string }[]> | undefined;

    return {
      id: String(item.content_id ?? i),
      title: String(item.title ?? ""),
      actress: itemInfo?.actress?.[0]?.name ?? "不明",
      thumbnailUrl: imageUrls?.large ?? imageUrls?.small ?? "",
      sampleUrl: sampleImages?.sample_s?.["1"] ?? undefined,
      price: prices?.price ?? undefined,
      reviewCount: reviewData?.count,
      reviewAverage: reviewData?.average,
      releaseDate: String(item.date ?? ""),
      tags: (itemInfo?.keyword ?? []).map((k) => k.name).slice(0, 5),
      affiliateUrl: String(item.affiliateURL ?? item.URL ?? ""),
      matchScore: Math.max(60, 99 - i * 2),
    };
  });

  return NextResponse.json({
    videos,
    source: "fanza" as const,
    usedKeywords: keywords,
  });
}

// ============================================================
// モックデータ（FANZA APIキー取得前のPoC用）
// ============================================================
function mockMatchVideos(
  features: FaceFeatures,
  keywords: string[],
  sortBy: string
): NextResponse {
  const MOCK_ACTRESSES = [
    "橘ひなた", "天使もえ", "優木かな", "美咲かんな", "七海ティナ",
    "伊東ちなみ", "夢乃あいか", "河北彩花", "桃乃木かな", "葵つかさ",
  ];

  const UNSPLASH_IDS = [
    "1579782522718-d731855a9062", "1580489944761-15a19d654956",
    "1544005313-94ddf0286df2", "1531746020798-e6953c6e8e04",
    "1562916172-8874bb7c1b7e", "1517365830460-955ce3ccd263",
    "1508214751196-bcfd4ca60f91", "1534528741775-53994a69daeb",
    "1519781542700-1bfa3c675661", "1546961329-78bef0414d7c",
  ];

  const MOCK_TITLES = [
    `【完全独占】${features.impression?.[0] ?? "清楚系"}の逸材・超新人衝撃デビュー`,
    `${features.hairColor ?? "黒髪"}${features.hairLength ?? "ロング"}の美女とドキドキ密室プレミアム`,
    `${features.ageRange ?? "20代前半"}の${features.impression?.[0] ?? "かわいい系"}美女、初めての撮影に挑戦`,
    `${features.eyeType ?? "大きい目"}が印象的な${features.faceShape ?? "小顔"}美人と二人きりの週末旅行`,
    `${features.skinTone ?? "色白"}透明感あふれる清楚美人の秘密の素顔に完全密着`,
    `次世代を担う実力派・AV界の原石が遂にベールを脱ぐ衝撃の120分`,
    `誰もが振り返る天使のような笑顔とプロポーションに密着した傑作`,
    `業界震撼の超大型新人登場！容姿端麗な彼女の予測不能なギャップ`,
    `清楚で上品な彼女の隠された一面を解き明かす人気シリーズ最新作`,
    `SNSで話題沸騰！リアルな素朴さと美しさを兼ね備えた記録の傑作`,
  ];

  // ソート基準でスコアを変える
  const scores = MOCK_ACTRESSES.map((_, i) =>
    sortBy === "review" ? 95 - i : sortBy === "date" ? 98 - i * 3 : 99 - i * 2
  );

  const videos: VideoResult[] = MOCK_ACTRESSES.map((actress, i) => ({
    id: `mock-${i}`,
    title: MOCK_TITLES[i % MOCK_TITLES.length],
    actress,
    thumbnailUrl: `https://images.unsplash.com/photo-${UNSPLASH_IDS[i % UNSPLASH_IDS.length]}?w=400&h=225&fit=crop`,
    price: `${(1980 + i * 200).toLocaleString()}円`,
    reviewCount: 150 + i * 23,
    reviewAverage: parseFloat((4.1 + Math.random() * 0.8).toFixed(1)),
    releaseDate: `2026-0${Math.floor(i / 3) + 1}-${(i % 28) + 1}`,
    tags: keywords.slice(0, 3),
    affiliateUrl: "https://al.dmm.co.jp/?lurl=https://www.dmm.co.jp/digital/videoa/-/",
    matchScore: scores[i],
  }));

  // ソート適用
  if (sortBy === "review") {
    videos.sort((a, b) => (b.reviewAverage ?? 0) - (a.reviewAverage ?? 0));
  } else if (sortBy === "date") {
    videos.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  } else if (sortBy === "price_asc") {
    videos.sort((a, b) => parseInt(a.price ?? "0") - parseInt(b.price ?? "0"));
  } else if (sortBy === "price_desc") {
    videos.sort((a, b) => parseInt(b.price ?? "0") - parseInt(a.price ?? "0"));
  } else {
    videos.sort((a, b) => b.matchScore - a.matchScore);
  }

  return NextResponse.json({
    videos,
    source: "mock" as const,
    usedKeywords: keywords,
    note: "FANZA APIキー設定後にリアルデータに自動切替されます",
  });
}
