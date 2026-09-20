/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT WEBHOOK UNTUK REELSHUB TRACKER
 * ==============================================================================
 * CARA PAKAI (HANYA 1 MENIT):
 * 1. Buka spreadsheet Anda: https://docs.google.com/spreadsheets/d/1428TU9rqcKAcAaro5vkOfz7WNFaQKSf7eCIV3faCq1w
 * 2. Klik menu "Extensions" (Ekstensi) > "Apps Script".
 * 3. Hapus semua kode default yang ada, lalu paste seluruh kode di file ini.
 * 4. Klik tombol "Deploy" (di kanan atas) > "New deployment".
 * 5. Pilih icon Gear di samping "Select type" > pilih "Web app".
 * 6. Setting:
 *    - Description: ReelsHub Webhook
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 7. Klik "Deploy", beri izin akses Google jika diminta.
 * 8. Salin "Web app URL" (contoh: https://script.google.com/macros/s/AKfycb.../exec)
 *    dan kirimkan ke saya atau masukkan ke GOOGLE_SHEETS_WEBHOOK_URL di Vercel!
 * ==============================================================================
 */

function setupHeaders(sheet) {
  var headers = [
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
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1A2338').setFontColor('#FFFFFF');
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  setupHeaders(sheet);

  var rows = sheet.getDataRange().getValues();
  var items = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[0]) {
      items.push({
        id: String(row[0]),
        dateSaved: String(row[1]),
        creator: String(row[2]),
        topic: String(row[3]),
        title: String(row[4]),
        keyPoints: String(row[5]).split('\n').map(function(p) { return p.replace(/^[-•*]\s*/, '').trim(); }).filter(Boolean),
        summary: String(row[6]),
        actionableTip: String(row[7]),
        url: String(row[8]),
        status: String(row[9]),
        isFavorite: String(row[10]).toLowerCase() === 'true',
        tags: String(row[11]).split(',').map(function(t) { return t.trim(); }).filter(Boolean)
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    title: ss.getName(),
    items: items.reverse()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    setupHeaders(sheet);

    if (data.action === 'append' && data.item) {
      var it = data.item;
      var points = (it.keyPoints || []).map(function(p) { return '• ' + p; }).join('\n');
      var tags = (it.tags || []).join(', ');

      sheet.appendRow([
        it.id,
        it.dateSaved,
        it.creator,
        it.topic,
        it.title,
        points,
        it.summary,
        it.actionableTip || '',
        it.url,
        it.status,
        it.isFavorite ? 'TRUE' : 'FALSE',
        tags
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'update' && data.id) {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.id)) {
          var rowNum = i + 1;
          if (data.updates.status !== undefined) {
            sheet.getRange(rowNum, 10).setValue(data.updates.status);
          }
          if (data.updates.isFavorite !== undefined) {
            sheet.getRange(rowNum, 11).setValue(data.updates.isFavorite ? 'TRUE' : 'FALSE');
          }
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
