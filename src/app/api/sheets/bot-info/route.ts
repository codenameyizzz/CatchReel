import { NextResponse } from 'next/server';
import { getServiceAccountBotEmail } from '@/lib/sheets';

export async function GET() {
  const botEmail = getServiceAccountBotEmail();
  return NextResponse.json({
    configured: Boolean(botEmail),
    botEmail: botEmail || null,
  });
}
