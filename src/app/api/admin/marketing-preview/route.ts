import { NextRequest, NextResponse } from 'next/server';
import { MARKETING_SETS } from '@/lib/social-templates';

export async function GET(request: NextRequest) {
  // ── 認証 ──────────────────────────────────────────────────────────────────
  const secret = request.headers.get('x-admin-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dostrike-ai.vercel.app';
  
  const previewData = [];
  
  try {
    const { fetchVideosByTypeIds } = await import('@/lib/fanza/api');
    
    for (const set of MARKETING_SETS) {
      let imageUrl = `${baseUrl}/post-images/${set.imageFile}`;
      
      if (set.id !== 'ui_mockup' && set.faceTypeId) {
        try {
          const { videos } = await fetchVideosByTypeIds([set.faceTypeId], { limit: 1 });
          if (videos.length > 0 && videos[0].thumbnailUrl) {
            imageUrl = videos[0].thumbnailUrl;
          }
        } catch (err) {
          console.warn(`[marketing-preview] Failed to fetch thumbnail for ${set.id}:`, err);
        }
      }
      
      previewData.push({
        id: set.id,
        label: set.label,
        imageUrl: imageUrl,
        file: set.imageFile // fallback identifier
      });
    }
  } catch (err) {
    console.error('[marketing-preview] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // CORS headers for local admin UI
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'x-admin-secret, Content-Type');

  return NextResponse.json({ previewData }, { headers });
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'x-admin-secret, Content-Type');
  return new NextResponse(null, { headers });
}
