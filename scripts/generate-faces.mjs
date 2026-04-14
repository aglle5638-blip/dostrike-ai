/**
 * 30パターンの架空日本人女性顔画像を Imagen 4 で生成するスクリプト
 * 実行: node scripts/generate-faces.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/faces');
const API_KEY = process.env.GEMINI_API_KEY || fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
  .split('\n').find(l => l.startsWith('GEMINI_API_KEY='))?.split('=')[1]?.trim();

if (!API_KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1); }
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 30パターン定義（FaceType と同一の順序）
const FACE_PATTERNS = [
  // GROUP A: 清楚系
  { id: 'A1', prompt: 'Portrait photo of a young Japanese woman in her early 20s, long straight black hair, elegant and pure appearance, white fair skin, soft gentle smile, professional headshot, clean light gray background, natural soft lighting, realistic photo' },
  { id: 'A2', prompt: 'Portrait photo of a young Japanese woman in her early 20s, short black bob haircut, clean and innocent look, fair complexion, subtle makeup, professional headshot, clean light background, natural lighting, realistic photo' },
  { id: 'A3', prompt: 'Portrait photo of a Japanese woman in her mid 20s, long wavy brown hair, refined and elegant appearance, bright fair skin, graceful smile, professional headshot, soft light background, natural lighting, realistic photo' },
  { id: 'A4', prompt: 'Portrait photo of a young Japanese woman in her early 20s, long black hair, pure and elegant look, voluptuous figure visible in shoulders, fair skin, warm smile, professional headshot, clean background, natural lighting, realistic photo' },
  { id: 'A5', prompt: 'Portrait photo of a Japanese woman in her mid 20s, medium black hair, wearing elegant glasses, intelligent and intellectual look, fair skin, composed expression, professional headshot, clean light background, natural lighting, realistic photo' },

  // GROUP B: キュート系
  { id: 'B1', prompt: 'Portrait photo of a Japanese woman in her early 20s, short cute black bob, round face, very youthful and cute appearance, large bright eyes, cheerful smile, professional headshot, pastel background, natural soft lighting, realistic photo' },
  { id: 'B2', prompt: 'Portrait photo of a Japanese woman in her early 20s, twin tails black hair, very cute and youthful look, big round eyes, bright cheerful smile, professional headshot, soft light background, natural lighting, realistic photo' },
  { id: 'B3', prompt: 'Portrait photo of a young Japanese woman in her early 20s, medium wavy brown hair, adorable cute appearance, charming dimples, bright eyes, cheerful expression, professional headshot, clean background, soft natural lighting, realistic photo' },
  { id: 'B4', prompt: 'Portrait photo of a Japanese woman in her early 20s, short brown hair with highlights, sporty cute look, energetic smile, bright clear eyes, professional headshot, clean background, natural lighting, realistic photo' },
  { id: 'B5', prompt: 'Portrait photo of a Japanese woman in her late teens to early 20s, long wavy black hair, very cute face with big eyes, natural minimal makeup, lovely smile, professional headshot, soft light background, natural lighting, realistic photo' },

  // GROUP C: お姉さん系
  { id: 'C1', prompt: 'Portrait photo of a Japanese woman in her late 20s, long straight brown hair, mature and sophisticated appearance, elegant look, confident expression, professional headshot, neutral background, professional lighting, realistic photo' },
  { id: 'C2', prompt: 'Portrait photo of a Japanese woman in her late 20s, medium brown hair, office lady style, professional and smart appearance, business casual attire, composed confident smile, professional headshot, neutral background, realistic photo' },
  { id: 'C3', prompt: 'Portrait photo of a Japanese woman in her late 20s to early 30s, long black hair, dignified and elegant mature beauty, sophisticated makeup, refined expression, professional headshot, clean background, professional lighting, realistic photo' },
  { id: 'C4', prompt: 'Portrait photo of a Japanese woman in her late 20s, medium wavy brown hair, stylish and fashionable appearance, confident mature look, light makeup, professional headshot, neutral background, natural lighting, realistic photo' },
  { id: 'C5', prompt: 'Portrait photo of a Japanese woman in her late 20s, long brown hair, fitness model appearance, healthy athletic look, confident warm smile, professional headshot, clean background, natural lighting, realistic photo' },

  // GROUP D: ギャル系
  { id: 'D1', prompt: 'Portrait photo of a Japanese woman in her early 20s, long bleached blonde hair, gyaru fashion style, tanned skin, bold makeup with lashes, energetic vibrant expression, professional headshot, clean background, natural lighting, realistic photo' },
  { id: 'D2', prompt: 'Portrait photo of a Japanese woman in her early 20s, medium brown highlighted hair, gyaru style, curvy figure, tanned healthy skin, bold makeup, confident smile, professional headshot, clean background, natural lighting, realistic photo' },
  { id: 'D3', prompt: 'Portrait photo of a Japanese woman in her early 20s, long dark hair with highlights, edgy street fashion style, unique bold makeup, confident rebellious expression, professional headshot, neutral background, natural lighting, realistic photo' },
  { id: 'D4', prompt: 'Portrait photo of a Japanese woman in her early 20s, short colorful dyed hair, subculture alternative style, pale skin, artistic makeup, quirky unique expression, professional headshot, clean background, natural lighting, realistic photo' },
  { id: 'D5', prompt: 'Portrait photo of a Japanese woman in her mid 20s, long blonde wavy hair, glamorous gyaru style, tanned skin, full glam makeup, voluptuous look, confident expression, professional headshot, clean background, natural lighting, realistic photo' },

  // GROUP E: クール系
  { id: 'E1', prompt: 'Portrait photo of a Japanese woman in her mid 20s, short sleek black hair, cool and aloof expression, sharp features, model-like appearance, minimal makeup, professional headshot, clean white background, studio lighting, realistic photo' },
  { id: 'E2', prompt: 'Portrait photo of a Japanese woman in her mid 20s, long straight black hair, cool mysterious expression, sharp intelligent eyes, elegant minimal makeup, professional headshot, dark neutral background, dramatic lighting, realistic photo' },
  { id: 'E3', prompt: 'Portrait photo of a Japanese woman in her late 20s, medium ash brown hair, sophisticated cool beauty, strong confident gaze, high fashion style, professional headshot, neutral background, professional lighting, realistic photo' },
  { id: 'E4', prompt: 'Portrait photo of a Japanese woman in her mid 20s, short silver gray dyed hair, avant-garde cool style, striking unique features, bold minimal makeup, professional headshot, clean background, artistic lighting, realistic photo' },
  { id: 'E5', prompt: 'Portrait photo of a Japanese woman in her late 20s, long dark wavy hair, mysterious cool expression, deep expressive eyes, dramatic makeup, gothic elegant style, professional headshot, dark background, dramatic lighting, realistic photo' },

  // GROUP F: その他
  { id: 'F1', prompt: 'Portrait photo of a Japanese woman in her early 20s, long wavy brown hair, natural girl-next-door appearance, no makeup natural look, warm friendly smile, professional headshot, outdoor bright background, natural lighting, realistic photo' },
  { id: 'F2', prompt: 'Portrait photo of a Japanese woman in her mid 20s, medium black hair, athlete appearance, healthy sporty look, energetic confident smile, professional headshot, clean background, bright natural lighting, realistic photo' },
  { id: 'F3', prompt: 'Portrait photo of a Japanese woman in her late 20s to early 30s, long brown hair, young mother appearance, warm nurturing smile, gentle kind eyes, natural makeup, professional headshot, soft background, warm natural lighting, realistic photo' },
  { id: 'F4', prompt: 'Portrait photo of a Japanese woman in her mid 20s, short black hair with bangs, artistic creative appearance, unique stylish look, creative makeup, professional headshot, clean background, artistic lighting, realistic photo' },
  { id: 'F5', prompt: 'Portrait photo of a Japanese woman in her late 20s to early 30s, long elegant black hair, traditional Japanese beauty style, graceful dignified expression, minimal natural makeup, professional headshot, clean background, soft natural lighting, realistic photo' },
];

async function generateImage(pattern) {
  const outPath = path.join(OUTPUT_DIR, `${pattern.id}.jpg`);
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭ ${pattern.id}: already exists, skipping`);
    return true;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${API_KEY}`;
  const body = JSON.stringify({
    instances: [{ prompt: pattern.prompt }],
    parameters: { sampleCount: 1, aspectRatio: '1:1' }
  });

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const data = await res.json();

  if (!data.predictions?.[0]?.bytesBase64Encoded) {
    console.error(`  ❌ ${pattern.id}: ${JSON.stringify(data.error ?? data)}`);
    return false;
  }

  const imgBuf = Buffer.from(data.predictions[0].bytesBase64Encoded, 'base64');
  fs.writeFileSync(outPath, imgBuf);
  console.log(`  ✅ ${pattern.id}: saved (${Math.round(imgBuf.length / 1024)}KB)`);
  return true;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`🎨 Generating ${FACE_PATTERNS.length} face images with Imagen 4...\n`);
  let ok = 0, fail = 0;
  for (const pattern of FACE_PATTERNS) {
    process.stdout.write(`Generating ${pattern.id}... `);
    const success = await generateImage(pattern);
    if (success) ok++; else fail++;
    await sleep(1500); // レートリミット対策
  }
  console.log(`\n✨ Done: ${ok} succeeded, ${fail} failed`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
