import { NextResponse } from 'next/server';
import { analyzeFaceSimilarity } from '@/lib/ai/gemini';

export async function POST(request: Request) {
  try {
    const { avatarBase64, sampleBase64 } = await request.json();
    
    if (!avatarBase64 || !sampleBase64) {
      return NextResponse.json({ error: 'Missing images' }, { status: 400 });
    }

    const score = await analyzeFaceSimilarity(avatarBase64, sampleBase64);
    
    return NextResponse.json({ score });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
