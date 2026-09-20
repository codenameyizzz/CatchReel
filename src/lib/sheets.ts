import { ReelItem } from '@/types/reel';

export function resolveWebhookUrl(customWebhook?: string | null): string | null {
  if (customWebhook && typeof customWebhook === 'string' && customWebhook.trim().startsWith('https://script.google.com/')) {
    return customWebhook.trim();
  }
  return null;
}

export function isSheetsConfigured(customWebhook?: string | null): boolean {
  return resolveWebhookUrl(customWebhook) !== null;
}

/**
 * Read all reels from Google Sheets (via Webhook or Service Account)
 */
function cleanDate(raw: any): string {
  if (!raw) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {}
  return String(raw).slice(0, 10);
}

export async function readReelsFromSheet(customWebhook?: string | null): Promise<ReelItem[]> {
  const webhook = resolveWebhookUrl(customWebhook);
  if (webhook) {
    try {
      const res = await fetch(webhook, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          return data.items.map((it: any) => ({
            ...it,
            dateSaved: cleanDate(it.dateSaved),
          }));
        }
      }
    } catch (err) {
      console.error('Error reading from Apps Script Webhook:', err);
    }
  }

  return [];
}

/**
 * Append a new Reel row to Google Sheets
 */
export async function appendReelToSheet(
  item: ReelItem,
  customWebhook?: string | null
): Promise<{ success: boolean; error?: string }> {
  const webhook = resolveWebhookUrl(customWebhook);
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', item }),
      });
      if (res.ok) {
        return { success: true };
      }
    } catch (err: any) {
      console.error('Error appending via Webhook:', err);
      return { success: false, error: err?.message || 'Gagal mengirim data ke Google Apps Script Webhook.' };
    }
  }

  return { success: false, error: 'Google Sheets belum dikonfigurasi pada perangkat ini.' };
}

/**
 * Update status or favorite for an existing row
 */
export async function updateReelInSheet(
  id: string,
  updates: Partial<Pick<ReelItem, 'status' | 'isFavorite' | 'notes'>>,
  customWebhook?: string | null
): Promise<{ success: boolean; error?: string }> {
  const webhook = resolveWebhookUrl(customWebhook);
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, updates }),
      });
      if (res.ok) return { success: true };
    } catch (err) {
      console.error('Webhook update failed:', err);
      return { success: false, error: 'Gagal memperbarui status di Webhook Google Sheets.' };
    }
  }

  return { success: false, error: 'Google Sheets belum dikonfigurasi pada perangkat ini.' };
}

/**
 * Test credentials and return sheet information
 */
export async function testSheetsConnection(customWebhook?: string | null): Promise<{
  connected: boolean;
  spreadsheetTitle?: string;
  rowCount?: number;
  error?: string;
}> {
  const webhook = resolveWebhookUrl(customWebhook);
  if (!webhook) {
    return {
      connected: false,
      error: 'Format URL Webhook tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/.../exec',
    };
  }

  try {
    const res = await fetch(webhook, { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        spreadsheetTitle: data.title || 'Google Spreadsheet (Apps Script Webhook)',
        rowCount: data.items?.length || 0,
      };
    }
    return {
      connected: false,
      error: `Server webhook merespon HTTP ${res.status}. Pastikan 'Who has access' di Google Apps Script diset 'Anyone'.`,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: `Webhook gagal dihubungi: ${err.message}`,
    };
  }
}
