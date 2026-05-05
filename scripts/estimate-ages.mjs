/**
 * FANZA女優 年齢推定スクリプト（Gemini Vision）
 *
 * 実行: node scripts/estimate-ages.mjs
 *
 * 動作:
 *   - fanza_actresses テーブルから age_group IS NULL の女優を取得
 *   - 各女優の画像を Gemini 2.0 Flash Vision に送信して年齢層を推定
 *   - estimated_age_group カラムに書き込む（10代 / 20代 / 30代以上）
 *   - API呼び出し間は 1秒スリープ（Gemini レート制限対策）
 *
 * 前提:
 *   - estimated_age_group カラムが fanza_actresses に存在すること
 *   - .env.production.local に GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *     SUPABASE_SERVICE_ROLE_KEY が設定済みであること
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

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
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}
loadEnv('.env.production.local');
loadEnv('.env.local');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY) { console.error('ERROR: GEMINI_API_KEY が設定されていません'); process.exit(1); }
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('ERROR: Supabase 環境変数が不足しています'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── 画像URL → base64 取得 ─────────────────────────────────────────
function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const get = (u, depth = 0) => {
      if (depth > 3) return reject(new Error('Too many redirects'));
      // HTTP/HTTPS 両対応（FANZAの画像URLはhttpの場合がある）
      const mod = u.startsWith('https://') ? https : http;
      const req = mod.get(u, { timeout: 10000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, depth + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const mimeType = res.headers['content-type']?.split(';')[0] ?? 'image/jpeg';
          resolve({ base64: buf.toString('base64'), mimeType });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('image fetch timeout')); });
    };
    get(url);
  });
}

// ── Gemini Vision で年齢推定 ──────────────────────────────────────
async function estimateAgeFromImage(imageUrl) {
  let imageData;
  try {
    imageData = await fetchImageAsBase64(imageUrl);
  } catch (e) {
    return null; // 画像取得失敗はスキップ
  }

  const payload = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: imageData.mimeType,
            data: imageData.base64,
          }
        },
        {
          text: `この写真に写っている人物の年齢層を推定してください。
以下の3択のうちいずれか1つだけをJSON形式で返してください。
- "10代": 10〜19歳に見える場合
- "20代": 20〜29歳に見える場合
- "30代以上": 30歳以上に見える場合

必ずJSONのみで回答してください。例: {"age":"20代"}
説明は不要です。`
        }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 30 }
  };

  const body = JSON.stringify(payload);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 20000,
    }, (res) => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(b);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const match = text.match(/["']age["']\s*:\s*["'](10代|20代|30代以上)["']/);
          resolve(match ? match[1] : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ── メイン ────────────────────────────────────────────────────────
const BATCH_UPDATE = 50;  // まとめてupdateするバッチサイズ
const API_INTERVAL = 4000; // Geminiレート制限対策（4秒 = 15 RPM以内）
const RETRY_WAIT   = 30000; // レート制限エラー時の待機時間（30秒）

console.log('Supabase URL:', SUPABASE_URL);

// 処理対象を取得（age_group IS NULL かつ estimated_age_group IS NULL）
const { data: targets, error: fetchErr } = await supabase
  .from('fanza_actresses')
  .select('id, name, image_url')
  .is('age_group', null)
  .is('estimated_age_group', null)
  .not('image_url', 'is', null)
  .order('id')
  .limit(10000);

if (fetchErr) { console.error('Fetch error:', fetchErr.message); process.exit(1); }
console.log(`対象女優数: ${targets.length}人`);

let processed       = 0;
let succeeded       = 0;
let failed          = 0;
let consecutiveFail = 0;
const dist          = { '10代': 0, '20代': 0, '30代以上': 0, null: 0 };

for (const actress of targets) {
  processed++;
  const ageGroup = await estimateAgeFromImage(actress.image_url);
  dist[ageGroup ?? 'null']++;

  if (ageGroup) {
    const { error } = await supabase
      .from('fanza_actresses')
      .update({ estimated_age_group: ageGroup })
      .eq('id', actress.id);
    if (error) {
      console.error(`  UPDATE error for ${actress.name}: ${error.message}`);
      failed++;
      consecutiveFail++;
    } else {
      succeeded++;
      consecutiveFail = 0;
    }
  } else {
    failed++;
    consecutiveFail++;
    // 連続5回失敗 → レート制限とみなして30秒待機
    if (consecutiveFail > 0 && consecutiveFail % 5 === 0) {
      console.log(`  ⚠️ 連続${consecutiveFail}回失敗 → ${RETRY_WAIT/1000}秒待機中...`);
      await sleep(RETRY_WAIT);
    }
  }

  if (processed % 100 === 0) {
    // process.stdout.write で即時フラッシュ（ファイルリダイレクト時のバッファリング対策）
    process.stdout.write(`進捗: ${processed}/${targets.length} | 成功=${succeeded} 失敗=${failed} | 分布: ${JSON.stringify(dist)}\n`);
  }

  await sleep(API_INTERVAL);
}

console.log('\n========================================');
console.log(`処理完了: ${processed}人`);
console.log(`推定成功: ${succeeded}人`);
console.log(`推定失敗/スキップ: ${failed}人`);
console.log('年齢分布:', dist);
console.log('========================================');
