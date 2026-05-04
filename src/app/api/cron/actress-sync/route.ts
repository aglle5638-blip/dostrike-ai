/**
 * GET /api/cron/actress-sync
 *
 * FANZA 女優データを全9イニシャル分取得して fanza_actresses テーブルにキャッシュする。
 * Vercel Cron: 毎週日曜 JST 1:00 (UTC 16:00)
 *
 * 手動実行:
 *   curl -H "Authorization: Bearer [CRON_SECRET]" https://dostrike-ai.vercel.app/api/cron/actress-sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const FANZA_ACTRESS_API = 'https://api.dmm.com/affiliate/v3/ActressSearch';
const INITIALS = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら'];

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
  if (isNaN(b)) return '普通';
  if (b >= 90) return 'グラマー';
  if (b <= 78) return 'スレンダー';
  return '普通';
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== 'development') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) {
    return NextResponse.json({ error: 'FANZA credentials not set' }, { status: 500 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
  }

  let totalUpserted = 0;
  const errors: string[] = [];

  for (const initial of INITIALS) {
    try {
      const params = new URLSearchParams({
        site:         'FANZA',
        initial,
        hits:         '100',
        offset:       '1',
        affiliate_id: affiliateId,
        api_id:       apiKey,
        output:       'json',
      });

      const res = await fetch(`${FANZA_ACTRESS_API}?${params}`, { cache: 'no-store' });
      if (!res.ok) {
        errors.push(`initial=${initial}: HTTP ${res.status}`);
        continue;
      }

      const data = await res.json() as {
        result: {
          status:   string | number;
          actress?: Array<{
            id:       string;
            name:     string;
            imageURL?: { large?: string; small?: string };
            bust?:    string;
            height?:  string;
            birthday?: string;
          }>;
        };
      };

      if (String(data.result.status) !== '200') {
        errors.push(`initial=${initial}: status ${data.result.status}`);
        continue;
      }

      const actresses = (data.result.actress ?? [])
        .filter(a => a.imageURL?.large || a.imageURL?.small);

      const rows = actresses.map(a => {
        const bodyType = getBodyType(a.bust);
        const ageGroup = getAgeGroup(a.birthday);
        const tags: string[] = [bodyType];
        if (ageGroup) tags.push(ageGroup);
        if (a.height) {
          const h = parseInt(a.height);
          if (h >= 165)      tags.push('高身長');
          else if (h <= 153) tags.push('小柄');
        }
        return {
          id:          a.id,
          name:        a.name,
          image_url:   a.imageURL?.large ?? a.imageURL?.small ?? null,
          image_small: a.imageURL?.small ?? null,
          bust:        a.bust   ? parseInt(a.bust)   : null,
          height:      a.height ? parseInt(a.height) : null,
          birthday:    a.birthday ?? null,
          age_group:   ageGroup,
          body_type:   bodyType,
          tags,
          synced_at:   new Date().toISOString(),
        };
      });

      if (rows.length > 0) {
        const { error } = await supabase
          .from('fanza_actresses')
          .upsert(rows, { onConflict: 'id' });
        if (error) {
          errors.push(`initial=${initial}: ${error.message}`);
        } else {
          totalUpserted += rows.length;
          console.log(`[actress-sync] initial=${initial} upserted ${rows.length}`);
        }
      }

      // レート制限対策
      await new Promise(r => setTimeout(r, 600));
    } catch (e) {
      errors.push(`initial=${initial}: ${String(e)}`);
    }
  }

  return NextResponse.json({ success: true, totalUpserted, errors });
}
