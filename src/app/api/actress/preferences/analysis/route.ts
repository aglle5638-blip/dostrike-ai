/**
 * GET /api/actress/preferences/analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';

type AnalysisResult = {
  summary: string;
  characteristics: string[];
};

async function generateAnalysisWithGemini(
  topActresses: { actress_name: string; tags: string[]; score: number }[]
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || topActresses.length === 0) {
    return buildFallbackAnalysis(topActresses);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const tagScores: Record<string, number> = {};
    for (const a of topActresses) {
      for (const tag of (a.tags ?? [])) {
        tagScores[tag] = (tagScores[tag] ?? 0) + a.score;
      }
    }
    const tagSummary = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, score]) => `${tag}(スコア${score})`)
      .join(', ');

    const actressList = topActresses
      .slice(0, 5)
      .map(a => `${a.actress_name}（スコア${a.score}、タグ: ${(a.tags ?? []).join('/')}）`)
      .join('\n');

    const prompt = `あなたは日本のアダルトコンテンツレコメンドサービスのAIアナリストです。
ユーザーがスワイプで「いいね」した女優データを分析し、好みのタイプを詳細に分析してください。

【スワイプで好きと判定した女優（スコア順）】
${actressList}

【タグ集計（タグ(スコア)）】
${tagSummary}

以下のJSON形式で出力してください（日本語で）:
{
  "summary": "1文の概要（例：あなたはスレンダーで清楚系の女優を強く好む傾向があります。女優名を1〜2人含めてください。）",
  "characteristics": [
    "① 体型・スタイル: （バスト・身長・スタイルの具体的な傾向を1文で）",
    "② 顔立ち・雰囲気: （顔の印象、雰囲気の傾向を1文で）",
    "③ 年代・熟度: （年齢層の傾向とその理由を1文で）",
    "④ キャラクター・性格傾向: （清楚・ギャル・天然などの傾向を1文で）",
    "⑤ 隠れた嗜好・性癖: （本人も気づいていないような傾向や深層心理を1文で指摘。「実は〜」「意外にも〜」などの表現を使う）"
  ]
}

重要:
- "魅力的"、"素敵"などの曖昧な表現は避けてください
- 具体的な数値（バスト90cm以上など）や比較表現を使ってください
- characteristics は必ず5要素のarray
- JSONのみを出力してください（説明文不要）`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = (response.text ?? '').trim();
    // JSONを抽出（```json ... ``` ブロックを除去）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; characteristics?: string[] };
    const summary = parsed.summary ?? '';
    const characteristics = Array.isArray(parsed.characteristics) ? parsed.characteristics.slice(0, 5) : [];

    if (summary.length > 10 && characteristics.length >= 3) {
      return { summary, characteristics };
    }
    throw new Error('Parsed result insufficient');
  } catch (err) {
    console.error('[analysis] Gemini failed:', err);
    return buildFallbackAnalysis(topActresses);
  }
}

function buildFallbackAnalysis(
  topActresses: { actress_name: string; tags: string[]; score: number }[]
): AnalysisResult {
  if (topActresses.length === 0) {
    return { summary: '', characteristics: [] };
  }

  const tagFreq: Record<string, number> = {};
  for (const a of topActresses) {
    for (const tag of (a.tags ?? [])) {
      tagFreq[tag] = (tagFreq[tag] ?? 0) + a.score;
    }
  }
  const sortedTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).map(([t]) => t);

  const TAG_ADJ: Record<string, string> = {
    'グラマー': 'グラマーで色っぽい', 'スレンダー': 'スレンダーでスタイリッシュ',
    '高身長': '高身長でスタイル抜群', '小柄': '小柄でかわいらしい',
    '清楚系': '清楚で上品', '普通': 'バランスのとれたナチュラルな',
    '10代': '若々しくフレッシュ', '20代': '旬の輝きを放つ', '30代以上': '円熟した大人の魅力の',
  };

  const mainTag  = sortedTags[0] ?? '普通';
  const mainAdj  = TAG_ADJ[mainTag] ?? 'ナチュラルな';
  const names    = topActresses.slice(0, 2).map(a => a.actress_name);
  const summary  = `あなたは${mainAdj}女優がお好みのようです。${names.join('・')}のような女優があなたのタイプです。`;

  const characteristics = [
    `① 体型・スタイル: ${sortedTags.filter(t => ['グラマー','スレンダー','普通'].includes(t)).map(t => TAG_ADJ[t]).join('・') || 'バランス型'}な体型を好む傾向があります。`,
    `② 顔立ち・雰囲気: ${sortedTags.filter(t => ['清楚系','高身長','小柄'].includes(t)).map(t => TAG_ADJ[t]).join('・') || 'ナチュラル'}な雰囲気の女性に惹かれる傾向があります。`,
    `③ 年代・熟度: ${sortedTags.find(t => ['10代','20代','30代以上'].includes(t)) ? TAG_ADJ[sortedTags.find(t => ['10代','20代','30代以上'].includes(t))!] : '年代を問わず'} の女優に高い反応を示しています。`,
    `④ キャラクター傾向: ${mainAdj}タイプへの一貫した好みが見られます。`,
    `⑤ 隠れた嗜好: データパターンからは外見の清潔感と雰囲気のギャップに強く反応している傾向があります。`,
  ];

  return { summary, characteristics };
}

async function fetchActressImageByName(name: string): Promise<string | null> {
  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) return null;
  try {
    const params = new URLSearchParams({
      site: 'FANZA', keyword: name, hits: '5', offset: '1',
      affiliate_id: affiliateId, api_id: apiKey, output: 'json',
    });
    const res = await fetch(`https://api.dmm.com/affiliate/v3/ActressSearch?${params}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json() as { result: { status: string | number; actress?: Array<{ id: string; name: string; imageURL?: { large?: string; small?: string } }> } };
    if (String(data.result.status) !== '200') return null;
    const actresses = data.result.actress ?? [];
    const match = actresses.find(a => a.name === name) ?? actresses.find(a => a.name.includes(name.split(' ')[0])) ?? actresses[0];
    return match?.imageURL?.large ?? match?.imageURL?.small ?? null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const authedClient = createAuthedClient(token);
    if (!authedClient) return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();
    if (!serviceClient) return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });

    // 実際の総登録数をカウントクエリで取得（limit の影響を受けない）
    const [{ count: totalCount }, { data: prefs, error }] = await Promise.all([
      serviceClient
        .from('user_actress_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      serviceClient
        .from('user_actress_preferences')
        .select('actress_id, actress_name, image_url, tags, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(50),   // 表示用に上位50件取得（UI側で6+overflow表示）
    ]);

    if (error) throw error;

    const topActresses = (prefs ?? []).map(p => ({
      actress_id:   p.actress_id as string,
      actress_name: p.actress_name as string,
      image_url:    (p.image_url as string | null) ?? null,
      tags:         (p.tags as string[] | null) ?? [],
      score:        p.score as number,
    }));

    // image_url が null の女優を並列で補完（表示上位6件のみ）
    const needsImage = topActresses.filter(a => !a.image_url).slice(0, 6);
    if (needsImage.length > 0) {
      const imageResults = await Promise.allSettled(needsImage.map(a => fetchActressImageByName(a.actress_name)));
      imageResults.forEach((result, i) => {
        const actress = needsImage[i];
        const imageUrl = result.status === 'fulfilled' ? result.value : null;
        if (imageUrl) {
          actress.image_url = imageUrl;
          void serviceClient
            .from('user_actress_preferences')
            .update({ image_url: imageUrl })
            .eq('user_id', user.id)
            .eq('actress_id', actress.actress_id);
        }
      });
    }

    // Gemini で5つの特徴を生成（上位6件を使用）
    const { summary, characteristics } = await generateAnalysisWithGemini(topActresses.slice(0, 6));

    return NextResponse.json({
      count: totalCount ?? topActresses.length,  // DB上の真の総数
      topActresses,                               // 上位50件（UI側でslice表示）
      analysisText: summary,
      characteristics,
    });
  } catch (err) {
    console.error('[/api/actress/preferences/analysis] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
