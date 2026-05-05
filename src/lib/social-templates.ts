/**
 * SNS投稿テンプレート管理
 *
 * X（Twitter）向けの投稿テキストを管理するモジュール。
 * - 22種類の単一タイプセットを日別ローテーションで回す
 * - searchKeyword で FANZA API を検索 → 一致した動画パッケ画を投稿画像に使用
 * - テキスト内容と投稿画像のタイプが確実に一致する設計
 */

export const SITE_URL = 'https://dostrike-ai.vercel.app';

// ─────────────────────────────────────────────────────────────────────────────
// マーケティングセット定義（22種類・単一タイプ）
// ─────────────────────────────────────────────────────────────────────────────

export const MARKETING_SETS = [
  {
    id: 'seiso',
    faceTypeId: 'A1',
    imageFile: 'beauty_a.png',
    label: '清楚系',
    searchKeyword: '清楚',
    cardTag: '清楚系',
    templates: [
      '「清楚系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#清楚系 #FANZA #AI',
      '清楚で芯のある女性を探すのって意外と大変。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動で見つけてくれます\n\n{URL}\n\n#清楚系 #FANZA',
    ],
  },
  {
    id: 'gal',
    faceTypeId: 'D1',
    imageFile: 'beauty_b.png',
    label: 'ギャル系',
    searchKeyword: 'ギャル',
    cardTag: 'ギャル系',
    templates: [
      '「ギャル系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#ギャル系 #FANZA #AI',
      '元気でノリのいいギャル系が好きな人へ。\n\nスワイプするだけでAIが好みを学習して\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#ギャル系 #FANZA',
    ],
  },
  {
    id: 'cool',
    faceTypeId: 'E1',
    imageFile: 'beauty_c.png',
    label: 'クール系',
    searchKeyword: 'クール',
    cardTag: 'クール系',
    templates: [
      '「クール系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#クール系 #FANZA #AI',
      'ミステリアスでクールな雰囲気の女性が好きな人へ。\n\nスワイプで好みを教えるだけで\nAIが自動でドストライク作品を提案します\n\n{URL}\n\n#クール系 #FANZA',
    ],
  },
  {
    id: 'onesan',
    faceTypeId: 'F1',
    imageFile: 'beauty_a.png',
    label: 'お姉さん系',
    searchKeyword: 'お姉さん',
    cardTag: 'お姉さん系',
    templates: [
      '「お姉さん系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#お姉さん系 #FANZA #AI',
      '色っぽくて余裕があるお姉さん系が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を見つけてくれます\n\n{URL}\n\n#お姉さん系 #FANZA',
    ],
  },
  {
    id: 'kyonyu',
    faceTypeId: 'A1',
    imageFile: 'beauty_b.png',
    label: '巨乳',
    searchKeyword: '巨乳',
    cardTag: '巨乳',
    templates: [
      '「巨乳」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#巨乳 #FANZA #AI',
      '巨乳といっても好みの細かい違いってありますよね。\n\nスワイプで好みを学習したAIが\nあなたの「まさにコレ」を自動提案します\n\n{URL}\n\n#巨乳 #FANZA',
    ],
  },
  {
    id: 'slender',
    faceTypeId: 'E1',
    imageFile: 'beauty_c.png',
    label: 'スレンダー',
    searchKeyword: 'スレンダー',
    cardTag: 'スレンダー',
    templates: [
      '「スレンダー」な女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#スレンダー #FANZA #AI',
      'しなやかでスレンダーなボディが好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#スレンダー #FANZA',
    ],
  },
  {
    id: 'hitozuma',
    faceTypeId: 'F1',
    imageFile: 'beauty_a.png',
    label: '人妻',
    searchKeyword: '人妻',
    cardTag: '人妻',
    templates: [
      '「人妻もの」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#人妻 #FANZA #AI',
      '人妻ものって当たり外れが激しくないですか？\n\nスワイプで好みを学習したAIが\n「ドンピシャ」の作品だけを自動で出してくれます\n\n{URL}\n\n#人妻 #FANZA',
    ],
  },
  {
    id: 'seifuku',
    faceTypeId: 'A1',
    imageFile: 'beauty_b.png',
    label: '制服',
    searchKeyword: '制服',
    cardTag: '制服',
    templates: [
      '「制服」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#制服 #FANZA #AI',
      '制服が好きな人へ。\n\nスワイプで好みを教えるだけで\nAIが自動でドストライクな制服作品を提案します\n\nやるたびに精度が上がっていく\n{URL}\n\n#制服 #FANZA',
    ],
  },
  {
    id: 'ol',
    faceTypeId: 'D1',
    imageFile: 'beauty_c.png',
    label: 'OL',
    searchKeyword: 'OL',
    cardTag: 'OL',
    templates: [
      '「OL」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#OL #FANZA #AI',
      'スーツ姿のOLが好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#OL #FANZA',
    ],
  },
  {
    id: 'shirouto',
    faceTypeId: 'A1',
    imageFile: 'beauty_a.png',
    label: '素人系',
    searchKeyword: '素人',
    cardTag: '素人系',
    templates: [
      '「素人系」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#素人 #FANZA #AI',
      '作り込んでない自然な素人感が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を見つけてくれます\n\n{URL}\n\n#素人 #FANZA',
    ],
  },
  {
    id: 'bikyaku',
    faceTypeId: 'E1',
    imageFile: 'beauty_b.png',
    label: '美脚',
    searchKeyword: '美脚',
    cardTag: '美脚',
    templates: [
      '「美脚」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#美脚 #FANZA #AI',
      '美脚に目が行ってしまう人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#美脚 #FANZA',
    ],
  },
  {
    id: 'tennen',
    faceTypeId: 'A1',
    imageFile: 'beauty_c.png',
    label: '天然系',
    searchKeyword: '天然',
    cardTag: '天然系',
    templates: [
      '「天然系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#天然 #FANZA #AI',
      '天然でほんわかした雰囲気が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#天然 #FANZA',
    ],
  },
  {
    id: 'megane',
    faceTypeId: 'E1',
    imageFile: 'beauty_a.png',
    label: 'メガネっ娘',
    searchKeyword: 'メガネ',
    cardTag: 'メガネっ娘',
    templates: [
      '「メガネっ娘」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#メガネっ娘 #FANZA #AI',
      'メガネをかけた知的な女性が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#メガネっ娘 #FANZA',
    ],
  },
  {
    id: 'idol',
    faceTypeId: 'D1',
    imageFile: 'beauty_b.png',
    label: 'アイドル系',
    searchKeyword: 'アイドル',
    cardTag: 'アイドル系',
    templates: [
      '「アイドル系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#アイドル系 #FANZA #AI',
      '顔がかわいくてアイドル系の雰囲気が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#アイドル系 #FANZA',
    ],
  },
  {
    id: 'joshidaisei',
    faceTypeId: 'A1',
    imageFile: 'beauty_c.png',
    label: '女子大生',
    searchKeyword: '女子大生',
    cardTag: '女子大生',
    templates: [
      '「女子大生」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#女子大生 #FANZA #AI',
      '大学生らしいフレッシュさが好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#女子大生 #FANZA',
    ],
  },
  {
    id: 'jukujo',
    faceTypeId: 'F1',
    imageFile: 'beauty_a.png',
    label: '熟女',
    searchKeyword: '熟女',
    cardTag: '熟女',
    templates: [
      '「熟女」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#熟女 #FANZA #AI',
      '熟女の艶っぽさが好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#熟女 #FANZA',
    ],
  },
  {
    id: 'chijo',
    faceTypeId: 'D1',
    imageFile: 'beauty_b.png',
    label: '痴女',
    searchKeyword: '痴女',
    cardTag: '痴女',
    templates: [
      '「痴女系」が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#痴女 #FANZA #AI',
      '積極的でグイグイくる痴女系が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#痴女 #FANZA',
    ],
  },
  {
    id: 'kurokami',
    faceTypeId: 'A1',
    imageFile: 'beauty_c.png',
    label: '黒髪',
    searchKeyword: '黒髪',
    cardTag: '黒髪',
    templates: [
      '「黒髪」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#黒髪 #FANZA #AI',
      '黒髪の清潔感のある女性が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#黒髪 #FANZA',
    ],
  },
  {
    id: 'short',
    faceTypeId: 'E1',
    imageFile: 'beauty_a.png',
    label: 'ショートカット',
    searchKeyword: 'ショートカット',
    cardTag: 'ショートカット',
    templates: [
      '「ショートカット」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#ショートカット #FANZA #AI',
      'ショートカットが似合う女性が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#ショートカット #FANZA',
    ],
  },
  {
    id: 'tsundere',
    faceTypeId: 'D1',
    imageFile: 'beauty_b.png',
    label: 'ツンデレ',
    searchKeyword: 'ツンデレ',
    cardTag: 'ツンデレ',
    templates: [
      '「ツンデレ」な女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#ツンデレ #FANZA #AI',
      '最初はツンッとしてるのに実はデレデレ…そういうの好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#ツンデレ #FANZA',
    ],
  },
  {
    id: 'koakuma',
    faceTypeId: 'D1',
    imageFile: 'beauty_c.png',
    label: '小悪魔系',
    searchKeyword: '小悪魔',
    cardTag: '小悪魔系',
    templates: [
      '「小悪魔系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#小悪魔系 #FANZA #AI',
      '誘惑してくる小悪魔系が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#小悪魔系 #FANZA',
    ],
  },
  {
    id: 'iyashi',
    faceTypeId: 'A1',
    imageFile: 'beauty_a.png',
    label: '癒し系',
    searchKeyword: '癒し',
    cardTag: '癒し系',
    templates: [
      '「癒し系」の女性が好きですか？\n\n好みの顔をスワイプするだけでAIが好みを学習して\nあなたにドストライクな動画だけを提案してくれます\n\n完全無料です👇\n{URL}\n\n#癒し系 #FANZA #AI',
      'ほっこり癒し系の雰囲気が好きな人へ。\n\nスワイプで好みを学習したAIが\nFANZAのドストライク作品を自動提案します\n\n{URL}\n\n#癒し系 #FANZA',
    ],
  },
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
