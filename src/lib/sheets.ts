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

interface SheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

function getWebhookUrl(): string | null {
  return process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() || null;
}

function getSheetsConfig(): SheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }

  // Handle escaped newlines in environment variable
  privateKey = privateKey.replace(/\\n/g, '\n');

  return { spreadsheetId, clientEmail, privateKey };
}

export function isSheetsConfigured(): boolean {
  return getWebhookUrl() !== null || getSheetsConfig() !== null;
}

async function getSheetsInstance(config: SheetsConfig) {
  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Make sure the sheet exists and has proper headers
 */
export async function initializeSheetHeaders(): Promise<{ success: boolean; message: string }> {
  const webhook = getWebhookUrl();
  if (webhook) {
    return { success: true, message: 'Google Apps Script Webhook aktif.' };
  }

  const config = getSheetsConfig();
  if (!config) {
    return { success: false, message: 'Google Sheets credentials belum dikonfigurasi di Environment Variables.' };
  }

  try {
    const sheets = await getSheetsInstance(config);

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: config.spreadsheetId,
    });

    const sheetList = meta.data.sheets || [];
    const targetSheet = sheetList.find(s => s.properties?.title === SHEET_NAME) || sheetList[0];
    const activeTitle = targetSheet?.properties?.title || SHEET_NAME;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${activeTitle}!A1:L1`,
    });

    if (!res.data.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${activeTitle}!A1:L1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [HEADERS],
        },
      });
      return { success: true, message: `Header kolom berhasil dibuat pada sheet '${activeTitle}'.` };
    }

    return { success: true, message: `Sheet '${activeTitle}' siap digunakan.` };
  } catch (error: any) {
    console.error('Error initializing sheet headers:', error);
    return { success: false, message: error?.message || 'Gagal mengakses Google Sheets.' };
  }
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

export async function readReelsFromSheet(): Promise<ReelItem[]> {
  const webhook = getWebhookUrl();
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

  const config = getSheetsConfig();
  if (!config) return [];

  try {
    const sheets = await getSheetsInstance(config);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    const activeTitle = meta.data.sheets?.[0]?.properties?.title || SHEET_NAME;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
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
          ? keyPointsRaw.split('\n').map(p => p.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
          : [];

        const tags = typeof tagsRaw === 'string'
          ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        return {
          id: id || String(Date.now()),
          url: url || '',
          creator: creator || '@creator',
          title: title || 'Reel Inspiration',
          topic: (topic as ReelTopic) || 'Pengembangan Diri',
          dateSaved: dateSaved || new Date().toISOString().split('T')[0],
          keyPoints: keyPoints.length > 0 ? keyPoints : ['Poin materi tersimpan.'],
          summary: summary || '',
          actionableTip: actionableTip || '',
          tags,
          status: (status as ReelStatus) || 'Belum Ditinjau',
          isFavorite: String(isFavorite).toLowerCase() === 'true' || String(isFavorite) === '1',
        };
      });

    return items.reverse(); // Newest first
  } catch (error) {
    console.error('Failed to read from Google Sheet:', error);
    return [];
  }
}

/**
 * Append a new Reel row to Google Sheets
 */
export async function appendReelToSheet(item: ReelItem): Promise<{ success: boolean; error?: string }> {
  const webhook = getWebhookUrl();
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

  const config = getSheetsConfig();
  if (!config) {
    return { success: false, error: 'Google Sheets belum dikonfigurasi.' };
  }

  try {
    const sheets = await getSheetsInstance(config);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    const activeTitle = meta.data.sheets?.[0]?.properties?.title || SHEET_NAME;

    await initializeSheetHeaders();

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
      spreadsheetId: config.spreadsheetId,
      range: `${activeTitle}!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error appending reel to sheet:', error);
    return { success: false, error: error?.message || 'Gagal menyimpan ke Google Sheets' };
  }
}

/**
 * Update status or favorite for an existing row
 */
export async function updateReelInSheet(
  id: string,
  updates: Partial<Pick<ReelItem, 'status' | 'isFavorite' | 'notes'>>
): Promise<{ success: boolean; error?: string }> {
  const webhook = getWebhookUrl();
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
    }
  }

  const config = getSheetsConfig();
  if (!config) return { success: false, error: 'Google Sheets belum dikonfigurasi.' };

  try {
    const sheets = await getSheetsInstance(config);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    const activeTitle = meta.data.sheets?.[0]?.properties?.title || SHEET_NAME;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
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
        spreadsheetId: config.spreadsheetId,
        range: `${activeTitle}!J${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[updates.status]],
        },
      });
    }

    if (updates.isFavorite !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${activeTitle}!K${actualRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[updates.isFavorite ? 'TRUE' : 'FALSE']],
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating reel in sheet:', error);
    return { success: false, error: error?.message || 'Gagal memperbarui status di Google Sheet.' };
  }
}

/**
 * Test credentials and return sheet information
 */
export async function testSheetsConnection(): Promise<{
  connected: boolean;
  spreadsheetTitle?: string;
  rowCount?: number;
  error?: string;
}> {
  const webhook = getWebhookUrl();
  if (webhook) {
    try {
      const res = await fetch(webhook, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          spreadsheetTitle: data.title || 'Google Spreadsheet (Apps Script Webhook)',
          rowCount: data.items?.length || 0,
        };
      }
    } catch (err: any) {
      return {
        connected: false,
        error: `Webhook gagal dihubungi: ${err.message}`,
      };
    }
  }

  const config = getSheetsConfig();
  if (!config) {
    return {
      connected: false,
      error: 'Pilih salah satu metode koneksi: isi GOOGLE_SHEETS_WEBHOOK_URL atau (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY).',
    };
  }

  try {
    const sheets = await getSheetsInstance(config);
    const meta = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    const title = meta.data.properties?.title || 'Google Spreadsheet';
    const firstSheet = meta.data.sheets?.[0];
    const rowCount = firstSheet?.properties?.gridProperties?.rowCount || 0;

    return {
      connected: true,
      spreadsheetTitle: title,
      rowCount,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error?.message || 'Gagal menghubungi Google Sheets API. Pastikan Service Account sudah diundang ke spreadsheet sebagai Editor.',
    };
  }
}
