/**
 * SNS投稿テンプレート管理
 *
 * X（Twitter）・Instagram 向けの投稿テキストを管理するモジュール。
 * - X: テキスト中心（URL + ハッシュタグ）
 * - Instagram: キャプション形式（顔タイプカードに添付）
 *
 * 使い方:
 *   import { pickTemplate, SITE_URL } from '@/lib/social-templates';
 *   const post = pickTemplate('x', 'A1');  // 清楚系向けXテンプレートをランダム選択
 */

export const SITE_URL = 'https://dostrike-ai.vercel.app';

// ─────────────────────────────────────────────────────────────────────────────
// 顔タイプ定義
// ─────────────────────────────────────────────────────────────────────────────

export const FACE_TYPES = {
  A1: { name: '清楚・黒髪ロング',   emoji: '🌸', group: '清楚系' },
  A2: { name: '清楚・ナチュラル',   emoji: '🌼', group: '清楚系' },
  A3: { name: '和風美人',           emoji: '🎋', group: '清楚系' },
  A4: { name: '色白スレンダー',     emoji: '🤍', group: '清楚系' },
  A5: { name: '上品お嬢様',         emoji: '👑', group: '清楚系' },
  B1: { name: '童顔キュート',       emoji: '💗', group: 'キュート系' },
  B2: { name: 'アイドル系',         emoji: '⭐', group: 'キュート系' },
  B3: { name: 'ロリっぽい',         emoji: '🎀', group: 'キュート系' },
  B4: { name: '小顔ベビーフェイス', emoji: '🍒', group: 'キュート系' },
  B5: { name: 'ふわふわ天然系',     emoji: '☁️', group: 'キュート系' },
  C1: { name: 'お姉さん・色気系',   emoji: '💋', group: 'お姉さん系' },
  C2: { name: '落ち着いた美人',     emoji: '🌹', group: 'お姉さん系' },
  C3: { name: 'グラマラス',         emoji: '💎', group: 'お姉さん系' },
  C4: { name: '大人っぽい系',       emoji: '🍷', group: 'お姉さん系' },
  C5: { name: 'セレブ風',           emoji: '✨', group: 'お姉さん系' },
  D1: { name: 'ギャル・金髪',       emoji: '💅', group: 'ギャル系' },
  D2: { name: '日焼け褐色',         emoji: '🌞', group: 'ギャル系' },
  D3: { name: '派手メイク',         emoji: '🎆', group: 'ギャル系' },
  D4: { name: '関西弁ギャル',       emoji: '🔥', group: 'ギャル系' },
  D5: { name: 'サーファー系',       emoji: '🏄', group: 'ギャル系' },
  E1: { name: 'クール・知的',       emoji: '🖤', group: 'クール系' },
  E2: { name: 'モデル体型',         emoji: '👠', group: 'クール系' },
  E3: { name: 'ミステリアス',       emoji: '🌙', group: 'クール系' },
  E4: { name: 'ショートカット系',   emoji: '✂️', group: 'クール系' },
  E5: { name: 'ハーフ風',           emoji: '🌍', group: 'クール系' },
  F1: { name: 'スポーティ',         emoji: '🏃', group: 'その他' },
  F2: { name: '眼鏡っ娘',           emoji: '👓', group: 'その他' },
  F3: { name: 'コスプレ系',         emoji: '🎭', group: 'その他' },
  F4: { name: '個性派',             emoji: '🦋', group: 'その他' },
  F5: { name: 'ぽっちゃり系',       emoji: '🍑', group: 'その他' },
} as const;

export type FaceTypeId = keyof typeof FACE_TYPES;

// ─────────────────────────────────────────────────────────────────────────────
// X (Twitter) テンプレート
// ─────────────────────────────────────────────────────────────────────────────

