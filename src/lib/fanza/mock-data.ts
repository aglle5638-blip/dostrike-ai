/**
 * FANZA API キー取得前の PoC 用モックデータ
 *
 * - 実際の FANZA レスポンス構造と 1:1 で対応
 * - キーワード・タグはリアルな日本語 AV 検索語を使用
 * - 女優名はすべて架空（実在しない）
 * - サムネイル画像は Unsplash の汎用女性ポートレート
 * - API キー到着後、このファイルを参照する箇所は自動的に実データに切替
 */

import type { VideoResult } from './types';

const UNSPLASH = (id: string, w = 480, h = 270) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=75`;

// Unsplash の汎用ポートレート IDs（外部 API 不要・常時安定）
const THUMB_IDS = [
  '1531746020798-e6953c6e8e04', '1544005313-94ddf0286df2',
  '1580489944761-15a19d654956', '1562916172-8874bb7c1b7e',
  '1517365830460-955ce3ccd263', '1508214751196-bcfd4ca60f91',
  '1534528741775-53994a69daeb', '1519781542700-1bfa3c675661',
  '1546961329-78bef0414d7c', '1579782522718-d731855a9062',
  '1529939944822-f0f3f7e3e9c9', '1488426862026-3ee34a7d66fc',
  '1500917293891-ef795e70e1f6', '1520813792240-56fc4a3765a7',
  '1555952517-2e8e729e0b44', '1509967419530-da38b4704bc6',
  '1541823709867-1b206113eafd', '1438761681033-6461ffad8d80',
  '1525879000486-53846b4129d2', '1529626455594-4ff0802cfb7e',
];

// 架空女優名（30 名）
const ACTRESSES = [
  '結衣あいか', '茉莉花なな', '栞みお', '葵ひより', '桜井るか',
  '七緒みつき', '美桜このか', '凛花りょう', '紬かすみ', '夕奈まい',
  '蘭れいな', '希咲ゆう', '亜矢つばき', '百合こはる', '紗奈もも',
  '恵梨あゆ', '椿あいり', '菜摘みく', '彩乃りな', '朋美さき',
  '玲奈あんな', '珠緒みのり', '千尋まなか', '夢咲ゆきな', '柚香ひな',
  '澪まどか', '莉子つきな', '琴音しおり', '翠るい', '嵐かれん',
];

// タイプ別タグセット
const TAG_SETS: Record<string, string[]> = {
  清楚:   ['清楚', '黒髪', 'スレンダー', '色白', 'ロング'],
  キュート: ['かわいい', '童顔', 'アイドル系', '天然', '色白'],
  お姉さん: ['お姉さん系', 'セクシー', '熟女', 'グラマー', '大人'],
  ギャル:  ['ギャル', '金髪', '日焼け', 'グラマー', '派手'],
  クール:  ['クール', 'モデル系', 'スレンダー', '黒髪', '美人'],
  その他:  ['素朴', '健康的', '和風', '褐色', 'スポーティ'],
};

const GROUPS = ['清楚', 'キュート', 'お姉さん', 'ギャル', 'クール', 'その他'] as const;

const TITLE_TEMPLATES = [
  '【独占】{actress}が魅せる完璧なフォルムと透き通るような美肌の衝撃デビュー作',
  '{actress}の{kw}な素顔に完全密着した傑作ドキュメント120分',
  '{actress}×{kw}・二人きりの秘密の週末旅行スペシャル',
  'SNS総フォロワー40万人超！話題沸騰の{actress}がついにカメラの前に登場',
  '業界震撼の超大型新人{actress}・誰もが振り返る圧倒的スタイルの全て',
  '{actress}の{kw}ギャップが止まらない──独占密室プレミアムドキュメント',
  '清純派の仮面を脱ぎ捨てた{actress}が見せた本当の素顔・衝撃の告白',
  '今期最高傑作・{actress}の{kw}美と完璧プロポーションに迫る120分',
  '【限定公開】{actress}との真剣勝負──予測不能なギャップに溺れる90分',
  '現役{kw}・{actress}のリアルなプライベート空間に完全密着した記録',
];

function buildTitle(actress: string, tags: string[]): string {
  const template = TITLE_TEMPLATES[Math.floor(Math.random() * TITLE_TEMPLATES.length)];
  const kw = tags[0] ?? 'かわいい';
  return template.replace(/{actress}/g, actress).replace(/{kw}/g, kw);
}

/**
 * 指定タイプIDのキーワードに対応したモック動画を生成する
 * @param typeIds  選択されたタイプID配列
 * @param count    生成件数
 * @param sortBy   ソート種別
 */
export function generateMockVideos(
  typeIds: string[],
  count = 12,
  sortBy: string = 'match'
): VideoResult[] {
  // タイプIDからグループを判定（例: "A1" → "清楚"）
  const groupMap: Record<string, typeof GROUPS[number]> = {
    A: '清楚', B: 'キュート', C: 'お姉さん', D: 'ギャル', E: 'クール', F: 'その他',
  };
  const activeGroups = [...new Set(typeIds.map(id => groupMap[id[0]] ?? '清楚'))];
  const primaryGroup = activeGroups[0] ?? '清楚';
  const tags = TAG_SETS[primaryGroup] ?? TAG_SETS['清楚'];

  const videos: VideoResult[] = Array.from({ length: count }, (_, i) => {
    const actress = ACTRESSES[i % ACTRESSES.length];
    const thumbId = THUMB_IDS[i % THUMB_IDS.length];
    const groupForVideo = activeGroups[i % activeGroups.length];
    const videoTags = [...(TAG_SETS[groupForVideo] ?? tags)];

    // スコアを自然な分布に（1位: 97-99, 末尾: 72-76）
    const baseScore = Math.max(70, 99 - i * 2 - Math.floor(Math.random() * 3));

    return {
      id: `mock-${typeIds.join('-')}-${i}`,
      title: buildTitle(actress, videoTags),
      actress,
      thumbnailUrl: UNSPLASH(thumbId),
      sampleImageUrl: UNSPLASH(thumbId, 800, 450),
      durationMin: 80 + Math.floor(Math.random() * 80),
      price: `${(1480 + i * 200 + Math.floor(Math.random() * 200)).toLocaleString()}円`,
      reviewCount: 80 + i * 15 + Math.floor(Math.random() * 50),
      reviewAverage: parseFloat((3.9 + Math.random() * 1.0).toFixed(1)),
      releaseDate: `2026-0${Math.max(1, 4 - Math.floor(i / 5))}-${String((i % 25) + 1).padStart(2, '0')}`,
      tags: videoTags.slice(0, 4),
      affiliateUrl: `https://al.dmm.co.jp/?lurl=https%3A%2F%2Fwww.dmm.co.jp%2Fdigital%2Fvideoa%2F-%2Fdetail%2F%3D%2Fcid%3Dmock${i}%2F&af_id=${process.env.FANZA_AFFILIATE_ID ?? 'pending'}&ch=api`,
      matchScore: baseScore,
      source: 'mock',
    };
  });

  // ソート
  switch (sortBy) {
    case 'review':
      videos.sort((a, b) => (b.reviewAverage ?? 0) - (a.reviewAverage ?? 0));
      break;
    case 'date':
      videos.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
      break;
    case 'price_asc':
      videos.sort((a, b) => parseInt(a.price?.replace(/[^0-9]/g, '') ?? '0')
                          - parseInt(b.price?.replace(/[^0-9]/g, '') ?? '0'));
      break;
    case 'price_desc':
      videos.sort((a, b) => parseInt(b.price?.replace(/[^0-9]/g, '') ?? '0')
                          - parseInt(a.price?.replace(/[^0-9]/g, '') ?? '0'));
      break;
    case 'rank':
    case 'match':
    default:
      videos.sort((a, b) => b.matchScore - a.matchScore);
  }

  return videos;
}
