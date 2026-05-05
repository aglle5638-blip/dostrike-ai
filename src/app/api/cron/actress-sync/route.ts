/**
 * GET /api/cron/actress-sync
 *
 * FANZA 女優データを全9イニシャル × 最大 MAX_PAGES ページ分取得して
 * fanza_actresses テーブルにキャッシュ・更新する。
 *
 * Vercel Cron: 毎週日曜 JST 1:00 (UTC 16:00)
 *
 * 手動実行:
 *   curl -H "Authorization: Bearer [CRON_SECRET]" \
 *        https://dostrike-ai.vercel.app/api/cron/actress-sync
 *
 * ページネーション戦略:
 *   - FANZA API は1リクエスト最大100件・offset指定可能
 *   - MAX_PAGES=30 → 9イニシャル × 30ページ × 100件 = 最大 27,000件
 *   - リクエスト間: 700ms sleep（レート制限対策）
 *   - Vercel function timeout: 300s 以内に収まるよう調整
 *   - Supabase 無料プラン: 27,000件 × ~600B ≒ 16MB / 500MB → 余裕あり
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const FANZA_ACTRESS_API = 'https://api.dmm.com/affiliate/v3/ActressSearch';
const INITIALS          = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら'];
const HITS_PER_PAGE     = 100;
const MAX_PAGES         = 30;          // イニシャルあたり最大30ページ = 3,000件
const API_INTERVAL_MS   = 700;         // FANZA APIレート制限対策
const DB_BATCH_SIZE     = 100;         // Supabase upsertバッチサイズ
const TIMEOUT_BUDGET_MS = 260_000;     // 260秒（300s制限内で余裕を持って終了）

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function getAgeGroup(birthday?: string): string | null {
  if (!birthday) return null;
  const year = parseInt(birthday.slice(0, 4));
  if (isNaN(year)) return null;
  const age = new Date().getFullYear() - year;
  if (age < 20) return '10代';
  if (age < 30) return '20代';
  return '30代以上';
}

function getBodyType(bust?: string | number | null): string {
  if (!bust) return '普通';
  const b = typeof bust === 'string' ? parseInt(bust) : bust;
  if (isNaN(b as number)) return '普通';
  if ((b as number) >= 90) return 'グラマー';
  if ((b as number) <= 78) return 'スレンダー';
  return '普通';
}

type RawActress = {
  id: string;
  name: string;
  imageURL?: { large?: string; small?: string };
  bust?: string;
  height?: string;
  birthday?: string;
};

type FanzaApiResponse = {
  result: {
    status:       string | number;
    total_count?: number;
    actress?:     RawActress[];
  };
};

async function fetchPage(
  initial: string,
  offset: number,
  affiliateId: string,
  apiKey: string
): Promise<{ actresses: RawActress[]; totalCount: number }> {
  const params = new URLSearchParams({
    site:         'FANZA',
    initial,
    hits:         String(HITS_PER_PAGE),
    offset:       String(offset),
    affiliate_id: affiliateId,
    api_id:       apiKey,
    output:       'json',
  });
  const res = await fetch(`${FANZA_ACTRESS_API}?${params}`, { cache: 'no-store' });
  if (!res.ok) return { actresses: [], totalCount: 0 };

  const data = await res.json() as FanzaApiResponse;
  if (String(data.result.status) !== '200') return { actresses: [], totalCount: 0 };

  return {
    actresses:  (data.result.actress ?? []).filter(a => a.imageURL?.large || a.imageURL?.small),
    totalCount: data.result.total_count ?? 0,
  };
}

export async function GET(request: NextRequest) {
  // ── 認証 ─────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== 'development') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey      = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) {
    return NextResponse.json({ error: 'FANZA credentials not set' }, { status: 500 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
  }

  const startTime     = Date.now();
  let totalUpserted   = 0;
  let totalSkipped    = 0;
  const errors: string[] = [];
  let timedOut        = false;

  for (const initial of INITIALS) {
    if (Date.now() - startTime > TIMEOUT_BUDGET_MS) {
      timedOut = true;
      console.warn('[actress-sync] timeout budget reached, stopping early');
      break;
    }

    let offset     = 1;
    let totalCount = Infinity;
    let pageNo     = 0;
    let batch: ReturnType<typeof buildRow>[] = [];

    while (offset <= totalCount && pageNo < MAX_PAGES) {
      // タイムアウトチェック
      if (Date.now() - startTime > TIMEOUT_BUDGET_MS) {
        timedOut = true;
        break;
      }

      pageNo++;
      try {
        const { actresses, totalCount: tc } = await fetchPage(initial, offset, affiliateId, apiKey);

        if (pageNo === 1) {
          totalCount = tc;
          console.log(`[actress-sync] initial=${initial} total=${tc}`);
        }

        totalSkipped += (HITS_PER_PAGE - actresses.length); // 画像なし分

        for (const a of actresses) {
          batch.push(buildRow(a));
          if (batch.length >= DB_BATCH_SIZE) {
            const { error } = await supabase
              .from('fanza_actresses')
              .upsert(batch, { onConflict: 'id' });
            if (error) {
              errors.push(`initial=${initial} p${pageNo}: ${error.message}`);
            } else {
              totalUpserted += batch.length;
            }
            batch = [];
          }
        }
      } catch (e) {
        errors.push(`initial=${initial} p${pageNo}: ${String(e)}`);
      }

      offset += HITS_PER_PAGE;
      if (offset <= totalCount && pageNo < MAX_PAGES) {
        await sleep(API_INTERVAL_MS);
      }
    }

    // 残バッチをflush
    if (batch.length > 0) {
      const { error } = await supabase
        .from('fanza_actresses')
        .upsert(batch, { onConflict: 'id' });
      if (error) {
        errors.push(`initial=${initial} final-batch: ${error.message}`);
      } else {
        totalUpserted += batch.length;
      }
    }

    console.log(`[actress-sync] initial=${initial} done, upserted so far: ${totalUpserted}`);

    // 次のイニシャルの前に少し待機
    if (INITIALS.indexOf(initial) < INITIALS.length - 1 && !timedOut) {
      await sleep(API_INTERVAL_MS);
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const result = { success: true, totalUpserted, totalSkipped, errors, elapsed, timedOut };
  console.log('[actress-sync] complete:', result);
  return NextResponse.json(result);
}

function buildRow(a: RawActress) {
  const bodyType  = getBodyType(a.bust);
  const ageGroup  = getAgeGroup(a.birthday);
  const heightNum = a.height ? parseInt(a.height) : null;
  const tags: string[] = [bodyType];
  if (ageGroup) tags.push(ageGroup);
  if (heightNum) {
    if (heightNum >= 165)      tags.push('高身長');
    else if (heightNum <= 153) tags.push('小柄');
    else                       tags.push('標準身長');
  }
  return {
    id:          a.id,
    name:        a.name,
    image_url:   a.imageURL?.large ?? a.imageURL?.small ?? null,
    image_small: a.imageURL?.small ?? null,
    bust:        a.bust   ? parseInt(a.bust)   : null,
    height:      heightNum,
    birthday:    a.birthday ?? null,
    age_group:   ageGroup,
    body_type:   bodyType,
    tags,
    synced_at:   new Date().toISOString(),
  };
}
