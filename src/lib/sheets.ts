import { google } from 'googleapis';
import { ReelItem, ReelStatus, ReelTopic } from '@/types/reel';

const SHEET_NAME = 'ReelsTracker';
const HEADERS = [
  'ID',
  'Tanggal Simpan',
  'Akun / Channel',
  'Kategori / Tema',
  'Judul',
  'Poin-Poin Utama',
  'Ringkasan',
  'Tips Praktis',
  'Link Instagram',
  'Status',
  'Favorit',
  'Tags'
];

export type SheetTarget =
  | { type: 'webhook'; url: string }
  | { type: 'service_account'; spreadsheetId: string };

export function extractSpreadsheetId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Pattern: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Pattern: Direct raw ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed) && !trimmed.startsWith('http')) {
    return trimmed;
  }

  return null;
}

export function parseSheetTarget(input?: string | null): SheetTarget | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  if (trimmed.startsWith('https://script.google.com/')) {
    return { type: 'webhook', url: trimmed };
  }

  const id = extractSpreadsheetId(trimmed);
  if (id) {
    return { type: 'service_account', spreadsheetId: id };
  }

  return null;
}

export function isSheetsConfigured(target?: string | null): boolean {
  return parseSheetTarget(target) !== null;
}

export function getServiceAccountBotEmail(): string | null {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || null;
}

function getServiceAccountConfig() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (!clientEmail || !privateKey) {
    return null;
  }

  privateKey = privateKey.replace(/\\n/g, '\n');
  return { clientEmail, privateKey };
}

