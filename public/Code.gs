/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - BACKUP CONFIG GAME KUSTOM (PREMIUM TIER)
 * =========================================================================
 * 
 * Fungsi:
 * 1. Menerima Webhook HTTP POST dari CMS sumr.day.
 * 2. Menyimpan file config JSON ke folder Google Drive "Agenze_Game_Backups".
 * 3. Mencatat riwayat log backup ke Google Sheets "Agenze_Game_Logs".
 * 
 * Cara Pasang:
 * 1. Buka script.google.com, buat proyek baru.
 * 2. Salin seluruh isi file ini ke editor Code.gs.
 * 3. Klik "Deploy" -> "New deployment".
 * 4. Pilih type "Web app".
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone"
 * 5. Salin URL Web app (https://script.google.com/macros/s/.../exec)
 *    dan masukkan ke kolom Webhook URL di menu Game Management CMS.
 */

const FOLDER_NAME = 'Agenze_Game_Backups';
const SHEET_NAME = 'Agenze_Game_Logs';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ status: 'error', message: 'Payload data kosong.' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const clientId = payload.clientId || 'unknown_client';
    const clientName = payload.clientName || 'Klien sumr.day';
    const clientEmail = payload.clientEmail || '-';
    const gameId = payload.gameId || 'game';
    const gameTitle = payload.gameTitle || 'Game Instance';
    const tier = payload.tier || 'premium';
    const model = payload.model || 'rental';
    const configData = payload.config || {};
    const timestamp = payload.timestamp || new Date().toISOString();

    // 1. Ambil atau Buat Folder Tujuan di Google Drive
    const folder = getOrCreateFolder(FOLDER_NAME);

    // 2. Format Nama File JSON
    const safeDate = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${gameId}_${clientId}_${safeDate}.json`;
    const jsonContent = JSON.stringify({
      clientId: clientId,
      clientName: clientName,
      clientEmail: clientEmail,
      gameId: gameId,
      gameTitle: gameTitle,
      tier: tier,
      model: model,
      backupTimestamp: timestamp,
      config: configData
    }, null, 2);

    // 3. Buat File JSON di Folder Google Drive
    const driveFile = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
    const fileUrl = driveFile.getUrl();
    const fileId = driveFile.getId();

    // 4. Catat Baris Log ke Google Sheets
    logToGoogleSheet({
      timestamp: new Date().toLocaleString('id-ID'),
      clientName: clientName,
      clientEmail: clientEmail,
      gameTitle: gameTitle,
      tier: tier,
      model: model,
      fileName: fileName,
      fileUrl: fileUrl
    });

    return responseJson({
      status: 'success',
      message: 'Config game berhasil dicadangkan ke Google Drive & Sheets.',
      fileId: fileId,
      fileUrl: fileUrl
    }, 200);

  } catch (err) {
    return responseJson({
      status: 'error',
      message: 'Terjadi kesalahan saat memproses webhook: ' + err.toString()
    }, 500);
  }
}

function doGet(e) {
  return responseJson({
    status: 'success',
    message: 'Agenze Game Backup Webhook Service Aktif dan Siap Menerima POST Request.'
  });
}

/**
 * Mencari atau membuat folder Google Drive
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * Mencari atau membuat spreadsheet untuk log riwayat
 */
function logToGoogleSheet(data) {
  let spreadsheet;
  const files = DriveApp.getFilesByName(SHEET_NAME);
  
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SHEET_NAME);
    const sheet = spreadsheet.getActiveSheet();
    // Buat Header baris pertama
    sheet.appendRow([
      'Waktu Backup',
      'Nama Klien',
      'Email Klien',
      'Judul Game',
      'Tier',
      'Model Lisensi',
      'Nama File Backup (.json)',
      'Link Google Drive'
    ]);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3f4f6');
  }

  const sheet = spreadsheet.getActiveSheet();
  sheet.appendRow([
    data.timestamp,
    data.clientName,
    data.clientEmail,
    data.gameTitle,
    data.tier,
    data.model,
    data.fileName,
    data.fileUrl
  ]);
}

/**
 * Format Response JSON untuk Apps Script Web App
 */
function responseJson(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

