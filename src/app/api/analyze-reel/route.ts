import { NextRequest, NextResponse } from 'next/server';
import { parseInstagramUrl, fetchInstagramMetadata } from '@/lib/instagram';
import { analyzeReelWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, manualCaption, manualCreator } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL Instagram Reels wajib diisi.' },
        { status: 400 }
      );
    }

    const { isValid, normalizedUrl } = parseInstagramUrl(url);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Format URL tidak valid. Masukkan tautan Instagram Reel atau Postingan yang valid.' },
        { status: 400 }
      );
    }

    // Attempt to fetch public metadata
    const meta = await fetchInstagramMetadata(normalizedUrl);

    // Combine extracted metadata with any manual user input
    const effectiveCreator = manualCreator?.trim() || meta.creator;
    const effectiveCaption = [meta.caption, manualCaption?.trim()].filter(Boolean).join('\n\n');

    // Run Gemini AI analysis
    const analysis = await analyzeReelWithGemini({
      url: normalizedUrl,
      caption: effectiveCaption,
      extractedCreator: effectiveCreator,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        url: normalizedUrl,
        thumbnail: meta.thumbnail,
      },
    });
  } catch (error: any) {
    console.error('API /api/analyze-reel error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Terjadi kesalahan saat menganalisis Reels.' },
      { status: 500 }
    );
  }
}
