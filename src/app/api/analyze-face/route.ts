import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * POST /api/analyze-face
 * Body: multipart/form-data with "image" field (File)
 *
 * Returns:
 * {
 *   features: FaceFeatures
 *   searchKeywords: string[]
 *   rawDescription: string
 * }
 */

export interface FaceFeatures {
  hairColor: string;       // 例: "黒髪", "茶髪", "金髪"
  hairLength: string;      // 例: "ショート", "ミディアム", "ロング"
  faceShape: string;       // 例: "小顔", "卵型", "丸顔"
  eyeType: string;         // 例: "大きい目", "切れ長", "二重"
  skinTone: string;        // 例: "色白", "健康的", "日焼け"
  impression: string[];    // 例: ["清楚系", "かわいい系", "お姉さん系"]
  ageRange: string;        // 例: "20代前半", "20代後半", "30代"
  features: string[];      // 例: ["童顔", "モデル体型", "笑顔が素敵"]
}

const FACE_ANALYSIS_PROMPT = `
あなたは日本人女性の顔の特徴を分析し、動画配信サービスの検索に使えるキーワードを抽出するAIです。

アップロードされた顔写真を分析し、以下のJSON形式で必ず回答してください。
日本語で回答し、動画サービスで実際に使われる検索ワードを意識してください。

{
  "hairColor": "黒髪・茶髪・金髪・暗め・明るめ など",
  "hairLength": "ショート・ボブ・ミディアム・ロング など",
  "faceShape": "小顔・卵型・面長・丸顔 など",
  "eyeType": "大きい目・パッチリ・切れ長・一重・二重 など",
  "skinTone": "色白・色黒・健康的・透明感がある など",
  "impression": ["清楚系", "かわいい系", "お姉さん系", "ギャル系" などから最大3つ],
  "ageRange": "10代後半・20代前半・20代後半・30代前半・30代後半 など",
  "features": ["巨乳・スレンダー・グラマー・童顔・アイドル系・美少女・ハーフ・外国人・モデル系・素人系・熟女・人妻・ぽっちゃり・褐色・清楚・美脚・和風・上品・メガネ・ギャル・スポーティ などFANZA検索で使われる特徴を最大5つ"]
}

注意:
- 性的な描写は一切含めないでください
- あくまで外見的な特徴の客観的な分析のみ行ってください
- JSONのみを返してください（マークダウンのコードブロックなしで）
`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "画像ファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイルをbase64に変換
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type as "image/jpeg" | "image/png" | "image/webp";

    // Gemini Vision APIへ送信
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
            {
              text: FACE_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // JSONをパース (Geminiがたまにmarkdownブロックを付けることがあるため除去)
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let features: FaceFeatures;

    try {
      features = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "顔の特徴を解析できませんでした。別の写真をお試しください。", rawText },
        { status: 422 }
      );
    }

    // 検索キーワードを組み立て
    const searchKeywords = buildSearchKeywords(features);

    return NextResponse.json({
      features,
      searchKeywords,
      rawDescription: rawText,
    });
  } catch (err) {
    console.error("[analyze-face] Error:", err);
    return NextResponse.json(
      { error: "分析中にエラーが発生しました。しばらく後にお試しください。" },
      { status: 500 }
    );
  }
}

/**
 * Geminiが返した特徴から、FANZA API検索に使えるキーワード配列を生成
 */
function buildSearchKeywords(features: FaceFeatures): string[] {
  const keywords: string[] = [];

  // 髪型系
  if (features.hairColor) keywords.push(features.hairColor);
  if (features.hairLength && features.hairLength !== "ミディアム") {
    keywords.push(`${features.hairLength}`);
  }

  // 印象系（最も重要な検索キーワード）
  if (Array.isArray(features.impression)) {
    keywords.push(...features.impression);
  }

  // 特徴（FANZAジャンルに対応するキーワード）
  if (Array.isArray(features.features)) {
    keywords.push(...features.features.slice(0, 3));
  }

  // 重複除去
  return [...new Set(keywords)].filter(Boolean).slice(0, 8);
}
