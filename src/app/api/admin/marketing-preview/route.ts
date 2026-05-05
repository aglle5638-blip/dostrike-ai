import { NextRequest, NextResponse } from 'next/server';
import { MARKETING_SETS, fillTemplate, SITE_URL, X_TIME_TEMPLATES } from '@/lib/social-templates';

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

  // 今日のマーケティングセットのインデックス
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const todaySetIndex = dayIndex % MARKETING_SETS.length;

  const previewData = [];

  try {
    const { fetchVideosByTypeIds } = await import('@/lib/fanza/api');

    for (let i = 0; i < MARKETING_SETS.length; i++) {
      const set = MARKETING_SETS[i];
      const isToday = i === todaySetIndex;
      const extSet = set as typeof set & { searchKeyword?: string; cardTag?: string };

      // ── コンテンツ画像（投稿1枚目）──────────────────────────
      let contentImageUrl = `${baseUrl}/post-images/${set.imageFile}`;
      let actressName = '';
      let actressTag = extSet.cardTag ?? 'AI提案';

      try {
        const { videos } = await fetchVideosByTypeIds(
          [set.faceTypeId],
          { limit: 5, keyword: extSet.searchKeyword },
        );
        if (videos.length > 0) {
          const pick = videos[Math.floor(Math.random() * videos.length)];
          if (pick.actress) actressName = pick.actress.split(/[・、,，]/)[0].trim();
        }
      } catch {
        /* fallback to static image */
      }

      // 女優プロフィール写真を取得（動画サムネイルより投稿テキストと整合性が高い）
      if (actressName) {
        try {
          const affiliateId = process.env.FANZA_AFFILIATE_ID;
          const apiKey = process.env.FANZA_API_KEY;
          if (affiliateId && apiKey) {
            const params = new URLSearchParams({
              site: 'FANZA', keyword: actressName, hits: '5', offset: '1',
              affiliate_id: affiliateId, api_id: apiKey, output: 'json',
            });
            const res = await fetch(`https://api.dmm.com/affiliate/v3/ActressSearch?${params}`,
              { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              const data = await res.json() as {
                result: { status: string | number; actress?: Array<{ name: string; imageURL?: { large?: string; small?: string } }> };
              };
              if (String(data.result.status) === '200') {
                const actresses = data.result.actress ?? [];
                const pick = actresses.find(a => a.name === actressName) ?? actresses[0];
                const profileUrl = pick?.imageURL?.large ?? pick?.imageURL?.small;
                if (profileUrl) contentImageUrl = profileUrl;
              }
            }
          }
        } catch { /* keep fallback */ }
      }

      // ── スマホモックアップ画像（投稿2枚目）──────────────────
      const mockupParams = new URLSearchParams({ liked: 'true', tag: actressTag });
      if (!contentImageUrl.includes('/post-images/')) {
        mockupParams.set('imageUrl', contentImageUrl);
      }
      if (actressName) mockupParams.set('name', actressName);
      const mockupImageUrl = `${baseUrl}/api/generate-marketing-image?${mockupParams}`;

      // ── テンプレートテキスト一覧 ─────────────────────────────
      const templates = set.templates.map(t => fillTemplate(t, { URL: SITE_URL }));
      // ui_mockup は時間帯別テンプレートも持つ
      const timeTemplates = set.id === 'ui_mockup'
        ? Object.entries(X_TIME_TEMPLATES).flatMap(([slot, ts]) =>
            ts.map(t => `[${slot}] ${fillTemplate(t, { URL: SITE_URL })}`)
          )
        : [];

      previewData.push({
        id: set.id,
        label: set.label,
        isToday,
        searchKeyword: extSet.searchKeyword ?? null,
        // 画像
        contentImageUrl,   // 1枚目: FANZAコンテンツ画像（文章と一致）
        mockupImageUrl,    // 2枚目: スマホモックアップ
        // テキスト
        templates,
        timeTemplates,
        todayTemplate: templates[dayIndex % templates.length],
        actressName,
      });
    }
  } catch (err) {
    console.error('[marketing-preview] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  return NextResponse.json({ previewData, todaySetIndex }, { headers: CORS_HEADERS });
}
