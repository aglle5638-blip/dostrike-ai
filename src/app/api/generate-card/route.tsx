/**
 * GET /api/generate-card?type=A1
 *
 * 顔タイプカード画像を動的生成する。
 * Instagram 投稿用の 1:1 スクエア画像（1080x1080）を返す。
 *
 * @vercel/og（Satori）を使い、HTMLテンプレートからPNG画像を生成。
 * 生成した画像はパブリックURLから参照できる必要があるため、
 * 本番では Vercel のデプロイURL（NEXT_PUBLIC_SITE_URL）を使用する。
 *
 * 使い方:
 *   curl "https://dostrike-ai.vercel.app/api/generate-card?type=A1" -o card.png
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { MARKETING_SETS } from '@/lib/social-templates';

export const runtime = 'edge';

// カード背景グラデーション
const GROUP_STYLES: Record<string, { bg: string; accent: string }> = {
  'type_a':    { bg: 'linear-gradient(135deg, #1a0a14 0%, #3d1533 100%)', accent: '#f472b6' },
  'type_b':    { bg: 'linear-gradient(135deg, #1a0800 0%, #7c2d12 100%)', accent: '#fb923c' },
  'type_c':    { bg: 'linear-gradient(135deg, #030712 0%, #0f172a 100%)', accent: '#38bdf8' },
  'ui_mockup': { bg: 'linear-gradient(135deg, #0a1a0a 0%, #14532d 100%)', accent: '#4ade80' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get('type') ?? 'type_a';
  
  const set = MARKETING_SETS.find(s => s.id === typeId) ?? MARKETING_SETS[0];
  const style = GROUP_STYLES[set.id] ?? GROUP_STYLES['type_a'];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: style.bg,
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 背景装飾 */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${style.accent}22 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -200,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${style.accent}18 0%, transparent 70%)`,
          }}
        />

        {/* ブランドロゴ */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              background: '#f43f5e',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 18,
              color: 'white',
              fontWeight: 900,
            }}
          >
            ドストライクAI
          </div>
        </div>

        {/* メインコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* 絵文字代わりのアイコン */}
          <div style={{ fontSize: 140, lineHeight: 1 }}>✨</div>

          {/* タイプ名 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: style.accent,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              SWIPE AI
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: -2,
              }}
            >
              {set.label}
            </div>
          </div>

          {/* タグ */}
          <div
            style={{
              background: `${style.accent}20`,
              border: `1px solid ${style.accent}50`,
              borderRadius: 100,
              padding: '12px 32px',
              color: style.accent,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            #{set.id}
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 600 }}>
            好みをスワイプするだけでドストライクを提案
          </div>
          <div style={{ color: '#64748b', fontSize: 16 }}>
            dostrike-ai.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    },
  );
}
