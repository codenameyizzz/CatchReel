import { NextResponse } from 'next/server';
import { testSheetsConnection } from '@/lib/sheets';

export async function GET() {
  try {
    const result = await testSheetsConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Gagal menghubungi Google Sheets.',
    });
  }
}
