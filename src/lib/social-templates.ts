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

/** 汎用CTAテンプレート（顔タイプ非依存） */
export const X_CTA_TEMPLATES = [
  '「好みのタイプを選ぶだけ」でFANZAのドストライク作品を探してくれるAIを作りました。\n\n登録不要・完全無料で使えます👇\n{URL}\n\n#FANZA #好みのタイプ #顔タイプ診断',

  '何万本もある中から「絶対好きなやつ」を探すの大変すぎませんか？\n\nAIに顔タイプを教えるだけで自動でキュレーションしてくれます。\n{URL}\n\n#FANZA #AI #ドストライク',

  'FANZAの動画、多すぎて選べない問題を解決しました。\n\n好みのタイプをAIに伝えるだけ→スコアリングして6作品を自動提案。\n{URL}\n\n#FANZA #顔タイプ #おすすめ',

  '顔タイプ診断AIを公開しました。\n\n30パターンから好みを選ぶ→AIが数万本の中からドストライクを発掘。\n完全無料。\n{URL}\n\n#顔タイプ診断 #FANZA #AI活用',

  '「この人タイプだな」という感覚、AIに学習させられます。\n\n✅ 顔タイプ選ぶだけ\n✅ 登録不要\n✅ 完全無料\n\n{URL}\n\n#AI #FANZA #好みのタイプ',

  'FANZAで「理想の作品」を見つけるのに何時間もかけてませんか？\n\nAIが代わりに探してくれます。無料で試してみて↓\n{URL}\n\n#FANZA #AI検索 #時短',

  '【無料】顔タイプを選ぶだけでFANZAのドストライクが見つかるAIを公開中\n\n30タイプから1〜5つ選択→AIが瞬時に6作品を提案\n{URL}\n\n#FANZA #顔タイプ #ドストライクAI',
];

/** 顔タイプ別の特化テンプレート */
export const X_TYPE_TEMPLATES: Record<string, string[]> = {
  清楚系: [
    '{emoji} {groupName}好きな人に使ってほしいAIを作りました。\n\n清楚系・黒髪・色白なタイプをAIが数万本の中からピックアップ。\n{URL}\n\n#清楚系 #FANZA #顔タイプ診断',
    '清楚系が好きだけど探すの疲れた人へ。\n\nAIに「清楚系が好き」と伝えるだけでドストライク作品が見つかります。\n{URL}\n\n#清楚系 #黒髪 #FANZA',
  ],
  キュート系: [
    '{emoji} 童顔・キュート系が好きな人へ。\n\nアイドル系〜ベビーフェイスまで、好みのタイプをAIが代わりに探します。\n{URL}\n\n#童顔 #キュート系 #FANZA',
    '小顔・童顔・かわいい系が好きな人にぴったりのAIを作りました。\n{URL}\n\n#キュート系 #童顔 #顔タイプ診断',
  ],
  お姉さん系: [
    '{emoji} お姉さん系・色気系が好きな人へ。\n\n落ち着いた大人の魅力をもつタイプをAIがキュレーション。\n{URL}\n\n#お姉さん系 #色気 #FANZA',
    'グラマラス・セレブ風・大人っぽいタイプが好きな人におすすめのAIです。\n{URL}\n\n#お姉さん系 #グラマラス #FANZA',
  ],
  ギャル系: [
    '{emoji} ギャル・金髪・派手系が好きな人向けAIを作りました。\n\n日焼け・褐色・サーファー系まで幅広くカバー。\n{URL}\n\n#ギャル系 #金髪 #FANZA',
    'ギャルが好きすぎる人たちへ。AIに任せればドストライクが見つかります。\n{URL}\n\n#ギャル系 #FANZA #顔タイプ',
  ],
  クール系: [
    '{emoji} クール・知的・モデル系が好きな人向けのAIです。\n\nミステリアス・ハーフ風・ショートカット系もカバー。\n{URL}\n\n#クール系 #モデル系 #FANZA',
    'クールで知的なタイプ専門でAIが探してくれます。\n{URL}\n\n#クール系 #知的 #FANZA',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Instagram テンプレート（キャプション）
// ─────────────────────────────────────────────────────────────────────────────

export const INSTAGRAM_CAPTIONS = [
  '✨ あなたの「ドストライクタイプ」はどれ？\n\n30種類の顔タイプから好みを選ぶだけで、AIが理想の作品を自動提案してくれるサービスをリリースしました。\n\n👆 プロフィールのリンクから無料で体験できます。\n\n#顔タイプ診断 #AI活用 #好みのタイプ #ドストライク #FANZA',

  '💗 キュート系？清楚系？あなたの「好み」をAIに教えてみて。\n\n顔タイプを選ぶだけで、数万本の中からあなただけのドストライク作品を瞬時にキュレーション。完全無料。\n\n👆 プロフィールリンクからアクセス\n\n#顔タイプ #AI #無料 #診断',

  '🌸 清楚系・ギャル系・クール系…\nあなたはどのタイプが好き？\n\nAIが30タイプから好みに合った作品を自動提案します。\n登録不要・完全無料で試せます。\n\n👆 プロフィールのリンクへ\n\n#タイプ診断 #AI診断 #顔タイプ診断',
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
  faceTypeId?: FaceTypeId,
  seed?: number,
): string {
  const rand = (arr: string[]) => {
    const idx = seed !== undefined ? seed % arr.length : Math.floor(Math.random() * arr.length);
    return arr[idx];
  };

  if (platform === 'instagram') {
    return fillTemplate(rand(INSTAGRAM_CAPTIONS), { URL: SITE_URL });
  }

  // X: 顔タイプ別テンプレートを50%、汎用CTAを50%の確率で選択
  const useTypeTemplate =
    faceTypeId && (seed !== undefined ? seed % 2 === 0 : Math.random() < 0.5);

  if (useTypeTemplate && faceTypeId) {
    const ft = FACE_TYPES[faceTypeId];
    const group = ft.group;
    const groupTemplates = X_TYPE_TEMPLATES[group];
    if (groupTemplates?.length) {
      return fillTemplate(rand(groupTemplates), {
        URL: SITE_URL,
        emoji: ft.emoji,
        groupName: group,
        typeName: ft.name,
      });
    }
  }

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
