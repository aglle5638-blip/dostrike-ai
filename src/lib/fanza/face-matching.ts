/**
 * 顔タイプ × FANZA女優の類似度マッチングエンジン
 *
 * 流れ:
 *   1. 週次バッチで FANZA女優プロフィール画像を Gemini Vision 分析 → actress_profiles に保存
 *   2. 週次バッチで全30顔タイプと女優の類似スコアを計算 → actress_face_matches に保存
 *   3. /api/videos/recommend が actress_face_matches を参照して女優ID別動画を返す
 */

import { GoogleGenAI } from '@google/genai';
import type { FaceFeatures } from '@/app/api/analyze-face/route';

// ── 顔タイプ基準プロフィール ──────────────────────────────────────
export interface TypeFaceProfile {
  impression: string[];   // 清楚系 / かわいい系 / お姉さん系 / ギャル系 / クール系 / セクシー系
  hairColor:  string;     // 黒髪 / 茶髪 / 金髪
  hairLength: string;     // ショート / ミディアム / ロング
  skinTone:   string;     // 色白 / 健康的 / 日焼け
  features:   string[];   // 特徴キーワード（最大3）
}

export const TYPE_FACE_PROFILES: Record<string, TypeFaceProfile> = {
  // ─── GROUP A: 巨乳・グラマー系 ─────────────────────────────────
  A1: { impression:['かわいい系','清楚系'], hairColor:'黒髪', hairLength:'ロング',    skinTone:'色白',   features:['巨乳','グラマー'] },
  A2: { impression:['かわいい系'],          hairColor:'茶髪', hairLength:'ロング',    skinTone:'健康的', features:['巨乳','ギャル'] },
  A3: { impression:['お姉さん系','セクシー系'], hairColor:'黒髪', hairLength:'ロング', skinTone:'色白',   features:['巨乳','グラマー'] },
  A4: { impression:['お姉さん系'],          hairColor:'茶髪', hairLength:'ミディアム',skinTone:'健康的', features:['巨乳','人妻'] },
  A5: { impression:['セクシー系'],          hairColor:'黒髪', hairLength:'ロング',    skinTone:'日焼け', features:['巨乳','褐色'] },

  // ─── GROUP B: スレンダー・モデル系 ──────────────────────────────
  B1: { impression:['クール系'],            hairColor:'黒髪', hairLength:'ショート', skinTone:'色白',   features:['スレンダー','モデル系'] },
  B2: { impression:['クール系'],            hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['スレンダー','美脚'] },
  B3: { impression:['清楚系'],             hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['スレンダー','清楚'] },
  B4: { impression:['クール系'],            hairColor:'茶髪', hairLength:'ロング',   skinTone:'色白',   features:['スレンダー','ハーフ'] },
  B5: { impression:['クール系'],            hairColor:'金髪', hairLength:'ロング',   skinTone:'色白',   features:['スレンダー','外国人'] },

  // ─── GROUP C: 童顔・かわいい系 ──────────────────────────────────
  C1: { impression:['かわいい系'],          hairColor:'黒髪', hairLength:'ショート', skinTone:'色白',   features:['童顔','アイドル系'] },
  C2: { impression:['かわいい系'],          hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['童顔','美少女'] },
  C3: { impression:['かわいい系'],          hairColor:'茶髪', hairLength:'ミディアム',skinTone:'健康的', features:['童顔','素人系'] },
  C4: { impression:['かわいい系'],          hairColor:'黒髪', hairLength:'ショート', skinTone:'色白',   features:['童顔','小柄'] },
  C5: { impression:['かわいい系'],          hairColor:'茶髪', hairLength:'ロング',   skinTone:'健康的', features:['アイドル系','美少女'] },

  // ─── GROUP D: 清楚・お嬢様系 ────────────────────────────────────
  D1: { impression:['清楚系'],             hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['清楚','上品'] },
  D2: { impression:['清楚系'],             hairColor:'黒髪', hairLength:'ミディアム',skinTone:'色白',   features:['清楚','メガネ'] },
  D3: { impression:['清楚系'],             hairColor:'茶髪', hairLength:'ロング',   skinTone:'色白',   features:['清楚','お嬢様'] },
  D4: { impression:['清楚系'],             hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['清楚','和風'] },
  D5: { impression:['清楚系','かわいい系'], hairColor:'黒髪', hairLength:'ミディアム',skinTone:'色白',   features:['清楚','スレンダー'] },

  // ─── GROUP E: 熟女・人妻系 ──────────────────────────────────────
  E1: { impression:['お姉さん系'],          hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['熟女','上品'] },
  E2: { impression:['お姉さん系'],          hairColor:'黒髪', hairLength:'ミディアム',skinTone:'色白',   features:['人妻','知的'] },
  E3: { impression:['お姉さん系'],          hairColor:'茶髪', hairLength:'ロング',   skinTone:'健康的', features:['人妻','グラマー'] },
  E4: { impression:['お姉さん系'],          hairColor:'茶髪', hairLength:'ミディアム',skinTone:'健康的', features:['熟女','ぽっちゃり'] },
  E5: { impression:['お姉さん系'],          hairColor:'黒髪', hairLength:'ロング',   skinTone:'色白',   features:['熟女','スレンダー'] },

  // ─── GROUP F: ギャル・個性系 ────────────────────────────────────
  F1: { impression:['ギャル系'],            hairColor:'金髪', hairLength:'ロング',   skinTone:'日焼け', features:['ギャル','グラマー'] },
  F2: { impression:['ギャル系'],            hairColor:'茶髪', hairLength:'ロング',   skinTone:'日焼け', features:['ギャル','巨乳'] },
  F3: { impression:['ギャル系'],            hairColor:'黒髪', hairLength:'ロング',   skinTone:'日焼け', features:['ギャル','スレンダー'] },
  F4: { impression:['かわいい系'],          hairColor:'茶髪', hairLength:'ミディアム',skinTone:'健康的', features:['ぽっちゃり','素人系'] },
  F5: { impression:['かわいい系'],          hairColor:'黒髪', hairLength:'ミディアム',skinTone:'健康的', features:['スポーティ','素人系'] },
};

