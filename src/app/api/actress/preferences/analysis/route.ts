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
 *     analysisText: string;   // "あなたは〇〇な女優がお好みのようです" 等
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';

// タグの組み合わせから自然な日本語説明文を生成
function buildAnalysisText(
  topActresses: { actress_name: string; tags: string[]; score: number }[]
): string {
  if (topActresses.length === 0) return '';

  // タグ集計（スコア重み付き）
  const tagFreq: Record<string, number> = {};
  for (const a of topActresses) {
    for (const tag of (a.tags ?? [])) {
      tagFreq[tag] = (tagFreq[tag] ?? 0) + a.score;
    }
  }

  // 上位タグ抽出
  const sortedTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  // タグ→形容詞マッピング
  const TAG_ADJ: Record<string, string> = {
    'グラマー':   'グラマーで色っぽい',
    'スレンダー': 'スレンダーでスタイリッシュ',
    '高身長':     '高身長でスタイル抜群',
    '小柄':       '小柄でかわいらしい',
    '清楚系':     '清楚で上品',
    '若い':       '若くてフレッシュ',
    'お姉さん系': '大人っぽくセクシー',
    'キュート系': 'キュートで愛嬌のある',
    'クール系':   'クールで知的',
    'ギャル系':   '明るくエネルギッシュ',
    '巨乳':       'グラマーで迫力のある',
  };

  const mainAdj = sortedTags.length > 0 ? (TAG_ADJ[sortedTags[0]] ?? '魅力的') : '魅力的';
  const subAdj  = sortedTags.length > 1 ? (TAG_ADJ[sortedTags[1]] ?? null) : null;

  // 女優名（上位3名）
  const names = topActresses.slice(0, 3).map(a => a.actress_name);

  let text = `あなたは${mainAdj}女優がお好みのようです。`;
  if (subAdj) text += `${subAdj}タイプにも高い反応を示しています。`;
  if (names.length > 0) {
    text += ` ${names.join('・')}といった女優があなたのタイプに近いでしょう。`;
  }

  return text;
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
    const analysisText = buildAnalysisText(topActresses);

    return NextResponse.json({ count, topActresses: topActresses.slice(0, 6), analysisText });
  } catch (err) {
    console.error('[/api/actress/preferences/analysis] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
