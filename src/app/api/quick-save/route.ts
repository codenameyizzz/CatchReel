import { NextRequest, NextResponse } from 'next/server';
import { parseInstagramUrl, fetchInstagramMetadata, extractInstagramUrlFromText } from '@/lib/instagram';
import { analyzeReelWithGemini } from '@/lib/gemini';
import { appendReelToSheet, isSheetsConfigured } from '@/lib/sheets';
import { ReelItem } from '@/types/reel';

export async function POST(req: NextRequest) {
  try {
    let rawInput = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      rawInput = body.url || body.text || '';
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawInput = (formData.get('url') as string) || (formData.get('text') as string) || '';
    } else {
      const text = await req.text();
      rawInput = text;
    }

    return await processQuickSave(rawInput);
  } catch (error: any) {
    console.error('API /api/quick-save POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Terjadi kesalahan saat memproses penyimpanan kilat.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawInput = searchParams.get('url') || searchParams.get('text') || searchParams.get('title') || '';
    return await processQuickSave(rawInput);
  } catch (error: any) {
    console.error('API /api/quick-save GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Terjadi kesalahan saat memproses penyimpanan kilat.' },
      { status: 500 }
    );
  }
}

async function processQuickSave(rawInput: string) {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return NextResponse.json(
      { success: false, error: 'Tautan atau teks Instagram tidak ditemukan dalam request.' },
      { status: 400 }
    );
  }

  // 1. Validate & Parse Instagram URL
  const { isValid, normalizedUrl } = parseInstagramUrl(trimmed);
  if (!isValid || !normalizedUrl) {
    // Attempt regex match if direct parse didn't pick it up
    const extracted = extractInstagramUrlFromText(trimmed);
    if (!extracted) {
      return NextResponse.json(
        { success: false, error: 'Tidak ditemukan tautan Instagram Reel atau Postingan yang valid.' },
        { status: 400 }
      );
    }
  }

  const cleanUrl = normalizedUrl || extractInstagramUrlFromText(trimmed)!;

  // 2. Extract Metadata from Instagram
  const meta = await fetchInstagramMetadata(cleanUrl);

  // 3. Analyze with Gemini AI
  const analysis = await analyzeReelWithGemini({
    url: cleanUrl,
    caption: meta.caption,
    extractedCreator: meta.creator,
  });

  // 4. Construct ReelItem matching schema
  const creator = analysis.creator || meta.creator || '@unknown';
  const title = analysis.title || (meta.caption ? meta.caption.slice(0, 80) : 'Catatan Instagram');
  const now = new Date();
  const dateSaved = now.toISOString().split('T')[0];

  const newItem: ReelItem = {
    id: 'reel_' + Date.now(),
    url: cleanUrl,
    creator,
    title,
    originalCaption: meta.caption || '',
    topic: analysis.topic,
    summary: analysis.summary || 'Konten edukasi dari Instagram.',
    keyPoints: analysis.keyPoints || [],
    actionableTip: analysis.actionableTip || '',
    tags: analysis.tags || ['reels'],
    status: 'Belum Ditinjau',
    isFavorite: false,
    dateSaved,
    thumbnail: meta.thumbnail,
  };

  // 5. Append to Google Sheets if configured
  let sheetsConnected = false;
  let sheetsError: string | null = null;
  if (isSheetsConfigured()) {
    const sheetRes = await appendReelToSheet(newItem);
    sheetsConnected = sheetRes.success;
    if (!sheetRes.success) {
      sheetsError = sheetRes.error || 'Gagal menyimpan ke Google Sheets';
      console.warn('Google Sheets append failed in quick-save:', sheetsError);
    }
  }

  return NextResponse.json({
    success: true,
    item: newItem,
    sheetsConnected,
    sheetsError,
    message: sheetsConnected
      ? 'Berhasil dirangkum dengan AI dan disimpan ke Google Sheets.'
      : 'Berhasil dirangkum dengan AI (Google Sheets belum terhubung).',
  });
}
