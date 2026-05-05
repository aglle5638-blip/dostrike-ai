/**
 * GET /api/generate-marketing-image
 *
 * スワイプUIのスマホモックアップ画像をSatori(next/og)で動的生成して返す。
 * X(Twitter)投稿の「アプリUI説明」画像として使用。
 *
 * Query params:
 *   imageUrl?  — 女優画像URL（FANZAプロフィール or 動画サムネイル）
 *   name?      — 女優名（カード内表示用）
 *   tag?       — タグ（例: "ギャル系 • 20代"）
 *   liked?     — "true" のとき LIKE スタンプを表示（デフォルト: true）
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const WIDTH  = 1200;
const HEIGHT = 630;

// プライマリカラー
const PRIMARY = '#e85d8a';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl    = searchParams.get('imageUrl') ?? '';
  const actressName = searchParams.get('name')     ?? '有村まほ';
  const tag         = searchParams.get('tag')      ?? 'スレンダー • 20代';
  const liked       = searchParams.get('liked')    !== 'false';

  // 女優画像をbase64に変換（CORSや失敗時はグラデ塗りつぶし）
  let actressImgSrc: string | null = null;
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        const ct  = res.headers.get('content-type') ?? 'image/jpeg';
        actressImgSrc = `data:${ct};base64,${b64}`;
      }
    } catch { /* use gradient fallback */ }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fff5f8 0%, #fce4ed 40%, #f8d0e4 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景デコレーション */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,93,138,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,93,138,0.1) 0%, transparent 70%)',
        }} />

        {/* ── スマホモックアップ ──────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            width: 230,
            height: 460,
            background: '#1a1a2e',
            borderRadius: 36,
            padding: 9,
            boxShadow: '0 40px 100px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(255,255,255,0.12)',
            flexShrink: 0,
            marginLeft: 60,
            transform: 'rotate(-3deg)',
          }}
        >
          {/* スクリーン */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              background: '#ffffff',
              borderRadius: 28,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* ステータスバー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 14px 2px', fontSize: 9, color: '#444', flexShrink: 0 }}>
              <span>9:41</span>
              <span style={{ letterSpacing: 2 }}>●●●</span>
            </div>

            {/* アプリヘッダー */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 10px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: PRIMARY, letterSpacing: 0.5 }}>⚡ ドストライクAI</span>
            </div>

            {/* サブタイトル */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3px 8px', fontSize: 8, color: '#888', flexShrink: 0 }}>
              好みの女優タイプは？
            </div>

            {/* プログレスバー */}
            <div style={{ display: 'flex', padding: '2px 10px 4px', flexShrink: 0 }}>
              <div style={{ display: 'flex', width: '100%', height: 3, background: '#f0f0f0', borderRadius: 2 }}>
                <div style={{ width: '30%', height: 3, background: PRIMARY, borderRadius: 2 }} />
              </div>
            </div>

            {/* スワイプカード */}
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                position: 'relative',
                margin: '0 7px 6px',
                borderRadius: 14,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #fce4ed, #f8d0e4)',
              }}
            >
              {actressImgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={actressImgSrc}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, #fce4ed 0%, #f4b8d1 100%)',
                }} />
              )}

              {/* LIKE スタンプ */}
              {liked && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'absolute',
                    top: 10,
                    left: 8,
                    border: `2px solid ${PRIMARY}`,
                    borderRadius: 5,
                    padding: '2px 6px',
                    color: PRIMARY,
                    fontWeight: 900,
                    fontSize: 13,
                    background: 'rgba(255,255,255,0.2)',
                    transform: 'rotate(-15deg)',
                    letterSpacing: 1,
                  }}
                >
                  <span>LIKE ❤</span>
                </div>
              )}

              {/* 名前オーバーレイ */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.78))',
                  padding: '18px 9px 7px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>{actressName}</span>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 8, marginTop: 1 }}>{tag}</span>
              </div>
            </div>

            {/* ボタン列 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 10px 10px', flexShrink: 0 }}>
              <div style={{
                display: 'flex', width: 38, height: 38, borderRadius: 19,
                background: '#f5f5f5', border: '1.5px solid #e0e0e0',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, marginRight: 14,
              }}>✕</div>
              <div style={{
                display: 'flex', width: 44, height: 44, borderRadius: 22,
                background: PRIMARY, alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                boxShadow: `0 4px 14px rgba(232,93,138,0.5)`,
              }}>❤</div>
            </div>
          </div>
        </div>

        {/* ── 右側テキストエリア ──────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 64,
            marginRight: 60,
            flexGrow: 1,
          }}
        >
          {/* バッジ */}
          <div style={{
            display: 'flex',
            background: PRIMARY,
            color: '#fff',
            borderRadius: 100,
            padding: '5px 16px',
            fontSize: 13,
            fontWeight: 700,
            width: 'fit-content',
            marginBottom: 16,
          }}>
            完全無料 · 登録不要
          </div>

          {/* メインコピー */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1.1,
            color: '#1a0a0f',
            marginBottom: 16,
          }}>
            <span>女優版</span>
            <span>Tinderを</span>
            <span>作りました</span>
          </div>

          {/* サブコピー */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 18,
            color: '#555',
            lineHeight: 1.6,
            marginBottom: 20,
          }}>
            <span>好きな顔にハート ❤  違う顔にバツ ✕</span>
            <span>AIが好みを学習して理想の作品を自動提案</span>
          </div>

          {/* 特徴リスト */}
          {['スワイプするだけで超かんたん', 'やるたびに精度がアップ', 'FANZAの作品から自動でレコメンド'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', fontSize: 15, color: '#333', marginBottom: 7 }}>
              <span style={{ color: PRIMARY, fontWeight: 700, marginRight: 8, fontSize: 16 }}>✓</span>
              <span>{t}</span>
            </div>
          ))}

          {/* URL */}
          <div style={{
            display: 'flex',
            marginTop: 22,
            background: '#1a0a0f',
            color: '#fff',
            borderRadius: 50,
            padding: '12px 28px',
            fontSize: 17,
            fontWeight: 800,
            width: 'fit-content',
            letterSpacing: 0.5,
          }}>
            dostrike-ai.vercel.app →
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