async function getSheetsClient(config: { clientEmail: string; privateKey: string }) {
  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

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

/**
 * Read reels from user's sheet (supports Webhook or Direct Sheet Link)
 */
export async function readReelsFromSheet(targetInput?: string | null): Promise<ReelItem[]> {
  const target = parseSheetTarget(targetInput);
  if (!target) return [];

  // Mode 1: Webhook
  if (target.type === 'webhook') {
    try {
      const res = await fetch(target.url, { method: 'GET', cache: 'no-store' });
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
    return [];
  }

  // Mode 2: Direct Sheet Link via Service Account
  if (target.type === 'service_account') {
    const config = getServiceAccountConfig();
    if (!config) {
      console.warn('Service Account credentials not configured on server.');
      return [];
    }

    try {
      const sheets = await getSheetsClient(config);
      const meta = await sheets.spreadsheets.get({ spreadsheetId: target.spreadsheetId });
      const sheetList = meta.data.sheets || [];
      const targetSheet = sheetList.find(s => s.properties?.title === SHEET_NAME) || sheetList[0];
      const activeTitle = targetSheet?.properties?.title || SHEET_NAME;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: target.spreadsheetId,
        range: `${activeTitle}!A2:L`,
      });

      const rows = res.data.values || [];
      const items: ReelItem[] = rows
        .filter((row: any[]) => row && row.length > 0 && row[0])
        .map((row: any[]) => {
          const [
            id,
            dateSaved,
            creator,
            topic,
            title,
            keyPointsRaw,
            summary,
            actionableTip,
            url,
            status,
            isFavorite,
            tagsRaw,
          ] = row;

          const keyPoints = typeof keyPointsRaw === 'string'
            ? keyPointsRaw.split('\n').map((p: string) => p.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
            : [];

          const tags = typeof tagsRaw === 'string'
            ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
            : [];

          return {
            id: id || String(Date.now()),
            url: url || '',
            creator: creator || '@creator',
            title: title || 'Catatan Reel',
            topic: (topic as ReelTopic) || 'Pengembangan Diri',
            dateSaved: cleanDate(dateSaved),
            keyPoints: keyPoints.length > 0 ? keyPoints : ['Poin materi tersimpan.'],
            summary: summary || '',
            actionableTip: actionableTip || '',
            tags,
            status: (status as ReelStatus) || 'Belum Ditinjau',
            isFavorite: String(isFavorite).toLowerCase() === 'true' || String(isFavorite) === '1',
          };
        });

      return items.reverse();
    } catch (err) {
      console.error('Failed to read from Google Sheet via Service Account:', err);
      return [];
    }
  }

  return [];
}

/**
 * Append a new Reel row to user's sheet (supports Webhook or Direct Sheet Link)
 */
export async function appendReelToSheet(
  item: ReelItem,
  targetInput?: string | null
): Promise<{ success: boolean; error?: string }> {
  const target = parseSheetTarget(targetInput);
  if (!target) {
    return { success: false, error: 'Google Sheets belum dikonfigurasi pada perangkat ini.' };
  }

  // Mode 1: Webhook
  if (target.type === 'webhook') {
    try {
      const res = await fetch(target.url, {
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
    return { success: false, error: 'Gagal mengirim data ke Webhook Google Apps Script.' };
  }

  // Mode 2: Direct Sheet Link via Service Account
  if (target.type === 'service_account') {
    const config = getServiceAccountConfig();
    if (!config) {
      return {
        success: false,
        error: 'Fitur Tempel Link membutuhkan GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY di Vercel. Gunakan opsi Webhook Apps Script untuk saat ini.',
      };
    }

    try {
      const sheets = await getSheetsClient(config);
      const meta = await sheets.spreadsheets.get({ spreadsheetId: target.spreadsheetId });
      const sheetList = meta.data.sheets || [];
      const targetSheet = sheetList.find(s => s.properties?.title === SHEET_NAME) || sheetList[0];
      const activeTitle = targetSheet?.properties?.title || SHEET_NAME;

      // Check if headers exist
      const headerCheck = await sheets.spreadsheets.values.get({
        spreadsheetId: target.spreadsheetId,
        range: `${activeTitle}!A1:L1`,
      });

      if (!headerCheck.data.values || headerCheck.data.values.length === 0 || !headerCheck.data.values[0][0]) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: target.spreadsheetId,
          range: `${activeTitle}!A1:L1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [HEADERS] },
        });
      }

      const formattedPoints = item.keyPoints.map(p => `• ${p}`).join('\n');
      const formattedTags = item.tags.join(', ');

      const newRow = [
        item.id,
        item.dateSaved,
        item.creator,
        item.topic,
        item.title,
        formattedPoints,
        item.summary,
        item.actionableTip || '',
        item.url,
        item.status,
        item.isFavorite ? 'TRUE' : 'FALSE',
        formattedTags,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: target.spreadsheetId,
        range: `${activeTitle}!A:L`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [newRow] },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error appending via Service Account:', error);
      if (error?.code === 403 || error?.status === 403) {
        return {
          success: false,
          error: `Akses ditolak (403). Pastikan spreadsheet sudah dibagikan (Share) ke email bot (${config.clientEmail}) sebagai Editor.`,
        };
      }
      return { success: false, error: error?.message || 'Gagal menyimpan ke Google Sheets via Service Account.' };
    }
  }

  return { success: false, error: 'Target spreadsheet tidak valid.' };
}

/**
 * Update status or favorite for an existing row
 */
export async function updateReelInSheet(
  id: string,
  updates: Partial<Pick<ReelItem, 'status' | 'isFavorite' | 'notes'>>,
  targetInput?: string | null
): Promise<{ success: boolean; error?: string }> {
  const target = parseSheetTarget(targetInput);
  if (!target) return { success: false, error: 'Google Sheets belum dikonfigurasi pada perangkat ini.' };

  // Mode 1: Webhook
  if (target.type === 'webhook') {
    try {
      const res = await fetch(target.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, updates }),
      });
      if (res.ok) return { success: true };
    } catch (err) {
      console.error('Webhook update failed:', err);
    }
    return { success: false, error: 'Gagal memperbarui status di Webhook Google Sheets.' };
  }

  // Mode 2: Direct Sheet Link via Service Account
  if (target.type === 'service_account') {
    const config = getServiceAccountConfig();
    if (!config) return { success: false, error: 'Service Account belum dikonfigurasi.' };

    try {
      const sheets = await getSheetsClient(config);
      const meta = await sheets.spreadsheets.get({ spreadsheetId: target.spreadsheetId });
      const sheetList = meta.data.sheets || [];
      const targetSheet = sheetList.find(s => s.properties?.title === SHEET_NAME) || sheetList[0];
      const activeTitle = targetSheet?.properties?.title || SHEET_NAME;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: target.spreadsheetId,
        range: `${activeTitle}!A2:A`,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((row: any[]) => row[0] === id);

      if (rowIndex === -1) {
        return { success: false, error: 'Item reel tidak ditemukan di Google Sheet.' };
      }

      const actualRowNumber = rowIndex + 2;

      if (updates.status !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: target.spreadsheetId,
          range: `${activeTitle}!J${actualRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[updates.status]] },
        });
      }

      if (updates.isFavorite !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: target.spreadsheetId,
          range: `${activeTitle}!K${actualRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[updates.isFavorite ? 'TRUE' : 'FALSE']] },
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating reel in sheet via Service Account:', error);
      return { success: false, error: error?.message || 'Gagal memperbarui status di Google Sheet.' };
    }
  }

  return { success: false, error: 'Target spreadsheet tidak valid.' };
}

/**
 * Test credentials and return sheet information
 */
export async function testSheetsConnection(targetInput?: string | null): Promise<{
  connected: boolean;
  spreadsheetTitle?: string;
  rowCount?: number;
  error?: string;
  type?: 'webhook' | 'service_account';
}> {
  const target = parseSheetTarget(targetInput);
  if (!target) {
    return {
      connected: false,
      error: 'Masukkan URL Spreadsheet (https://docs.google.com/spreadsheets/d/...) atau URL Webhook Google Apps Script yang valid.',
    };
  }

  // Mode 1: Webhook
  if (target.type === 'webhook') {
    try {
      const res = await fetch(target.url, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          type: 'webhook',
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

  // Mode 2: Service Account
  if (target.type === 'service_account') {
    const config = getServiceAccountConfig();
    if (!config) {
      return {
        connected: false,
        error: 'Kredensial Service Account belum dipasang di Vercel (GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY). Silakan gunakan tab Webhook Apps Script sebagai alternatif.',
      };
    }

    try {
      const sheets = await getSheetsClient(config);
      const meta = await sheets.spreadsheets.get({ spreadsheetId: target.spreadsheetId });
      const title = meta.data.properties?.title || 'Google Spreadsheet';
      const firstSheet = meta.data.sheets?.[0];
      const rowCount = firstSheet?.properties?.gridProperties?.rowCount || 0;

      return {
        connected: true,
        type: 'service_account',
        spreadsheetTitle: title,
        rowCount,
      };
    } catch (err: any) {
      if (err?.code === 403 || err?.status === 403) {
        return {
          connected: false,
          error: `Akses ditolak (403). Buka Google Sheet Anda > Klik Bagikan (Share) > Masukkan email bot: ${config.clientEmail} sebagai Editor.`,
        };
      }
      if (err?.code === 404 || err?.status === 404) {
        return {
          connected: false,
          error: 'Spreadsheet tidak ditemukan (404). Periksa kembali link Google Sheets Anda.',
        };
      }
      return {
        connected: false,
        error: err?.message || 'Gagal menghubungi Google Sheets API.',
      };
    }
  }

  return { connected: false, error: 'Target spreadsheet tidak dikenali.' };
}
