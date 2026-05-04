/**
 * FANZA女優一括インポートスクリプト
 * 
 * 実行: node scripts/import-actresses.mjs
 * 前提: .env.production.local に FANZA_AFFILIATE_ID, FANZA_API_KEY,
 *       NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY が設定済みであること。
 * 
 * 動作:
 *   - FANZA API から全9イニシャル分をページネーションで取得（最大100件/リクエスト）
 *   - 画像URLがある女優のみ対象
 *   - 100件ずつバッチでSupabaseにupsert
 *   - FANZA API へのリクエスト間は600msのウェイト（レート制限対策）
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import https from 'https';

// ── 環境変数読み込み ──────────────────────────────────────────────
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}
loadEnv('.env.production.local');
loadEnv('.env.local');

const FANZA_AFFILIATE_ID = process.env.FANZA_AFFILIATE_ID;
const FANZA_API_KEY      = process.env.FANZA_API_KEY;
const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY        = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FANZA_AFFILIATE_ID || !FANZA_API_KEY) {
  console.error('ERROR: FANZA_AFFILIATE_ID / FANZA_API_KEY が設定されていません');
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── ユーティリティ ────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getBodyType(bust) {
  if (!bust) return '普通';
  const b = parseInt(bust);
  if (isNaN(b)) return '普通';
  if (b >= 90) return 'グラマー';
  if (b <= 78) return 'スレンダー';
  return '普通';
}

function getAgeGroup(birthday) {
  if (!birthday) return null;
  const year = parseInt(birthday.slice(0, 4));
  if (isNaN(year)) return null;
  const age = new Date().getFullYear() - year;
  if (age < 20) return '10代';
  if (age < 30) return '20代';
  return '30代以上';
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('JSON parse error: ' + body.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── FANZA 1ページ取得 ─────────────────────────────────────────────
async function fetchPage(initial, offset) {
  const params = new URLSearchParams({
    site:         'FANZA',
    initial,
    hits:         '100',
    offset:       String(offset),
    affiliate_id: FANZA_AFFILIATE_ID,
    api_id:       FANZA_API_KEY,
    output:       'json',
  });
  const url = `https://api.dmm.com/affiliate/v3/ActressSearch?${params}`;
  const data = await fetchJson(url);
  if (String(data.result?.status) !== '200') return { actresses: [], totalCount: 0 };
  return {
    actresses:  data.result.actress ?? [],
    totalCount: data.result.total_count ?? 0,
  };
}

// ── Supabase upsert（100件バッチ）─────────────────────────────────
async function upsertBatch(rows) {
  const { error } = await supabase
    .from('fanza_actresses')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw new Error('Supabase upsert error: ' + error.message);
}

// ── メイン ────────────────────────────────────────────────────────
const INITIALS     = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら'];
const BATCH_SIZE   = 100;
const API_INTERVAL = 700; // ms between FANZA API calls

let grandTotal   = 0;
let grandUpserted = 0;
let grandSkipped  = 0;

for (const initial of INITIALS) {
  console.log(`\n=== イニシャル: ${initial} ===`);
  let offset      = 1;
  let totalCount  = Infinity;
  let pageNo      = 0;
  let initialUpserted = 0;
  let batch       = [];

  while (offset <= totalCount) {
    pageNo++;
    process.stdout.write(`  page ${pageNo} (offset=${offset})... `);

    let result;
    try {
      result = await fetchPage(initial, offset);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
      await sleep(2000);
      continue;
    }

    if (pageNo === 1) totalCount = result.totalCount;
    grandTotal = grandTotal; // keep running count

    const actresses = result.actresses.filter(
      a => a.imageURL?.large || a.imageURL?.small
    );
    grandSkipped += result.actresses.length - actresses.length;
    process.stdout.write(`取得=${result.actresses.length} 画像あり=${actresses.length}\n`);

    for (const a of actresses) {
      const bodyType = getBodyType(a.bust);
      const ageGroup = getAgeGroup(a.birthday);
      const heightNum = a.height ? parseInt(a.height) : null;
      const tags = [bodyType];
      if (ageGroup) tags.push(ageGroup);
      if (heightNum) {
        if (heightNum >= 165)      tags.push('高身長');
        else if (heightNum <= 153) tags.push('小柄');
        else                       tags.push('標準身長');
      }

      batch.push({
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
      });

      if (batch.length >= BATCH_SIZE) {
        await upsertBatch(batch);
        grandUpserted   += batch.length;
        initialUpserted += batch.length;
        console.log(`    -> upserted ${batch.length} (累計: ${grandUpserted})`);
        batch = [];
      }
    }

    offset += 100;
    if (offset <= totalCount) await sleep(API_INTERVAL);
  }

  // 残バッチ
  if (batch.length > 0) {
    await upsertBatch(batch);
    grandUpserted   += batch.length;
    initialUpserted += batch.length;
    console.log(`    -> upserted ${batch.length} (残バッチ)`);
  }

  console.log(`  [${initial}] 完了: upserted=${initialUpserted}, total_in_fanza=${totalCount}`);
  grandTotal += totalCount;
}

console.log('\n========================================');
console.log(`FANZA総女優数:   ${grandTotal}`);
console.log(`画像なしスキップ: ${grandSkipped}`);
console.log(`DB登録完了:      ${grandUpserted}`);
console.log('========================================');
