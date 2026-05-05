/**
 * SNS投稿テンプレート管理
 *
 * X（Twitter）・Instagram 向けの投稿テキストを管理するモジュール。
 * - X: テキスト中心（URL + ハッシュタグ）
 * - Instagram: キャプション形式（顔タイプカードに添付）
 */

export const SITE_URL = 'https://dostrike-ai.vercel.app';

// ─────────────────────────────────────────────────────────────────────────────
// マーケティングセット定義（画像とテキストの完全な整合性を保証）
// ─────────────────────────────────────────────────────────────────────────────

export const MARKETING_SETS = [
  {
    id: 'type_a',
    faceTypeId: 'A1',
    imageFile: 'beauty_a.png',
    label: '清楚系・黒髪ロング（水着）',
    /** FANZAキーワード検索用（投稿内容と一致させる） */
    searchKeyword: '清楚 黒髪',
    /** マーケティング画像のカード内タグ表示 */
    cardTag: '清楚系 • 黒髪ロング',
    templates: [
      '「清楚系・黒髪ロング」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#FANZA #AI #清楚系',
      '清楚系で純朴なタイプを探すの、意外と苦労しませんか？\n\nAIにスワイプで好みを教えるだけで、あなたにぴったりの作品を自動提案してくれます。\n\n{URL}\n\n#FANZA #清楚系 #黒髪ロング'
    ]
  },
  {
    id: 'type_b',
    faceTypeId: 'D1',
    imageFile: 'beauty_b.png',
    label: 'ギャル系・金髪（水着）',
    searchKeyword: 'ギャル 金髪',
    cardTag: 'ギャル系 • 金髪',
    templates: [
      '「ギャル系・派手髪」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#FANZA #AI #ギャル系',
      '夏っぽくて元気なギャル系が好きな人へ。\n\nAIにスワイプで好みを教えるだけで、あなたにぴったりの作品を自動提案してくれます。\n\n{URL}\n\n#FANZA #ギャル系 #金髪'
    ]
  },
  {
    id: 'type_c',
    faceTypeId: 'E1',
    imageFile: 'beauty_c.png',
    label: 'クール系・ショート（水着）',
    searchKeyword: 'クール ショートヘア',
    cardTag: 'クール系 • ショート',
    templates: [
      '「クール系・ショートヘア」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#FANZA #AI #クール系',
      '大人っぽくてクールなショートヘアが好きな人へ。\n\nAIにスワイプで好みを教えるだけで、あなたにぴったりの作品を自動提案してくれます。\n\n{URL}\n\n#FANZA #クール系 #ショートヘア'
    ]
  },
  {
    id: 'ui_mockup',
    faceTypeId: 'F1',
    imageFile: 'app_ui.png',
    label: 'アプリUI画面（汎用）',
    searchKeyword: 'スワイプ 人気',
    cardTag: 'スワイプ学習 • AI提案',
    templates: [
      '女優版Tinderを作りました\n\n好きな顔にハート、違う顔にバツをスワイプするだけで\nAIが好みを学習してFANZAの動画を自動提案\n\nやるたびに精度が上がっていく\n{URL}\n\n#FANZA #AI',
      'FANZAで2時間迷った末に\n昨日も見たやつを選ぶ現象、なんとかならないか\n\n→ 女優写真をスワイプすると\nAIが好みを学習して「これ絶対好きでしょ」って出してくれる\n\n{URL}\n\n#FANZA #AI',
      'スワイプするたびに賢くなるAIを作った\n\n好きな顔→ハート ❤️\n違う顔→バツ ✕\n\nそれだけで好みを学習して\nFANZAのドストライク動画を提案してくれる\n\n{URL}\n\n#AI活用 #FANZA',
      'FANZAを賢く使う方法（2026年版）\n\n❌ ランキングから探す\n❌ 人気女優で絞る\n⭕ 好みをAIにスワイプで教えて自動提案させる\n\n3番だけ次元が違う\n{URL}\n\n#FANZA',
      '「好きな女優のタイプは？」って聞かれて\nちゃんと答えられる人どのくらいいる？\n\n言語化できなくてもスワイプするだけで\nAIが分析してドストライク動画を出してくれる\n\n{URL}\n\nあなたのタイプ教えてください↓'
    ]
  }
];

/** 時間帯別テンプレート（UIモックアップ用に使用） */
export const X_TIME_TEMPLATES: Record<string, string[]> = {
  morning: [
    'おはようございます\n\n今日の雑学：自分の「好みのタイプ」を言語化できる男性は20%以下らしい\n\n残り80%の人のために作りました\n写真をスワイプするだけでAIが好みを学習\n{URL}',
    '朝から何ですが\n\nFANZAで理想の動画を探すのに毎回30分かけてる人へ\n\nスワイプで好みを学習したAIが代わりに探します\n{URL}\n\n#FANZA',
  ],
  noon: [
    '昼休みに試してほしいもの\n\n女優写真をスワイプするだけで\nAIが好みを学習してFANZAの動画を提案してくれるやつ\n\n無料です\n{URL}',
    'FANZAの使い方が変わるかもしれないサービス\n\n好きな顔にハート、嫌いな顔にバツ\nAIが学習して似たタイプの女優の動画だけ出してくれる\n{URL}\n\n#AI #FANZA',
  ],
  evening: [
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

/** プレースホルダーを実際の値に置換する */
export function fillTemplate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{${k}}`, v),
    text,
  );
}

/** 今日のマーケティングセットを取得する */
export function getTodayMarketingSet() {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return MARKETING_SETS[dayIndex % MARKETING_SETS.length];
}

/** Instagram用テンプレートを選択する */
export function pickInstagramTemplate(seed?: number): string {
  const arr = INSTAGRAM_CAPTIONS;
  const idx = seed !== undefined ? seed % arr.length : Math.floor(Math.random() * arr.length);
  return fillTemplate(arr[idx], { URL: SITE_URL });
}

/** 投稿テキストが X の文字数制限（280文字）を超えていないか確認・整形する */
export function truncateForX(text: string): string {
  const LIMIT = 280;
  if (text.length <= LIMIT) return text;
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (!urlMatch) return text.slice(0, LIMIT);
  const url = urlMatch[0];
  const maxBody = LIMIT - url.length - 2;
  const body = text.replace(url, '').trim().slice(0, maxBody);
  return `${body}\n\n${url}`;
}
