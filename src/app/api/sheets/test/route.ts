import { NextRequest, NextResponse } from 'next/server';
import { testSheetsConnection } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const target =
      req.headers.get('x-sheets-target') ||
      req.headers.get('x-sheets-webhook') ||
      body.target ||
      body.sheetUrl ||
      body.spreadsheetId ||
      body.webhookUrl ||
      body.webhook ||
      '';
    const result = await testSheetsConnection(target);
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
    const target =
      req.headers.get('x-sheets-target') ||
      req.headers.get('x-sheets-webhook') ||
      searchParams.get('target') ||
      searchParams.get('sheetUrl') ||
      searchParams.get('spreadsheetId') ||
      searchParams.get('webhook') ||
      '';
    const result = await testSheetsConnection(target);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error?.message || 'Gagal menghubungi Google Sheets.',
    });
  }
}
