import { NextRequest, NextResponse } from 'next/server';
import { testSheetsConnection } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const webhook = req.headers.get('x-sheets-webhook') || body.webhookUrl || '';
    const result = await testSheetsConnection(webhook);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Gagal menghubungi Google Sheets.',
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const webhook = req.headers.get('x-sheets-webhook') || searchParams.get('webhook') || '';
    const result = await testSheetsConnection(webhook);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Gagal menghubungi Google Sheets.',
    });
  }
}