// ── スコアリング関数 ──────────────────────────────────────────────
/**
 * Gemini分析済みの女優特徴 vs 顔タイプ基準プロフィールの類似スコア（0–100）
 */
export function scoreFaceMatch(
  actressFeatures: FaceFeatures,
  typeProfile: TypeFaceProfile
): number {
  let score = 0;

  // 印象カテゴリ（最重要・各20点）
  for (const imp of typeProfile.impression) {
    if (actressFeatures.impression?.includes(imp)) score += 20;
  }
  // 髪色（25点）
  if (actressFeatures.hairColor === typeProfile.hairColor) score += 25;
  // 髪の長さ（15点）
  if (actressFeatures.hairLength === typeProfile.hairLength) score += 15;
  // 肌の色（10点）
  if (actressFeatures.skinTone === typeProfile.skinTone) score += 10;
  // 特徴キーワード（各5点）
  for (const feat of typeProfile.features) {
    if (actressFeatures.features?.includes(feat)) score += 5;
  }

  return Math.min(100, score);
}

// ── Gemini による女優顔分析 ───────────────────────────────────────
const FACE_ANALYSIS_PROMPT = `
あなたはFANZA（成人向け動画サービス）の女優の顔の特徴を分析するAIです。
アップロードされた顔写真を分析し、以下のJSON形式のみで回答してください（マークダウン不要）:

{
  "hairColor": "黒髪・茶髪・金髪 のいずれか",
  "hairLength": "ショート・ミディアム・ロング のいずれか",
  "faceShape": "小顔・卵型・丸顔・面長 など",
  "eyeType": "大きい目・パッチリ・切れ長・一重・二重 など",
  "skinTone": "色白・健康的・日焼け・褐色 のいずれか",
  "impression": ["清楚系・かわいい系・お姉さん系・ギャル系・クール系・セクシー系 から最大2つ"],
  "ageRange": "20代前半・20代後半・30代前半・30代後半 など",
  "features": ["巨乳・スレンダー・グラマー・童顔・アイドル系・美少女・ハーフ・外国人・モデル系・素人系・熟女・人妻・ぽっちゃり・褐色・清楚・美脚・和風・上品・メガネ・ギャル・スポーティ から最大4つ"]
}
`;

/**
 * 女優プロフィール画像URLからGemini Visionで顔特徴を抽出する
 * @returns FaceFeatures または null（失敗時）
 */
export async function analyzeActressFace(imageUrl: string): Promise<FaceFeatures | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    // 画像をfetchしてbase64変換
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: FACE_ANALYSIS_PROMPT },
        ],
      }],
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as FaceFeatures;
  } catch {
    return null;
  }
}

/** 指定ms間スリープ */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
