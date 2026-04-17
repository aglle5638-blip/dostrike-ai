/**
 * GET /api/cron/weekly-actress-batch
 *
 * 週次バッチ（毎週日曜 JST 0:00）
 * vercel.json: { "path": "/api/cron/weekly-actress-batch", "schedule": "0 15 * * 0" }
 *
 * 処理内容:
 *   1. FANZA ActressSearch API で人気女優を最大 MAX_ACTRESSES 人取得
 *   2. プロフィール画像がある女優を Gemini Vision で顔分析 → actress_profiles に保存
 *   3. 全 30 顔タイプと女優の類似スコアを計算 → actress_face_matches に保存（上位 TOP_MATCHES 人/タイプ）
 *
 * 初回セットアップ時は手動で以下を叩いてください:
 *   curl -H "Authorization: Bearer [CRON_SECRET]" https://your-domain.com/api/cron/weekly-actress-batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  TYPE_FACE_PROFILES,
  analyzeActressFace,
  scoreFaceMatch,
  sleep,
} from '@/lib/fanza/face-matching';
import type { FaceFeatures } from '@/app/api/analyze-face/route';

const MAX_ACTRESSES  = 10;    // 1回のバッチで処理する女優数（Vercelタイムアウト対策）
const BATCH_SIZE     = 100;   // FANZA API 1回あたりの取得数
const TOP_MATCHES    = 20;    // 顔タイプごとに保存する上位マッチ数
const GEMINI_DELAY   = 100;   // Gemini API レート制限対策 (ms)

const FANZA_API_BASE = 'https://api.dmm.com/affiliate/v3/ActressSearch';

interface FanzaActress {
  id: string;
  name: string;
  imageURL?: { large?: string; small?: string };
}

export async function GET(request: NextRequest) {
  // ── 認証 ──────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret  = process.env.CRON_SECRET;

  if (process.env.NODE_ENV !== 'development') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── ページング（?offset=N で分割実行可能） ───────────────────
  const url        = new URL(request.url);
  const pageOffset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const affiliateId = process.env.FANZA_AFFILIATE_ID;
  const apiKey      = process.env.FANZA_API_KEY;
  if (!affiliateId || !apiKey) {
    return NextResponse.json({ error: 'FANZA credentials not set' }, { status: 500 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not available' }, { status: 500 });
  }

  const startTime = Date.now();
  const report = {
    startedAt:        new Date().toISOString(),
    actressesFetched: 0,
    actressesAnalyzed: 0,
    matchesStored:    0,
    errors:           0,
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1: FANZA から女優リストを取得（プロフィール画像付きのみ）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const actresses: FanzaActress[] = [];

  // pageOffset を使って FANZA APIのoffsetを決定（1-origin）
  const fanzaStartOffset = pageOffset + 1;

  for (let offset = fanzaStartOffset; actresses.length < MAX_ACTRESSES; offset += BATCH_SIZE) {
    try {
      const params = new URLSearchParams({
        site:         'FANZA',
        hits:         String(BATCH_SIZE),
        offset:       String(offset),
        affiliate_id: affiliateId,
        api_id:       apiKey,
        output:       'json',
      });
      const res  = await fetch(`${FANZA_API_BASE}?${params}`);
      const data = await res.json() as {
        result: { status: string | number; actress?: FanzaActress[] }
      };

      if (String(data.result.status) !== '200') break;

      const batch = data.result.actress ?? [];
      // プロフィール画像がある女優のみ
      const withImage = batch.filter(a => a.imageURL?.large || a.imageURL?.small);
      actresses.push(...withImage);
      report.actressesFetched += withImage.length;

      if (batch.length < BATCH_SIZE) break; // 最終ページ
      await sleep(200);
    } catch (err) {
      console.error('[weekly-actress-batch] FANZA fetch error:', err);
      break;
    }
  }

  console.log(`[weekly-actress-batch] Fetched ${actresses.length} actresses with images`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2: Gemini Vision で各女優の顔を分析して actress_profiles に保存
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const analyzedActresses: Array<{ id: string; name: string; features: FaceFeatures }> = [];

  for (const actress of actresses) {
    const imageUrl = actress.imageURL?.large ?? actress.imageURL?.small;
    if (!imageUrl) continue;

    try {
      const features = await analyzeActressFace(imageUrl);
      if (!features) { report.errors++; continue; }

      // Supabase に保存
      await supabase.from('actress_profiles').upsert({
        id:           actress.id,
        name:         actress.name,
        image_url:    imageUrl,
        face_features: features as unknown as import('@/lib/supabase/types').Json,
        analyzed_at:  new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      });

      analyzedActresses.push({ id: actress.id, name: actress.name, features });
      report.actressesAnalyzed++;

      // レート制限対策
      await sleep(GEMINI_DELAY);
    } catch (err) {
      console.error(`[weekly-actress-batch] Analysis failed for ${actress.name}:`, err);
      report.errors++;
    }
  }

  console.log(`[weekly-actress-batch] Analyzed ${analyzedActresses.length} actresses`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3: 全 30 顔タイプ × 女優でスコアを計算して上位を保存
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  for (const [typeId, typeProfile] of Object.entries(TYPE_FACE_PROFILES)) {
    // スコア計算
    const scored = analyzedActresses.map(a => ({
      actress_id:   a.id,
      actress_name: a.name,
      match_score:  scoreFaceMatch(a.features, typeProfile),
    }));

    // 上位 TOP_MATCHES 人を抽出（スコア0は除外）
    const topMatches = scored
      .filter(s => s.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, TOP_MATCHES);

    if (topMatches.length === 0) continue;

    // Supabase に upsert
    const rows = topMatches.map(m => ({
      face_type_id:  typeId,
      actress_id:    m.actress_id,
      actress_name:  m.actress_name,
      match_score:   m.match_score,
      created_at:    new Date().toISOString(),
    }));

    const { error } = await supabase.from('actress_face_matches').upsert(rows);
    if (error) {
      console.error(`[weekly-actress-batch] upsert failed for ${typeId}:`, error);
      report.errors++;
    } else {
      report.matchesStored += rows.length;
    }
  }

  const elapsed = Date.now() - startTime;
  const nextOffset = pageOffset + MAX_ACTRESSES;
  console.log(`[weekly-actress-batch] Done in ${elapsed}ms. Report:`, report);

  return NextResponse.json({
    success: true,
    elapsedMs: elapsed,
    report,
    nextOffset,  // 次回実行時に ?offset=nextOffset を指定
    nextCommand: `curl -H "Authorization: Bearer [CRON_SECRET]" https://dostrike-ai.vercel.app/api/cron/weekly-actress-batch?offset=${nextOffset}`,
  });
}
