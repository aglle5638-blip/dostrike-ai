/**
 * 顔タイプID → FANZA検索キーワード変換エンジン
 *
 * TYPE_CATALOG の各タイプに対し、FANZA APIの検索で実際に効くキーワードを
 * 優先度順（primary > secondary）で定義する。
 * FANZA API の keyword パラメータはスペース区切りで複数指定可能。
 */

export interface TypeKeywords {
  primary: string[];    // 必ず使う強いキーワード（最大2）
  secondary: string[];  // 補助キーワード（ソフトマッチング用）
  fanzaGenreIds?: number[]; // FANZA ジャンルID（将来の article 絞り込み用）
}

/**
 * タイプIDから検索キーワードセットを返す。
 * 未定義のIDは空配列で fallback。
 */
export const TYPE_KEYWORDS: Record<string, TypeKeywords> = {
  // ─── GROUP A: 清楚系 ─────────────────────────────────────────
  A1: { primary: ['清楚', '黒髪'],     secondary: ['スレンダー', 'ロング', '色白'] },
  A2: { primary: ['清楚', '黒髪'],     secondary: ['ショート', 'ボブ', '色白'] },
  A3: { primary: ['清楚', '茶髪'],     secondary: ['ロング', '上品', '色白'] },
  A4: { primary: ['清楚', '巨乳'],     secondary: ['黒髪', '色白', 'グラマー'] },
  A5: { primary: ['清楚', 'メガネ'],   secondary: ['知的', '色白', '眼鏡'] },

  // ─── GROUP B: キュート系 ─────────────────────────────────────
  B1: { primary: ['かわいい', '童顔'], secondary: ['ボブ', '色白', '小顔'] },
  B2: { primary: ['アイドル系', 'かわいい'], secondary: ['ツインテール', '元気', '色白'] },
  B3: { primary: ['天然', 'かわいい'], secondary: ['素朴', 'フレッシュ', '素人系'] },
  B4: { primary: ['ぽっちゃり', 'かわいい'], secondary: ['癒し系', '健康的'] },
  B5: { primary: ['アイドル系', '色白'], secondary: ['かわいい', '小顔', '小柄'] },

  // ─── GROUP C: お姉さん系 ─────────────────────────────────────
  C1: { primary: ['お姉さん系', 'セクシー'], secondary: ['黒髪', '色白', 'グラマー'] },
  C2: { primary: ['熟女', 'エレガント'],    secondary: ['美人', '上品', '色白'] },
  C3: { primary: ['お姉さん系', 'グラマー'], secondary: ['茶髪', 'ウェーブ', '健康的'] },
  C4: { primary: ['人妻', '知的'],          secondary: ['熟女', 'スーツ', '色白'] },
  C5: { primary: ['人妻', '熟女'],          secondary: ['30代', '家庭的', '健康的'] },

  // ─── GROUP D: ギャル系 ───────────────────────────────────────
  D1: { primary: ['ギャル', '金髪'],        secondary: ['日焼け', '活発'] },
  D2: { primary: ['ギャル', 'グラマー'],    secondary: ['茶髪', '日焼け', 'スタイル抜群'] },
  D3: { primary: ['ヤンキー系', '個性的'],  secondary: ['ロング', '日焼け'] },
  D4: { primary: ['個性的', 'サブカル'],    secondary: ['色白', '不思議系'] },
  D5: { primary: ['ギャル', '巨乳'],        secondary: ['金髪', 'グラマー', '日焼け'] },

  // ─── GROUP E: クール系 ───────────────────────────────────────
  E1: { primary: ['クール', '黒髪'],        secondary: ['ショート', 'スレンダー', '色白'] },
  E2: { primary: ['モデル系', 'スレンダー'], secondary: ['クール', '美人', '色白'] },
  E3: { primary: ['外国人', 'ハーフ'],      secondary: ['金髪', 'クール'] },
  E4: { primary: ['ミステリアス', 'クール'], secondary: ['色白', '独特'] },
  E5: { primary: ['モデル', '30代'],        secondary: ['スレンダー', 'クール', '大人'] },

  // ─── GROUP F: その他 ─────────────────────────────────────────
  F1: { primary: ['スポーティ', '健康的'],  secondary: ['日焼け', '活発', '素人系'] },
  F2: { primary: ['素人系', '素朴'],        secondary: ['かわいい', '健康的', '天然'] },
  F3: { primary: ['和風', '黒髪'],          secondary: ['清楚', '色白', '着物'] },
  F4: { primary: ['褐色', 'セクシー'],      secondary: ['エキゾチック', '日焼け'] },
  F5: { primary: ['ぽっちゃり', '熟女'],    secondary: ['30代', '包容力', '人妻'] },
};

/**
 * 複数スロットのタイプIDから FANZA 検索キーワードを集約する。
 * - primary キーワードは全スロット分を union
 * - secondary は最大で補完（重複除去）
 * - 返却は優先度付き配列（先頭ほど強い）
 */
export function aggregateKeywords(typeIds: string[]): string[] {
  const primarySet = new Set<string>();
  const secondarySet = new Set<string>();

  for (const id of typeIds) {
    const kw = TYPE_KEYWORDS[id];
    if (!kw) continue;
    kw.primary.forEach(k => primarySet.add(k));
    kw.secondary.forEach(k => secondarySet.add(k));
  }

  // secondary は primary と重複しないものだけ
  const secondary = [...secondarySet].filter(k => !primarySet.has(k));

  return [...primarySet, ...secondary];
}

/**
 * FANZA API の keyword パラメータ文字列を構築する。
 * FANZA はAND検索のため、3語以上は結果ゼロになりやすい。
 * 各スロットのprimary[0]だけを使い、全体最大2語に制限する。
 */
export function buildFanzaKeyword(typeIds: string[]): string {
  const primarySet = new Set<string>();
  for (const id of typeIds) {
    const kw = TYPE_KEYWORDS[id];
    if (!kw) continue;
    if (kw.primary[0]) primarySet.add(kw.primary[0]);
  }
  // 最大2語（3語以上のANDは件数が激減するため）
  return [...primarySet].slice(0, 2).join(' ');
}

/**
 * マッチスコア計算用：ビデオタグ vs タイプキーワードの重み付き一致率
 * @returns 0–100
 */
export function calcMatchScore(
  videoTags: string[],
  typeIds: string[],
  baseScore = 70
): number {
  if (typeIds.length === 0) return baseScore;

  const allKeywords = aggregateKeywords(typeIds);
  const primaryKeywords = new Set(
    typeIds.flatMap(id => TYPE_KEYWORDS[id]?.primary ?? [])
  );

  let score = baseScore;
  for (const tag of videoTags) {
    if (primaryKeywords.has(tag)) {
      score += 8;   // primaryヒットは高得点
    } else if (allKeywords.includes(tag)) {
      score += 3;   // secondaryヒット
    }
  }
  return Math.min(99, Math.max(0, score));
}
