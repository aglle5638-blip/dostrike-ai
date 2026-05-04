/**
 * GET /api/actress/preferences/analysis
 *
 * ユーザーのスワイプ好みデータを分析し、タイプ説明文と
 * 上位女優リストを返す。
 *
 * Response:
 *   {
 *     count: number;
 *     topActresses: { actress_id, actress_name, image_url, tags, score }[];
 *     analysisText: string;   // Gemini AI が生成する高精度分析テキスト
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';

// ── Gemini AI で高精度な分析テキストを生成 ─────────────────────────
async function generateAnalysisWithGemini(
  topActresses: { actress_name: string; tags: string[]; score: number }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || topActresses.length === 0) {
    return buildFallbackAnalysisText(topActresses);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // タグ集計でプロファイルを整理
    const tagScores: Record<string, number> = {};
    for (const a of topActresses) {
      for (const tag of (a.tags ?? [])) {
        tagScores[tag] = (tagScores[tag] ?? 0) + a.score;
      }
    }
    const tagSummary = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, score]) => `${tag}(${score})`)
      .join(', ');

    const actressList = topActresses
      .slice(0, 5)
      .map(a => `・${a.actress_name}（スコア${a.score}、タグ: ${(a.tags ?? []).join('/')}）`)
      .join('\n');

    const prompt = `あなたは日本のAVレコメンドサービスのAIアナリストです。
ユーザーがスワイプで「いいね」した女優データから、そのユーザーの好みのタイプを分析してください。

【スワイプで好きと判定した女優（スコア順）】
${actressList}

【タグ集計（タグ名(スコア)）】
${tagSummary}

【分析文の要件】
1. 好みのタイプを外見・体型・雰囲気などの具体的な言葉で描写すること
2. 「実は〜という傾向がある」「あなたが気づいていないかもしれないが〜」のような、本人も意識していない隠れた好みや性癖を指摘すること
3. スワイプした女優名を1〜2名挙げて「〇〇・〇〇のような女優が…」と表現すること
4. 2〜3文、300文字以内の自然な日本語で
5. 「魅力的」「素敵」などの曖昧な表現は避けること
6. 分析文のみを出力すること（見出しや箇条書き不要）

出力例のスタイル:
「あなたはスレンダーで小柄、かつ童顔系の女優に強く反応する傾向があります。データを見ると、実はバストよりも"小顔・細腰・華奢な手足"という全体バランスへの執着が顕著です。〇〇・〇〇のような、アイドル的な清潔感と隠れた大人っぽさを併せ持つタイプがあなたのドストライクでしょう。」`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text?.trim() ?? '';
    if (text.length > 20) return text;
    // Gemini の出力が短すぎる場合はフォールバック
    return buildFallbackAnalysisText(topActresses);
  } catch (err) {
    console.error('[analysis] Gemini failed:', err);
    return buildFallbackAnalysisText(topActresses);
  }
}

// ── フォールバック用ルールベース分析（Gemini 失敗時） ──────────────
function buildFallbackAnalysisText(
  topActresses: { actress_name: string; tags: string[]; score: number }[]
): string {
  if (topActresses.length === 0) return '';

  const tagFreq: Record<string, number> = {};
  for (const a of topActresses) {
    for (const tag of (a.tags ?? [])) {
      tagFreq[tag] = (tagFreq[tag] ?? 0) + a.score;
    }
  }

  const sortedTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const TAG_ADJ: Record<string, string> = {
    'グラマー':   'グラマーで色っぽい',
    'スレンダー': 'スレンダーでスタイリッシュな',
    '高身長':     '高身長でスタイル抜群な',
    '小柄':       '小柄でかわいらしい',
    '清楚系':     '清楚で上品な',
    '普通':       'バランスよくナチュラルな魅力の',
    '10代':       '若々しくフレッシュな',
    '20代':       '旬の輝きを放つ',
    '30代以上':   '円熟した大人の魅力を持つ',
  };

  const mainTag = sortedTags[0] ?? '';
  const mainAdj = TAG_ADJ[mainTag] ?? 'フォトジェニックな';
  const subTag  = sortedTags.find(t => t !== mainTag && TAG_ADJ[t]);
  const subAdj  = subTag ? TAG_ADJ[subTag] : null;

  const names = topActresses.slice(0, 2).map(a => a.actress_name);

  let text = `あなたは${mainAdj}女優がお好みのようです。`;
  if (subAdj) text += `${subAdj}タイプにも強く反応しています。`;
  if (names.length > 0) {
    text += ` ${names.join('・')}のような女優があなたのタイプです。`;
  }

  return text;
}

// ── FANZA ActressSearch でプロフィール画像を取得 ──────────────────
async function fetchActressImageByName(name: string): Promise<string | null> {
  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey      = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) return null;

  try {
    const params = new URLSearchParams({
      site:         'FANZA',
      keyword:      name,
      hits:         '5',
      offset:       '1',
      affiliate_id: affiliateId,
      api_id:       apiKey,
      output:       'json',
    });
    const res = await fetch(
      `https://api.dmm.com/affiliate/v3/ActressSearch?${params}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      result: {
        status: string | number;
        actress?: Array<{ id: string; name: string; imageURL?: { large?: string; small?: string } }>;
      };
    };
    if (String(data.result.status) !== '200') return null;
    const actresses = data.result.actress ?? [];
    // 名前完全一致 → 部分一致 → 先頭
    const match =
      actresses.find(a => a.name === name) ??
      actresses.find(a => a.name.includes(name.split(' ')[0])) ??
      actresses[0];
    return match?.imageURL?.large ?? match?.imageURL?.small ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const authedClient = createAuthedClient(token);
    if (!authedClient) {
      return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
    }

    const { data: { user } } = await authedClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
    }

    // スコア上位10人を取得
    const { data: prefs, error } = await serviceClient
      .from('user_actress_preferences')
      .select('actress_id, actress_name, image_url, tags, score')
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;

    const topActresses = (prefs ?? []).map(p => ({
      actress_id:   p.actress_id as string,
      actress_name: p.actress_name as string,
      image_url:    (p.image_url as string | null) ?? null,
      tags:         (p.tags as string[] | null) ?? [],
      score:        p.score as number,
    }));

    const count = topActresses.length;

    // ── image_url が null の女優を並列で補完 ──────────────────────
    const needsImage = topActresses.filter(a => !a.image_url).slice(0, 6);
    if (needsImage.length > 0) {
      const imageResults = await Promise.allSettled(
        needsImage.map(a => fetchActressImageByName(a.actress_name))
      );

      imageResults.forEach((result, i) => {
        const actress = needsImage[i];
        const imageUrl = result.status === 'fulfilled' ? result.value : null;
        if (imageUrl) {
          actress.image_url = imageUrl;
          // DBにも保存（バックグラウンド、レスポンスをブロックしない）
          void serviceClient
            .from('user_actress_preferences')
            .update({ image_url: imageUrl })
            .eq('user_id', user.id)
            .eq('actress_id', actress.actress_id);
        }
      });
    }

    // ── Gemini で高精度分析テキストを生成（上位6人を入力）──────────
    const analysisInput = topActresses.slice(0, 6);
    const analysisText = await generateAnalysisWithGemini(analysisInput);

    return NextResponse.json({
      count,
      topActresses: topActresses.slice(0, 6),
      analysisText,
    });
  } catch (err) {
    console.error('[/api/actress/preferences/analysis] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
