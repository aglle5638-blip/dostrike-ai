/**
 * GET /api/actress/swipe-deck
 *
 * スワイプ好み学習用の女優デッキを返す。
 * 優先順: fanza_actresses DB キャッシュ → FANZA API ライブ → モック
 *
 * Query params:
 *   body?:   'スレンダー' | '普通' | 'グラマー'
 *   age?:    '10代' | '20代' | '30代以上'
 *   height?: '小柄' | '普通' | '高身長'
 *   vibe?:   '清楚系' | 'キュート系' | 'セクシー系' | 'クール系' | '天然系'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export interface SwipeDeckActress {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
  videoCount?: number;
}

// モック（フォールバック用）
const MOCK_ACTRESSES: SwipeDeckActress[] = [
  { id: 'm001', name: '田中 美咲',   imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=1200&fit=crop', tags: ['清楚系'] },
  { id: 'm002', name: '鈴木 あい',   imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop', tags: ['グラマー'] },
  { id: 'm003', name: '山本 さくら', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1200&fit=crop', tags: ['高身長'] },
  { id: 'm004', name: '佐藤 ゆり',   imageUrl: 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=800&h=1200&fit=crop', tags: ['清楚系'] },
  { id: 'm005', name: '伊藤 めぐ',   imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=1200&fit=crop', tags: ['スレンダー'] },
  { id: 'm006', name: '渡辺 ひな',   imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop', tags: ['高身長'] },
  { id: 'm007', name: '中村 りん',   imageUrl: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800&h=1200&fit=crop', tags: ['小柄'] },
  { id: 'm008', name: '小林 まや',   imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=1200&fit=crop', tags: ['グラマー'] },
  { id: 'm009', name: '加藤 しほ',   imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop', tags: ['スレンダー'] },
  { id: 'm010', name: '松本 あんな', imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1200&fit=crop', tags: ['清楚系'] },
  { id: 'm011', name: '井上 なな',   imageUrl: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=800&h=1200&fit=crop', tags: ['小柄'] },
  { id: 'm012', name: '木村 はるか', imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66fc?w=800&h=1200&fit=crop', tags: ['清楚系'] },
];

function getAgeGroup(birthday?: string | null): string | null {
  if (!birthday) return null;
  const year = parseInt(birthday.slice(0, 4));
  if (isNaN(year)) return null;
  const age = new Date().getFullYear() - year;
  if (age < 20) return '10代';
  if (age < 30) return '20代';
  return '30代以上';
}

/** JavaScript Array shuffle (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bodyFilter   = searchParams.get('body')   ?? 'all';
  const ageFilter    = searchParams.get('age')    ?? 'all';
  const heightFilter = searchParams.get('height') ?? 'all';
  const vibeFilter   = searchParams.get('vibe')   ?? 'all';

  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey      = process.env.FANZA_API_KEY;

  // ── 優先1: fanza_actresses DB キャッシュ ─────────────────────────
  const supabase = createServiceClient();
  if (supabase) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('fanza_actresses')
        .select('id, name, image_url, tags')
        .not('image_url', 'is', null);

      if (bodyFilter   !== 'all') query = query.eq('body_type',   bodyFilter);
      if (ageFilter    !== 'all') query = query.eq('age_group',   ageFilter);
      if (heightFilter !== 'all') query = query.eq('height_type', heightFilter);

      // 最大200件取得してJSでランダムシャッフル → 毎回違う顔ぶれ
      const { data, error } = await query.limit(200);

      if (!error && data && (data as unknown[]).length >= 8) {
        const shuffled = shuffle(data as {id: string; name: string; image_url: string; tags: string[]}[]).slice(0, 20);
        const actresses: SwipeDeckActress[] = shuffled.map((a) => ({
          id:       a.id,
          name:     a.name,
          imageUrl: a.image_url,
          tags:     (a.tags as string[]) ?? [],
        }));
        console.log(`[swipe-deck] DB hit: ${actresses.length} actresses (body=${bodyFilter} age=${ageFilter})`);
        return NextResponse.json({ actresses, source: 'db' });
      }
      console.log(`[swipe-deck] DB insufficient (${data?.length ?? 0} rows), falling back to FANZA API`);
    } catch (err) {
      console.error('[swipe-deck] DB error:', err);
    }
  }

  // ── 優先2: FANZA API ─────────────────────────────────────────────
  if (affiliateId && apiKey) {
    try {
      const ALL_INITIALS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら'];
      // フィルターあり: 全9イニシャル並列（多数取得してフィルター後に十分な枚数を確保）
      // フィルターなし: ランダム1イニシャル
      const hasFilter = bodyFilter !== 'all' || ageFilter !== 'all' || heightFilter !== 'all' || vibeFilter !== 'all';
      const targetInitials = hasFilter ? ALL_INITIALS : [ALL_INITIALS[Math.floor(Math.random() * ALL_INITIALS.length)]];

      type RawActress = {
        id: string; name: string;
        imageURL?: { large?: string; small?: string };
        bust?: string; height?: string; birthday?: string;
      };

      const fetchActressesByInitial = async (initial: string): Promise<RawActress[]> => {
        const params = new URLSearchParams({
          site:         'FANZA',
          initial,
          hits:         '50',
          offset:       '1',
          affiliate_id: affiliateId,
          api_id:       apiKey,
          output:       'json',
        });
        const res = await fetch(`https://api.dmm.com/affiliate/v3/ActressSearch?${params}`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json() as {
          result: { status: string | number; actress?: RawActress[] };
        };
        if (String(data.result.status) !== '200') return [];
        return (data.result.actress ?? []).filter(a => a.imageURL?.large || a.imageURL?.small);
      };

      const allResults = await Promise.allSettled(targetInitials.map(fetchActressesByInitial));
      const rawActresses: RawActress[] = allResults
        .filter((r): r is PromiseFulfilledResult<RawActress[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // 重複除去
      const seen = new Set<string>();
      const unique = rawActresses.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      console.log(`[swipe-deck] FANZA API: ${unique.length} unique actresses from ${targetInitials.length} initials`);

      // タグ付け
      const toActress = (a: RawActress): SwipeDeckActress & { _bust: number | null; _heightNum: number | null; _ageGroup: string | null } => {
        const tags: string[] = [];
        const bustNum = a.bust ? parseInt(a.bust) : null;
        if (bustNum !== null) {
          if (bustNum >= 90)      tags.push('グラマー');
          else if (bustNum <= 78) tags.push('スレンダー');
          else                    tags.push('普通');
        }
        const heightNum = a.height ? parseInt(a.height) : null;
        if (heightNum !== null) {
          if (heightNum >= 165)      tags.push('高身長');
          else if (heightNum <= 153) tags.push('小柄');
          else                       tags.push('標準身長');
        }
        const ageGroup = getAgeGroup(a.birthday);
        if (ageGroup) tags.push(ageGroup);
        if (!tags.some(t => ['グラマー','スレンダー','普通'].includes(t))) tags.push('清楚系');
        return {
          id: a.id, name: a.name,
          imageUrl: a.imageURL!.large ?? a.imageURL!.small!,
          tags, _bust: bustNum, _heightNum: heightNum, _ageGroup: ageGroup,
        };
      };

      const allTagged = unique.map(toActress);

      // フィルターマッチ関数
      const bodyMatch = (a: { _bust: number | null }) => {
        if (bodyFilter === 'all') return true;
        if (!a._bust) return bodyFilter === '普通';
        if (bodyFilter === 'グラマー')   return a._bust >= 90;
        if (bodyFilter === 'スレンダー') return a._bust <= 78;
        if (bodyFilter === '普通')       return a._bust > 78 && a._bust < 90;
        return true;
      };

      const ageMatch = (a: { _ageGroup: string | null }) =>
        ageFilter === 'all' || a._ageGroup === ageFilter;

      const heightMatch = (a: { _heightNum: number | null }) => {
        if (heightFilter === 'all') return true;
        if (!a._heightNum) return heightFilter === '普通';
        if (heightFilter === '高身長') return a._heightNum >= 165;
        if (heightFilter === '小柄')   return a._heightNum <= 153;
        if (heightFilter === '普通')   return a._heightNum > 153 && a._heightNum < 165;
        return true;
      };

      const vibeMatch = (a: { tags: string[] }) => {
        if (vibeFilter === 'all') return true;
        return a.tags.includes(vibeFilter);
      };

      // フィルター適用（年齢は絶対に緩和しない。体型・身長は必要に応じて緩和）
      const strictFiltered = allTagged.filter(a => bodyMatch(a) && ageMatch(a) && heightMatch(a) && vibeMatch(a));

      let candidates: typeof allTagged;
      if (strictFiltered.length >= 5) {
        candidates = strictFiltered;
      } else if (ageFilter !== 'all') {
        // 年齢指定あり → 年齢は維持、体型・身長・雰囲気を順次緩和
        const ageBodyFiltered = allTagged.filter(a => ageMatch(a) && bodyMatch(a));
        const ageOnlyFiltered = allTagged.filter(a => ageMatch(a));
        candidates = ageBodyFiltered.length > 0 ? ageBodyFiltered : ageOnlyFiltered.length > 0 ? ageOnlyFiltered : allTagged;
      } else {
        // 年齢指定なし → 体型・身長でフィルタ、足りなければ全体
        const bodyHeightFiltered = allTagged.filter(a => bodyMatch(a) && heightMatch(a));
        candidates = bodyHeightFiltered.length >= 5 ? bodyHeightFiltered : allTagged;
      }

      const result: SwipeDeckActress[] = shuffle(candidates)
        .map(({ id, name, imageUrl, tags }) => ({ id, name, imageUrl, tags }))
        .slice(0, 20);

      console.log(`[swipe-deck] strict=${strictFiltered.length} candidates=${candidates.length} final=${result.length}`);

      if (result.length >= 3) {
        return NextResponse.json({ actresses: result, source: 'fanza' });
      }
    } catch (err) {
      console.error('[swipe-deck] FANZA API failed:', String(err));
    }
  }

  // ── フォールバック: モック ────────────────────────────────────────
  return NextResponse.json({ actresses: shuffle(MOCK_ACTRESSES), source: 'mock' });
}
