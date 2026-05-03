/**
 * GET /api/actress/swipe-deck
 *
 * スワイプ好み学習用の女優デッキを返す。
 * FANZA ActressSearch API の人気順で取得し、写真あり女優のみを返す。
 *
 * Response:
 *   { actresses: SwipeDeckActress[], source: 'fanza' | 'mock' }
 */

import { NextResponse } from 'next/server';

export interface SwipeDeckActress {
  id: string;
  name: string;
  imageUrl: string;        // medium サイズ
  tags: string[];          // 雰囲気タグ（bust/bodyHeight/スリーサイズから生成）
  videoCount?: number;
}

const MOCK_ACTRESSES: SwipeDeckActress[] = [
  { id: 'm001', name: '田中 美咲', imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop', tags: ['清楚系', '黒髪'] },
  { id: 'm002', name: '鈴木 あい', imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop', tags: ['キュート系', '笑顔'] },
  { id: 'm003', name: '山本 さくら', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop', tags: ['お姉さん系', '色気'] },
  { id: 'm004', name: '佐藤 ゆり', imageUrl: 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=600&fit=crop', tags: ['清楚系', 'ロング'] },
  { id: 'm005', name: '伊藤 めぐ', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', tags: ['ギャル系', '元気'] },
  { id: 'm006', name: '渡辺 ひな', imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=600&fit=crop', tags: ['クール系', 'モデル'] },
  { id: 'm007', name: '中村 りん', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop', tags: ['キュート系', '童顔'] },
  { id: 'm008', name: '小林 まや', imageUrl: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop', tags: ['お姉さん系', '人妻'] },
  { id: 'm009', name: '加藤 しほ', imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop', tags: ['清楚系', 'ショート'] },
  { id: 'm010', name: '松本 あんな', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop', tags: ['ギャル系', '明るい'] },
  { id: 'm011', name: '井上 なな', imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop', tags: ['クール系', 'ミステリアス'] },
  { id: 'm012', name: '木村 はるか', imageUrl: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=600&fit=crop', tags: ['清楚系', '色白'] },
];

export async function GET() {
  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey      = process.env.FANZA_API_KEY;

  // ── 本番: FANZA ActressSearch ─────────────────────────────────────
  if (affiliateId && apiKey) {
    try {
      // 多様性を確保するためランダムオフセットで取得（ActressSearch は sort=popular 非対応）
      const randomOffset = Math.floor(Math.random() * 5) * 20 + 1; // 1,21,41,61,81

      const params = new URLSearchParams({
        site:         'FANZA',
        hits:         '30',
        offset:       String(randomOffset),
        affiliate_id: affiliateId,
        api_id:       apiKey,
        output:       'json',
      });

      const url = `https://api.dmm.com/affiliate/v3/ActressSearch?${params}`;
      console.log('[swipe-deck] fetching:', url.replace(apiKey, '***').replace(affiliateId, '***'));

      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`ActressSearch HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json() as {
        result: {
          status: string | number;
          result_count?: number;
          total_count?: number;
          actress?: Array<{
            id: string;
            name: string;
            ruby?: string;
            imageURL?: { small?: string; medium?: string; large?: string };
            bust?: string;
            waist?: string;
            hip?: string;
            height?: string;
            birthday?: string;
            prefectures?: string;
          }>;
        };
      };

      console.log('[swipe-deck] status:', data.result.status, 'total:', data.result.total_count, 'count:', data.result.result_count);

      if (String(data.result.status) !== '200') {
        throw new Error(`ActressSearch API status=${data.result.status}`);
      }

      const actresses: SwipeDeckActress[] = (data.result.actress ?? [])
        .filter(a => a.imageURL?.medium && a.imageURL.medium !== '')
        .map(a => {
          const tags: string[] = [];
          // スリーサイズからタグ生成
          if (a.bust) {
            const b = parseInt(a.bust);
            if (b >= 90) tags.push('グラマー');
            else if (b <= 78) tags.push('スレンダー');
          }
          if (a.height) {
            const h = parseInt(a.height);
            if (h >= 165) tags.push('高身長');
            else if (h <= 153) tags.push('小柄');
          }
          if (!tags.length) tags.push('清楚系');
          return {
            id: a.id,
            name: a.name,
            imageUrl: a.imageURL!.medium!,
            tags,
          };
        })
        .slice(0, 20);

      console.log('[swipe-deck] actresses with images:', actresses.length);

      if (actresses.length < 5) throw new Error(`Too few actresses with images: ${actresses.length}`);

      return NextResponse.json({ actresses, source: 'fanza' });
    } catch (err) {
      console.error('[swipe-deck] FANZA API failed:', String(err));
      // モックへフォールバック
    }
  }

  // ── モック ───────────────────────────────────────────────────────
  return NextResponse.json({ actresses: MOCK_ACTRESSES, source: 'mock' });
}
