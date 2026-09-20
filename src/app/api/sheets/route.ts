import { NextRequest, NextResponse } from 'next/server';
import {
  isSheetsConfigured,
  readReelsFromSheet,
  appendReelToSheet,
  updateReelInSheet,
} from '@/lib/sheets';
import { ReelItem } from '@/types/reel';

export async function GET() {
  try {
    if (!isSheetsConfigured()) {
      return NextResponse.json({
        success: true,
        connected: false,
        items: [],
        message: 'Google Sheets belum dikonfigurasi pada environment variables.',
      });
    }

    const items = await readReelsFromSheet();
    return NextResponse.json({
      success: true,
      connected: true,
      items,
    });
  } catch (error: any) {
    console.error('API /api/sheets GET error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal memuat data dari Google Sheets.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item: ReelItem = body;

    if (!item.url || !item.creator || !item.title) {
      return NextResponse.json(
        { success: false, error: 'Data item reel tidak lengkap (URL, creator, atau title kosong).' },
        { status: 400 }
      );
    }

    if (!isSheetsConfigured()) {
      // If sheets not configured, return success with connected: false so client can store locally in demo mode
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Google Sheets belum terhubung. Disimpan di penyimpanan lokal browser.',
        item,
      });
    }

    const result = await appendReelToSheet(item);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Gagal menyimpan ke Google Sheets.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: true,
      item,
    });
  } catch (error: any) {
    console.error('API /api/sheets POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal menyimpan reel ke spreadsheet.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, isFavorite, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID reel wajib disertakan.' }, { status: 400 });
    }

    if (!isSheetsConfigured()) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Status diperbarui di penyimpanan lokal.',
      });
    }

    const result = await updateReelInSheet(id, { status, isFavorite, notes });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, connected: true });
  } catch (error: any) {
    console.error('API /api/sheets PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal memperbarui data di spreadsheet.' },
      { status: 500 }
    );
  }
}