/** プレースホルダーを実際の値に置換する */
function fillTemplate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{${k}}`, v),
    text,
  );
}

/** 汎用CTAテンプレート（スワイプ学習型AIの説明） */
export const X_CTA_TEMPLATES = [
  // パターン1: Tinder比較型（最強）
  '女優版Tinderを作りました\n\n好きな顔にハート、違う顔にバツをスワイプするだけで\nAIが好みを学習してFANZAの動画を自動提案\n\nやるたびに精度が上がっていく\n{URL}\n\n#FANZA #AI',

  // パターン2: 共感・あるある型
  'FANZAで2時間迷った末に\n昨日も見たやつを選ぶ現象、なんとかならないか\n\n→ 女優写真をスワイプすると\nAIが好みを学習して「これ絶対好きでしょ」って出してくれる\n\n{URL}\n\n#FANZA #AI',

  // パターン3: 驚き・発見型
  '自分でも気づいてなかった\n「本当に好きなタイプ」が分かった\n\n女優の顔写真をひたすらスワイプしてたら\nAIが好みを分析して動画を提案してきた\n\nなんか怖いくらい当たってる\n{URL}',

  // パターン4: AI学習型
  'スワイプするたびに賢くなるAIを作った\n\n好きな顔→ハート ❤️\n違う顔→バツ ✕\n\nそれだけで好みを学習して\nFANZAのドストライク動画を提案してくれる\n\n{URL}\n\n#AI活用 #FANZA',

  // パターン5: 数字インパクト型
  'スワイプ10回でAIが好みを把握する\n\nスワイプ50回でかなり精度が上がる\n\nスワイプ100回でほぼドストライクしか出てこなくなる\n\n{URL}\n\n#FANZA #AIおすすめ',

  // パターン6: ライフハック型
  'FANZAを賢く使う方法（2026年版）\n\n❌ ランキングから探す\n❌ 人気女優で絞る\n⭕ 好みをAIにスワイプで教えて自動提案させる\n\n3番だけ次元が違う\n{URL}\n\n#FANZA',

  // パターン7: 問いかけ型（返信・RT狙い）
  '「好きな女優のタイプは？」って聞かれて\nちゃんと答えられる人どのくらいいる？\n\n言語化できなくてもスワイプするだけで\nAIが分析してドストライク動画を出してくれる\n\n{URL}\n\nあなたのタイプ教えてください↓',
];

/** 時間帯別テンプレート（朝・昼・夜でトーンを変える） */
export const X_TIME_TEMPLATES: Record<string, string[]> = {
  morning: [
    // 朝8時：発見・気づき系
    'おはようございます\n\n今日の雑学：自分の「好みのタイプ」を言語化できる男性は20%以下らしい\n\n残り80%の人のために作りました\n女優写真をスワイプするだけでAIが好みを学習\n{URL}',
    '朝から何ですが\n\nFANZAで理想の動画を探すのに毎回30分かけてる人へ\n\nスワイプで好みを学習したAIが代わりに探します\n{URL}\n\n#FANZA',
  ],
  noon: [
    // 昼12時：情報・ライフハック系
    '昼休みに試してほしいもの\n\n女優写真をスワイプするだけで\nAIが好みを学習してFANZAの動画を提案してくれるやつ\n\n無料です\n{URL}',
    'FANZAの使い方が変わるかもしれないサービス\n\n好きな顔にハート、嫌いな顔にバツ\nAIが学習して似たタイプの女優の動画だけ出してくれる\n{URL}\n\n#AI #FANZA',
  ],
  evening: [
    // 夜21時：共感・エモーション系
    '夜にFANZAを開くたびに\nどれ見るか迷って時間だけ溶けていく\n\nその問題を解決するAIを作りました\nスワイプで好みを教えると自動で選んでくれる\n{URL}',
    '今夜のFANZA選びに困ってる人へ\n\n女優写真をスワイプするだけ\nAIが好みを学習してドストライクを提案します\n\n{URL}\n\n#FANZA #ドストライク',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Instagram テンプレート（キャプション）
// ─────────────────────────────────────────────────────────────────────────────

export const INSTAGRAM_CAPTIONS = [
  '✨ あなたの「ドストライクタイプ」、AIが見つけます\n\n好きな顔の写真にハート❤️\n違う顔にバツ✕をスワイプするだけ\n\nAIがあなたの好みを学習して\nFANZAのドストライク動画を自動提案📱\n\n👆 プロフィールのリンクから無料で体験\n\n#AI活用 #好みのタイプ #ドストライク #FANZA',

  '💗 スワイプで好みを学習するAIを作りました\n\nTinderみたいに女優の顔写真をスワイプ\nやればやるほど精度が上がって\n本当に好きなタイプの動画だけ出てくるようになる\n\n完全無料・登録不要\n\n👆 プロフィールリンクからアクセス\n\n#AI #FANZA #無料',

  '🔍 自分でも知らなかった「本当の好み」が分かる\n\n女優写真をひたすらスワイプ→AIが好みを分析\n→似たタイプの女優の動画を自動提案\n\nなんか怖いくらい当たります\n\n👆 プロフィールのリンクへ\n\n#AI診断 #好みのタイプ #FANZA',
];

// ─────────────────────────────────────────────────────────────────────────────
// テンプレート選択ユーティリティ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 投稿テンプレートをランダムに選択して返す。
 *
 * @param platform - 'x' | 'instagram'
 * @param faceTypeId - 顔タイプID（省略時は汎用CTAを選択）
 * @param seed - テスト用の固定シード（省略時はランダム）
 */
export function pickTemplate(
  platform: 'x' | 'instagram',
  _faceTypeId?: FaceTypeId,
  seed?: number,
): string {
  const rand = (arr: string[]) => {
    const idx = seed !== undefined ? seed % arr.length : Math.floor(Math.random() * arr.length);
    return arr[idx];
  };

  if (platform === 'instagram') {
    return fillTemplate(rand(INSTAGRAM_CAPTIONS), { URL: SITE_URL });
  }

  // X: 汎用CTAテンプレートからランダム選択
  // 時間帯別テンプレートは social-post/route.ts 側で処理する
  return fillTemplate(rand(X_CTA_TEMPLATES), { URL: SITE_URL });
}

/**
 * 今日の日付ベースで「今日投稿すべき顔タイプID」を返す。
 * 曜日ローテーションで全タイプを均等に露出させる。
 */
export function getTodayFaceTypeId(): FaceTypeId {
  const types = Object.keys(FACE_TYPES) as FaceTypeId[];
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return types[dayIndex % types.length];
}

/**
 * 投稿テキストが X の文字数制限（280文字）を超えていないか確認する。
 * 超過時は末尾を省略して URL を必ず含める形に整形する。
 */
export function truncateForX(text: string): string {
  const LIMIT = 280;
  if (text.length <= LIMIT) return text;

  // URLの位置を保持しつつ切り詰める
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (!urlMatch) return text.slice(0, LIMIT);

  const url = urlMatch[0];
  const maxBody = LIMIT - url.length - 2;
  const body = text.replace(url, '').trim().slice(0, maxBody);
  return `${body}\n\n${url}`;
}
