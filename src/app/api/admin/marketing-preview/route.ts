import { NextRequest, NextResponse } from 'next/server';
import { MARKETING_SETS, fillTemplate, pickReplyText, SITE_URL } from '@/lib/social-templates';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'x-admin-secret, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dostrike-ai.vercel.app';

  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const todaySetIndex = dayIndex % MARKETING_SETS.length;

  const previewData = [];

  try {
    const { fetchVideosByTypeIds } = await import('@/lib/fanza/api');

    for (let i = 0; i < MARKETING_SETS.length; i++) {
      const set = MARKETING_SETS[i];
      const isToday = i === todaySetIndex;
      const extSet = set as typeof set & { searchKeyword?: string; cardTag?: string };

      // ── コンテンツ画像（投稿1枚目）──────────────────────────────────
      // searchKeyword で FANZA 検索 → 動画パッケ画（テキストと同一タイプが保証される）
      let contentImageUrl = `${baseUrl}/post-images/${set.imageFile}`;
      let actressName = '';
      const actressTag = extSet.cardTag ?? 'AI提案';

      try {
        const { videos } = await fetchVideosByTypeIds(
          [set.faceTypeId],
          { limit: 5, keyword: extSet.searchKeyword },
        );
        if (videos.length > 0) {
          const pick = videos[Math.floor(Math.random() * videos.length)];
          if (pick.thumbnailUrl) contentImageUrl = pick.thumbnailUrl;
          if (pick.actress) actressName = pick.actress.split(/[・、,，]/)[0].trim();
        }
      } catch { /* fallback to static image */ }

      // ── スマホモックアップ画像（投稿2枚目）──────────────────────────
      const mockupParams = new URLSearchParams({ liked: 'true', tag: actressTag });
      if (!contentImageUrl.includes('/post-images/')) {
        mockupParams.set('imageUrl', contentImageUrl);
      }
      if (actressName) mockupParams.set('name', actressName);
      const mockupImageUrl = `${baseUrl}/api/generate-marketing-image?${mockupParams}`;

      // ── テンプレートテキスト ─────────────────────────────────────────
      // テンプレートに {URL} は含まれていないが、fillTemplate は互換のために残す
      const templates = set.templates.map(t => fillTemplate(t, { URL: SITE_URL }));
      const replyText = pickReplyText(dayIndex);

      previewData.push({
        id: set.id,
        label: set.label,
        isToday,
        searchKeyword: extSet.searchKeyword ?? null,
        contentImageUrl,
        mockupImageUrl,
        templates,
        todayTemplate: templates[dayIndex % templates.length],
        replyText,           // ② リプライ投稿テキスト（URLのみ）
        actressName,
      });
    }
  } catch (err) {
    console.error('[marketing-preview] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json({ previewData, todaySetIndex }, { headers: CORS_HEADERS });
}
