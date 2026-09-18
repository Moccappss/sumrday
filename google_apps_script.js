/**
 * =========================================================================================
 * SUMR.DAY OS & PORTO 2026 CMS — GOOGLE APPS SCRIPT ULTRA EXECUTIVE ENTERPRISE SUITE
 * Versi: v6.0.0-ultra-executive-suite (Edisi Terkini September 2026)
 * =========================================================================================
 * 
 * 🌟 FITUR & KEMAMPUAN ENTERPRISE TINGKAT EKSEKUTIF:
 * 1. 📊 Tab #1 "📊 Dashboard Studio":
 *    - Executive Summary C-Level: Omzet Kas, Kas Masuk, Piutang/Sisa Tagihan, Pipeline Kontrak,
 *      Proyek Aktif, Modul Terpadu, Pelanggan CRM, Janji Temu, dan Status Cloud Real-time.
 *    - Tabel Navigasi Cepat Antar-Tab dengan formula interaktif.
 * 2. 🎯 Manajemen Proyek & Pipeline (Tab "Manajemen Project"):
 *    - Nilai Kontrak / Budget (IDR) otomatis diformat mata uang.
 *    - Nama Klien & Tautan WhatsApp Otomatis (=HYPERLINK("https://wa.me/...", "Chat WA")).
 *    - Progress baris (%), Status [todo | in_progress | review | done | scheduled | trash],
 *      Prioritas [high | medium | low], Tim/PIC, Milestone Checklist, Tautan Asset Drive.
 *    - Auto-Sinkronisasi Tenggat Waktu ke Google Calendar dengan notifikasi otomatis.
 * 3. 💰 Transaksi & Arus Kas (Tab "Transaksi & Pesanan"):
 *    - Rumus Finansial Akurat: Subtotal, Diskon, Pajak/Ongkir, Total Akhir, DP/Terbayar, dan
 *      Rumus Sisa Tagihan Otomatis =MAX(0, Total - Terbayar).
 *    - Dropdown Status Bayar: [ lunas | dp | belum | batal | cicilan ].
 *    - Metode Pembayaran: [ QRIS | Transfer BCA | Transfer Mandiri | Transfer BRI | Tunai | Kartu Kredit ].
 * 4. 📋 Formulir & Tanggapan Dinamis (Tab "📋 Formulir & Survei" & "📥 Tanggapan Formulir"):
 *    - Sinkronisasi instan skema formulir dari Form Maker Studio.
 *    - Pencatatan seluruh tanggapan responden secara otomatis dengan rangkuman jawaban rapi.
 * 5. 📱 Feed Sosial & Status Update Utas (Tab "📱 Feed & Status Update (Utas)"):
 *    - Kategori Update [ Pembaruan | Fitur Baru | Perbaikan | Desain | Pengumuman | Tips ].
 *    - Estimasi Waktu Baca, Jumlah Suka (Likes), Status Pin (📌 Ya / Tidak), Tags & Media.
 * 6. 🛍️ Katalog Produk & Jasa Studio (Tab "Manajemen Toko"):
 *    - SKU, Kategori, Tipe Produk, Harga Normal, Harga Coret, Stok, Varian, Tautan Cover & Berkas Drive.
 * 7. 👥 CRM Pelanggan & Space Circle (Tab "Data Pelanggan CRM" & "Space Circle (Pengguna)"):
 *    - Profil Pelanggan, Nilai Belanja Kumulatif (LTV), Status [ VIP | Reguler | Prospek | Nonaktif ].
 *    - Role Tim: [ ⭐ Super Admin | 🛡️ Admin | 👤 Klien Publik | 💼 Staff / Desainer ].
 * 8. 📅 Janji Temu & Booking (Tab "Janji Temu & Booking"):
 *    - Jadwal Konsultasi, Status [ Menunggu Konfirmasi | Terkonfirmasi | Selesai | Batal ].
 * 9. 📝 Dokumen & Brain Dump (Tab "Catatan & Memo" & "Whiteboard Studio"):
 *    - Catatan, Folder, Tags, Ide Cepat, dan Canvas Whiteboard.
 * 10. 🏢 Profil Bisnis & Rekening Bank (Tab "🏢 Profil Bisnis & Rekening"):
 *    - Identitas Studio, Daftar Rekening Bank Resmi, Tautan QRIS Cloudinary Siap Scan.
 * 11. 🚀 Dual-Vault Cloud Storage & Batch Orchestrator:
 *    - Google Sheets Visual Display + Partisi JSON Terkompresi di Google Drive (100% Hemat Kuota).
 *    - Mendukung action batch `sync_all` untuk sinkronisasi kilat seluruh modul dalam 1 request.
 * 12. 🛡️ Auto-Recovery & Quota Truncation Guard:
 *    - Menghapus string base64 berat dan membatasi teks sel < 45.000 karakter (Anti error 50.000 limit).
 * 
 * -----------------------------------------------------------------------------------------
 * PANDUAN DEPLOYMENT KE GOOGLE APPS SCRIPT:
 * 1. Buka https://script.google.com/ dan buat project baru (atau buka project Anda yang sudah ada).
 * 2. Hapus seluruh isi kode lama di editor `Code.gs`, lalu salin (paste) SELURUH isi file ini.
 * 3. Klik tombol "Simpan" (Ctrl+S / Cmd+S).
 * 4. Klik tombol biru "Deploy" -> "New deployment" (atau "Manage deployments" -> edit versi baru):
 *    - Pilih Type: "Web app"
 *    - Description: sumr.day OS Ultra Executive v6.0.0
 *    - Execute as: "Me" (email Google akun Anda)
 *    - Who has access: "Anyone" (PENTING: Harus Anyone agar webhook web app bisa diakses)
 * 5. Klik "Deploy", beri izin otorisasi Google jika diminta.
 * 6. Salin Web App URL yang berakhiran `/exec` dan masukkan ke Pengaturan Integrasi Cloud di sumr.day OS!
 * =========================================================================================
 */

// eslint-disable-next-line no-unused-vars
function doOptions(e) {
  // eslint-disable-next-line no-undef
  return ContentService.createTextOutput("")
    // eslint-disable-next-line no-undef
    .setMimeType(ContentService.MimeType.TEXT);
}

// eslint-disable-next-line no-unused-vars
function doGet(e) {
  return jsonResponse({
    status: 'online',
    service: 'sumr.day OS Google Apps Script Ultra Executive Enterprise Suite',
    version: '6.0.0-ultra-executive-suite',
    releaseDate: '2026-09-17',
    timestamp: new Date().toISOString(),
    capabilities: [
      'executive_dashboard', 'master_database', 'partition_sync', 'batch_sync',
      'projects', 'content_planner', 'memos', 'whiteboard', 'shop', 'catalog',
      'transactions', 'invoices', 'customers', 'users', 'clients', 'bookings',
      'chats', 'contacts', 'calendar', 'backups', 'drive_files',
      'business_profile', 'bank_accounts', 'qris', 'social_updates', 'feed_status',
      'forms', 'form_responses', 'discounts'
    ]
  });
}

// eslint-disable-next-line no-unused-vars
function doPost(e) {
  // eslint-disable-next-line no-undef
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // 15 detik timeout lock untuk integritas transaksi tinggi
  } catch (lockErr) {
    Logger.log("Lock warning: " + lockErr);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'Payload data kosong.' });
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var payload = data.payload;
    var sheetId = data.sheetId;

    // --- 0. BATCH SYNC ORCHESTRATOR ---
    if (action === 'sync_all' || action === 'sync_everything' || action === 'batch_sync') {
      return handleBatchSync(payload, sheetId);
    }

    // --- 1. BACKUP & MASTER DATABASE ---
    else if (action === 'backup' || action === 'save_master_database') {
      return handleBackup(data);
    } else if (action === 'get_backup' || action === 'restore' || action === 'get_master_database') {
      return handleGetBackup(data);
    } else if (action === 'sync_partition') {
      return handleSyncPartition(data);
    } else if (action === 'get_partition') {
      return handleGetPartition(data);
    } else if (action === 'cleanup_backups') {
      return handleCleanupBackups(data);
    } else if (action === 'get_storage_stats' || action === 'get_drive_storage_info') {
      return handleGetStorageStats(data);
    }

    // --- 2. FILE DRIVE MANAGEMENT ---
    else if (action === 'upload_file') {
      return handleFileUpload(data);
    } else if (action === 'delete_file') {
      return handleDeleteFile(data);
    }

    // --- 3. GOOGLE SHEETS SYNC (MODUL UTAMA) ---
    else if (action === 'sync_sheets' || action === 'sync_projects') {
      return handleProjectSync(payload, sheetId);
    } else if (action === 'get_projects') {
      return handleGetProjects(sheetId);
    } else if (action === 'sync_notes' || action === 'sync_memos') {
      return handleNotesSync(payload, sheetId);
    } else if (action === 'get_notes' || action === 'get_memos') {
      return handleGetNotes(sheetId);
    } else if (action === 'sync_whiteboard' || action === 'sync_canvases') {
      return handleWhiteboardSync(payload, sheetId);
    } else if (action === 'sync_shop' || action === 'sync_products') {
      return handleShopSync(payload, sheetId);
    } else if (action === 'get_products') {
      return handleGetProducts(sheetId);
    } else if (action === 'sync_transactions') {
      return handleTransactionSync(payload, sheetId);
    } else if (action === 'get_transactions') {
      return handleGetTransactions(sheetId);
    } else if (action === 'sync_customers') {
      return handleCustomerSync(payload, sheetId);
    } else if (action === 'get_customers') {
      return handleGetCustomers(sheetId);
    } else if (action === 'sync_users') {
      return handleUserSync(payload, sheetId);
    } else if (action === 'get_users') {
      return handleGetUsers(data);
    } else if (action === 'sync_bookings' || action === 'sync_appointments') {
      return handleBookingSync(payload, sheetId);
    } else if (action === 'get_bookings') {
      return handleGetBookings(data);
    } else if (action === 'sync_chats' || action === 'sync_messages' || action === 'append_chat_message') {
      return handleChatSync(payload, sheetId);
    } else if (action === 'get_chats' || action === 'get_messages') {
      return handleGetChats(data);
    } else if (action === 'sync_discounts') {
      return handleDiscountSync(payload, sheetId);
    } else if (action === 'get_discounts') {
      return handleGetDiscounts(sheetId);
    } else if (action === 'sync_website' || action === 'sync_blog') {
      return handleWebsiteSync(payload, sheetId);
    } else if (action === 'get_website' || action === 'get_blog') {
      return handleGetWebsite(sheetId);
    } else if (action === 'sync_social_updates' || action === 'sync_updates' || action === 'sync_feed') {
      return handleSocialUpdatesSync(payload, sheetId);
    } else if (action === 'get_social_updates' || action === 'get_updates') {
      return handleGetSocialUpdates(data);
    }

    // --- 4. FORMULIR & SURVEI MAKER (FITUR TERBARU) ---
    else if (action === 'sync_forms') {
      return handleFormsSync(payload, sheetId);
    } else if (action === 'get_forms') {
      return handleGetForms(sheetId);
    } else if (action === 'sync_form_responses' || action === 'save_form_response') {
      return handleFormResponsesSync(payload, sheetId);
    } else if (action === 'get_form_responses') {
      return handleGetFormResponses(sheetId);
    }

    // --- 5. PROFIL BISNIS, REKENING & GAME CONFIG ---
    else if (action === 'sync_business_profile' || action === 'sync_brand_profile') {
      return handleBusinessProfileSync(payload, sheetId);
    } else if (action === 'get_business_profile') {
      return handleGetBusinessProfile(data);
    } else if (action === 'backup_game_config' || action === 'sync_game_config' || action === 'sync_games') {
      return handleGameConfigBackup(data, sheetId);
    } else if (action === 'permanent_delete' || action === 'delete_row') {
      return handlePermanentDelete(data);
    } else if (action === 'build_dashboard' || action === 'setup_dashboard') {
      var ss = getSpreadsheet(sheetId);
      ensureDashboardOverviewTab(ss);
      return jsonResponse({ status: 'success', message: 'Dashboard Executive berhasil dibangun & dioptimasi' });
    }

    // --- 6. GOOGLE CONTACTS, CALENDAR & NOTIFIKASI ---
    else if (action === 'sync_contacts') {
      return handleContactSync(payload, sheetId);
    } else if (action === 'sync_calendar') {
      return handleCalendarSync(payload);
    } else if (action === 'send_whatsapp_notification' || action === 'send_order_notification') {
      return handleSendWhatsAppNotification(payload);
    }

    // --- 7. CONFIG & HEALTH CHECK ---
    else if (action === 'ping' || action === 'health_check') {
      return jsonResponse({
        status: 'success',
        message: 'Google Apps Script Ultra Executive Enterprise Suite is Online & Ready',
        timestamp: new Date().toISOString(),
        version: '6.0.0-ultra-executive-suite'
      });
    } else if (action === 'get_platform_config') {
      return handleGetPlatformConfig(data);
    } else if (action === 'update_platform_config') {
      return handleUpdatePlatformConfig(data);
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  } finally {
    try {
      lock.releaseLock();
    // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

function jsonResponse(obj) {
  // eslint-disable-next-line no-undef
  return ContentService.createTextOutput(JSON.stringify(obj))
    // eslint-disable-next-line no-undef
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper: Safely resolve Spreadsheet
function getSpreadsheet(sheetId) {
  if (sheetId && typeof sheetId === 'string') {
    var match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) sheetId = match[1];
    sheetId = sheetId.trim();
  }

  if (sheetId && sheetId.length > 20 && !sheetId.match(/^\d+$/)) {
    try {
      // eslint-disable-next-line no-undef
      return SpreadsheetApp.openById(sheetId);
    // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  try {
    // eslint-disable-next-line no-undef
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    if (sheetId) {
      // eslint-disable-next-line no-undef
      return SpreadsheetApp.openById(sheetId);
    }
    throw new Error("ID Spreadsheet tidak valid. Silakan salin link lengkap Google Sheets Anda.");
  }
}

// Helper: Make Clickable Hyperlink Formula for Google Sheets
function makeHyperlink(url, label) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return url || '-';
  var escapedUrl = url.replace(/"/g, '""');
  var safeLabel = (label || '🔗 Buka Berkas').replace(/"/g, '""');
  return '=HYPERLINK("' + escapedUrl + '", "' + safeLabel + '")';
}

// Helper: Format WhatsApp Clickable Link
function makeWhatsAppLink(phone, clientName) {
  if (!phone) return '-';
  var cleanPhone = phone.toString().replace(/[^0-9]/g, '');
  if (!cleanPhone) return phone;
  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
  var greeting = "Halo " + (clientName || "Klien") + ", kami dari studio sumr.day ingin mengonfirmasi detail Anda.";
  var url = "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(greeting);
  return '=HYPERLINK("' + url.replace(/"/g, '""') + '", "💬 ' + cleanPhone + '")';
}

// Helper: Safe JSON Stringify that strips heavy base64 strings and stays within 45,000 char cell limits
function safeJsonStringify(obj, maxChars) {
  var limit = maxChars || 45000;
  if (!obj) return "";
  try {
    var str = JSON.stringify(obj, function(k, v) {
      if (typeof v === 'string' && v.startsWith('data:image/') && v.length > 150) {
        return '[inline-image-stripped-for-sheets]';
      }
      return v;
    });
    if (str.length > limit) {
      return str.substring(0, limit) + '...[TRUNCATED]';
    }
    return str;
  } catch (e) {
    return "";
  }
}

// Helper: Create Dropdown Data Validation on a specific column
function applyDropdownValidation(sheet, colIndex, startRow, endRow, options) {
  try {
    if (endRow < startRow) return;
    // eslint-disable-next-line no-undef
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(options, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(startRow, colIndex, endRow - startRow + 1, 1).setDataValidation(rule);
  // eslint-disable-next-line no-empty
  } catch (e) {}
}

// Helper: Apply borders, banding, conditional formatting, auto-align, and dropdowns
function applySheetEnhancements(sheet, statusColLetter, startRow, totalCols, bandingTheme, dropdownConfigs) {
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return;

  var numDataRows = lastRow - startRow + 1;
  var dataRange = sheet.getRange(startRow, 1, numDataRows, totalCols);
  dataRange.setVerticalAlignment("middle");
  dataRange.setFontFamily("Arial");
  dataRange.setFontSize(10);
  
  // Set row height for executive readability
  for (var r = startRow; r <= lastRow; r++) {
    sheet.setRowHeight(r, 28);
  }

  // Set borders
  var fullRange = sheet.getRange(1, 1, lastRow, totalCols);
  try {
    // eslint-disable-next-line no-undef
    fullRange.setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
  // eslint-disable-next-line no-empty
  } catch(e) {}

  // Apply row banding
  try {
    sheet.getBandings().forEach(function(b) { b.remove(); });
    if (bandingTheme) {
      fullRange.applyRowBanding(bandingTheme, true, false);
    }
  // eslint-disable-next-line no-empty
  } catch(e) {}

  // Conditional formatting for deleted rows (soft-red highlight + strikethrough)
  try {
    var rules = sheet.getConditionalFormatRules() || [];
    var formula = '=REGEXMATCH(TO_TEXT($' + statusColLetter + '2), "(?i)terhapus|deleted|trash|batal|nonaktif")';
    // eslint-disable-next-line no-undef
    var deleteRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#fee2e2')
      .setFontColor('#991b1b')
      .setStrikethrough(true)
      .setRanges([sheet.getRange(2, 1, lastRow - 1, totalCols)])
      .build();
    rules.push(deleteRule);
    sheet.setConditionalFormatRules(rules);
  // eslint-disable-next-line no-empty
  } catch(e) {}

  // Apply Dropdown Validations if provided
  if (dropdownConfigs && Array.isArray(dropdownConfigs)) {
    dropdownConfigs.forEach(function(cfg) {
      if (cfg.col && cfg.options) {
        applyDropdownValidation(sheet, cfg.col, startRow, lastRow, cfg.options);
      }
    });
  }

  // Enable auto-filter across all columns
  try {
    if (sheet.getFilter()) sheet.getFilter().remove();
    sheet.getDataRange().createFilter();
  // eslint-disable-next-line no-empty
  } catch(e) {}

  // Auto-resize columns with reasonable bounds
  try {
    sheet.autoResizeColumns(1, totalCols);
    for (var col = 1; col <= totalCols; col++) {
      var currentWidth = sheet.getColumnWidth(col);
      if (col === totalCols) {
        sheet.setColumnWidth(col, 85); // Kolom JSON di ujung kanan dibuat ringkas
      } else if (currentWidth < 120) {
        sheet.setColumnWidth(col, 120);
      } else if (currentWidth > 380) {
        sheet.setColumnWidth(col, 380);
      }
    }
  // eslint-disable-next-line no-empty
  } catch(e) {}
}

// --- 1. TAB #1: EXECUTIVE DASHBOARD & SUMMARY COMMAND CENTER ---
function ensureDashboardOverviewTab(ss) {
  try {
    var sheetName = "📊 Dashboard Studio";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName, 0); // Selalu letakkan di tab pertama
    }
    
    sheet.clear();
    sheet.getBandings().forEach(function(b) { b.remove(); });
    sheet.setTabColor("#0f172a");

    // Title & Header Banner
    sheet.getRange("A1:I2").merge()
      .setValue("SUMR.DAY OS — STUDIO & CREATIVE COMMAND CENTER")
      .setFontWeight("bold")
      .setFontSize(14)
      .setFontColor("#ffffff")
      .setBackground("#0f172a")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    sheet.setRowHeight(1, 24);
    sheet.setRowHeight(2, 24);

    // Subtitle baris ke-3
    sheet.getRange("A3:I3").merge()
      .setValue("Sistem Sinkronisasi Real-time Google Sheets, Arus Kas & Google Drive Dual-Vault • Edisi Eksekutif 2026")
      .setFontSize(9.5)
      .setFontColor("#94a3b8")
      .setBackground("#1e293b")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(3, 20);

    // KPI Cards Header (Row 5 & 6)
    var kpiHeaders = [
      [
        "TOTAL OMZET (IDR)", 
        "KAS MASUK (IDR)", 
        "SISA PIUTANG (IDR)", 
        "PIPELINE KONTRAK (IDR)", 
        "PROYEK & KONTEN", 
        "KATALOG PRODUK", 
        "PELANGGAN CRM", 
        "JANJI TEMU", 
        "STATUS CLOUD"
      ],
      [
        "=IFERROR(SUM('Transaksi & Pesanan'!J2:J), 0)",
        "=IFERROR(SUM('Transaksi & Pesanan'!L2:L), 0)",
        "=IFERROR(SUM('Transaksi & Pesanan'!M2:M), 0)",
        "=IFERROR(SUM('Manajemen Project'!G2:G), 0)",
        "=IFERROR(COUNTA('Manajemen Project'!A2:A), 0)",
        "=IFERROR(COUNTA('Manajemen Toko'!A2:A), 0)",
        "=IFERROR(COUNTA('Data Pelanggan CRM'!A2:A), 0)",
        "=IFERROR(COUNTA('Janji Temu & Booking'!A2:A), 0)",
        "ONLINE 100%"
      ]
    ];

    var kpiRange = sheet.getRange(5, 1, 2, 9);
    kpiRange.setValues(kpiHeaders);
    sheet.getRange(5, 1, 1, 9)
      .setFontWeight("bold")
      .setFontSize(9.5)
      .setFontColor("#475569")
      .setBackground("#f1f5f9")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    
    sheet.getRange(6, 1, 1, 9)
      .setFontWeight("bold")
      .setFontSize(13)
      .setFontColor("#0f172a")
      .setBackground("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    // Format mata uang untuk kolom finansial di KPI
    sheet.getRange(6, 1, 1, 4).setNumberFormat('Rp #,##0');
    sheet.getRange(6, 9, 1, 1).setFontColor("#059669");

    sheet.setRowHeight(5, 28);
    sheet.setRowHeight(6, 38);

    // Section 1: Direktori Navigasi Tab Cepat
    sheet.getRange("A8:I8").merge()
      .setValue("🧭 DIREKTORI MODUL & NAVIGASI CEPAT SPREADSHEET")
      .setFontWeight("bold")
      .setFontColor("#ffffff")
      .setBackground("#1e293b")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(8, 28);

    var navRows = [
      ["1. Arus Kas & Nota", "Transaksi & Pesanan", "Catatan pemasukan, invoice klien, DP, sisa piutang, dan bukti transfer."],
      ["2. Project & Pipeline", "Manajemen Project", "Alur kerja Kanban, PIC, deadline, checklist, dan sinkronisasi Google Calendar."],
      ["3. Formulir & Responden", "📋 Formulir & Survei", "Skema form survey/brief klien dan tab '📥 Tanggapan Formulir' untuk hasil respons."],
      ["4. Toko & Produk Jasa", "Manajemen Toko", "Katalog produk digital, jasa agensi, harga coret, dan berkas download."],
      ["5. Pelanggan & CRM", "Data Pelanggan CRM", "Database klien, WhatsApp direct link, total belanja, dan segmentasi VIP."],
      ["6. Janji Temu Konsultasi", "Janji Temu & Booking", "Jadwal booking klien, status konfirmasi, dan lokasi meeting."],
      ["7. Feed & Berita Utas", "📱 Feed & Status Update (Utas)", "Pembaruan fitur, tips studio, reading time, likes, dan status publikasi."],
      ["8. Brain Dump & Memo", "Catatan & Memo", "Brief cepat, coretan ide, dan tab 'Whiteboard Studio' untuk canvas visual."]
    ];

    for (var n = 0; n < navRows.length; n++) {
      var rNum = 9 + n;
      sheet.getRange(rNum, 1).setValue(navRows[n][0]).setFontWeight("bold").setFontColor("#1e293b");
      sheet.getRange(rNum, 2).setValue(navRows[n][1]).setFontWeight("bold").setFontColor("#2563eb");
      sheet.getRange(rNum, 3, 1, 7).merge().setValue(navRows[n][2]).setFontColor("#475569");
      sheet.setRowHeight(rNum, 25);
    }

    // Section 2: Panduan Cepat & Cara Input Langsung
    var guideHeaderRow = 9 + navRows.length + 1;
    sheet.getRange(guideHeaderRow, 1, 1, 9).merge()
      .setValue("📌 PETUNJUK PENGGUNAAN & PANDUAN INPUT LANGSUNG")
      .setFontWeight("bold")
      .setFontColor("#ffffff")
      .setBackground("#1e293b")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(guideHeaderRow, 28);

    var guideRows = [
      ["Sinkronisasi 2-Arah", "Semua data dari website (Transaksi, Pelanggan, Booking, Chat, Proyek) otomatis masuk ke tab masing-masing secara realtime."],
      ["Kemudahan Edit", "Anda bisa mengetik atau menambah baris baru langsung di spreadsheet. Gunakan dropdown status untuk kemudahan memilih."],
      ["Rumus Finansial", "Kolom harga, total, dan sisa tagihan otomatis berformat Rupiah (Rp). Anda bebas menambah baris rumus =SUM() kustom."],
      ["Integrasi Kalender", "Deadline proyek dan jadwal janji temu konsultasi otomatis tercatat rapi ke Google Calendar akun Anda."],
      ["Keamanan Dual-Vault", "Spreadsheet ini adalah tampilan visual kas & CRM. Data master Anda selalu tercadangkan aman di Google Drive JSON."]
    ];

    for (var g = 0; g < guideRows.length; g++) {
      var rowNum = guideHeaderRow + 1 + g;
      sheet.getRange(rowNum, 1).setValue(guideRows[g][0]).setFontWeight("bold").setFontColor("#334155");
      sheet.getRange(rowNum, 2, 1, 8).merge().setValue(guideRows[g][1]).setFontColor("#475569");
      sheet.setRowHeight(rowNum, 25);
    }

    // Bordering Dashboard
    var totalDashRows = guideHeaderRow + guideRows.length;
    // eslint-disable-next-line no-undef
    sheet.getRange(1, 1, totalDashRows, 9).setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

    // Set Column Widths for Dashboard
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 200);
    for (var c = 3; c <= 9; c++) {
      sheet.setColumnWidth(c, 150);
    }
  // eslint-disable-next-line no-empty
  } catch (dErr) {}
}

// Helper: Get or Create Folder Path in Google Drive
function getOrCreateFolderPath(folderPath) {
  if (!folderPath) folderPath = "Agenze_CMS_Database/Admin/Attachments";
  var parts = folderPath.split("/").filter(function(p) { return p.trim().length > 0; });
  // eslint-disable-next-line no-undef
  var currentFolder = DriveApp.getRootFolder();
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i].trim();
    var subFolders = currentFolder.getFoldersByName(part);
    if (subFolders.hasNext()) {
      currentFolder = subFolders.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }
  return currentFolder;
}

function getOrCreateFolder(name) {
  return getOrCreateFolderPath(name);
}

// --- 2. FILE DRIVE MANAGEMENT ---
function handleFileUpload(data) {
  try {
    var base64Data = data.base64;
    var fileName = data.fileName || ('upload_' + Date.now());
    var mimeType = data.mimeType || 'application/octet-stream';
    var folderPath = data.folder || 'Agenze_CMS_Database/Media';

    if (!base64Data) {
      return jsonResponse({ status: 'error', message: 'base64 data kosong' });
    }

    var cleanBase64 = base64Data;
    if (base64Data.indexOf('base64,') > -1) {
      cleanBase64 = base64Data.split('base64,')[1];
    }

    // eslint-disable-next-line no-undef
    var decoded = Utilities.base64Decode(cleanBase64);
    // eslint-disable-next-line no-undef
    var blob = Utilities.newBlob(decoded, mimeType, fileName);

    var targetFolder = getOrCreateFolderPath(folderPath);
    var file = targetFolder.createFile(blob);

    // Set file permission to Anyone with link (Viewer)
    // eslint-disable-next-line no-undef
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileUrl = file.getUrl();
    var fileId = file.getId();
    var directDownloadUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    return jsonResponse({
      status: 'success',
      message: 'File berhasil diunggah ke Google Drive',
      fileId: fileId,
      fileUrl: fileUrl,
      directUrl: directDownloadUrl,
      fileName: fileName,
      size: file.getSize()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Upload gagal: ' + err.toString() });
  }
}

function handleDeleteFile(data) {
  try {
    var fileId = data.fileId;
    if (!fileId) {
      return jsonResponse({ status: 'error', message: 'fileId wajib disertakan' });
    }
    // eslint-disable-next-line no-undef
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return jsonResponse({ status: 'success', message: 'File berhasil dipindahkan ke Sampah Google Drive' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Gagal menghapus file: ' + err.toString() });
  }
}

// --- 3. PROYEK & PIPELINE SYNC (WITH CONTRACT VALUE & CLIENT DETAILS) ---
function handleProjectSync(projects, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Manajemen Project";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#6d28d9");
  
  var columns = [
    "ID Proyek / Konten", 
    "Judul Proyek / Topik", 
    "Klien / Pemesan",
    "Kontak Klien (WhatsApp)",
    "Tipe Modul",
    "Platform & Format",
    "Nilai Kontrak / Budget (IDR)",
    "Kategori / Tags", 
    "Status", 
    "Prioritas", 
    "Tim / PIC",
    "Progress (%)", 
    "Deadline / Jadwal", 
    "Milestones & Checklist", 
    "Link Cover & Thumbnail", 
    "Link Berkas Asset Drive", 
    "Timeline & Log", 
    "Deskripsi & Brief", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#6d28d9").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var rows = [];
  if (projects && Array.isArray(projects)) {
    rows = projects.map(function(p) {
      if (!p) return [];
      
      var tasks = p.tasks || [];
      var milestones = tasks.map(function(t) { 
        return (t.done ? "[√] " : "[ ] ") + (t.text || "Tugas"); 
      }).join("\n");
      
      var files = p.files || [];
      var coverLink = makeHyperlink(p.coverImage || p.thumbnail || (files[0] ? files[0].url : ""), "🖼️ Buka Cover");
      var firstFileLink = files.length > 0 ? makeHyperlink(files[0].url, "📁 Buka Asset (" + files.length + " File)") : "-";
      
      var activity = p.activity || [];
      var timeline = activity.map(function(act) { 
        var d = act.time ? act.time.split('T')[0] : "";
        return d + ": " + (act.message || ""); 
      }).join("\n");
      
      var tags = p.tags ? (Array.isArray(p.tags) ? p.tags.join(", ") : p.tags) : "-";
      var isDeleted = p.isDeleted || p.isTrash || p.deleted || p.status === 'trash';
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var itemType = (p.type === 'content' || p.platform) ? 'konten' : (p.type || 'proyek');
      var platformFormat = p.platform ? (p.platform + (p.format ? ' (' + p.format + ')' : '')) : (p.format || '-');
      var teamPic = p.team || p.assignedTo || p.pic || '-';
      var clientName = p.client || p.clientName || '-';
      var clientPhone = p.clientPhone || p.phone || '';
      var waLink = makeWhatsAppLink(clientPhone, clientName);
      var contractBudget = Number(p.budget || p.price || p.contractValue) || 0;
      
      return [
        p.id || "",
        p.title || "Untitled Project",
        clientName,
        waLink,
        itemType,
        platformFormat,
        contractBudget,
        tags,
        p.status || "todo",
        p.priority || "medium",
        teamPic,
        (p.progress || 0) + "%",
        p.deadline || p.scheduledDate || "-",
        milestones || "-",
        coverLink || "-",
        firstFileLink || "-",
        timeline || "-",
        p.description || p.notes || "",
        statusDb,
        safeJsonStringify(p)
      ];
    });
    
    if (rows.length > 0) {
      var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
      dataRange.setValues(rows);
      dataRange.setVerticalAlignment("middle");
      sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 4, rows.length, 3).setHorizontalAlignment("center");
      sheet.getRange(2, 7, rows.length, 1).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
      sheet.getRange(2, 9, rows.length, 5).setHorizontalAlignment("center");
      sheet.getRange(2, 14, rows.length, 5).setWrap(true);
    }
  }
  
  // Auto-sync project deadlines to Google Calendar
  try {
    // eslint-disable-next-line no-undef
    var cal = CalendarApp.getDefaultCalendar();
    if (cal && projects && Array.isArray(projects)) {
      projects.forEach(function(p) {
        var deadStr = p.deadline || p.scheduledDate;
        if (p && deadStr && !p.isDeleted && p.status !== 'done' && p.status !== 'trash') {
          var deadDate = new Date(deadStr);
          if (!isNaN(deadDate.getTime())) {
            var eventTitle = "🎯 Deadline: " + (p.title || "Proyek Desain") + (p.client ? " (" + p.client + ")" : "");
            var existing = cal.getEventsForDay(deadDate, { search: eventTitle });
            if (existing.length === 0) {
              var newEvent = cal.createAllDayEvent(eventTitle, deadDate, {
                description: "Target penyelesaian proyek/konten:\n• Judul: " + (p.title || "-") + "\n• Klien: " + (p.client || "-") + "\n• Nilai: Rp " + (p.budget || 0),
                location: "Studio Hub"
              });
              newEvent.addPopupReminder(1440);
              newEvent.addPopupReminder(120);
            }
          }
        }
      });
    }
  } catch (calErr) {}

  // Auto-sync partition to drive_db_portfolio.json
  try {
    handleSyncPartition({ partition: 'portfolio', payload: projects });
  } catch (e) {}

  var dropdowns = [
    { col: 5, options: ['proyek', 'konten', 'desain', 'web', 'video'] },
    { col: 9, options: ['todo', 'in_progress', 'review', 'done', 'scheduled', 'trash'] },
    { col: 10, options: ['high', 'medium', 'low'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "S", 2, columns.length, SpreadsheetApp.BandingTheme.LIGHT_GREY, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Manajemen Project berhasil disinkronkan', count: rows.length });
}

function handleGetProjects(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'portfolio' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Manajemen Project", ["id", "title", "client", "phone", "type", "platform", "budget", "tags", "status", "priority", "team", "progress", "deadline"], sheetId);
}

// --- 4. CATATAN & BRAIN DUMP SYNC ---
function handleNotesSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Catatan & Memo";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#f59e0b");
  
  var columns = [
    "ID Catatan", 
    "Judul Catatan", 
    "Folder", 
    "Warna / Tema", 
    "Tags", 
    "Disematkan (Pin)", 
    "Isi Catatan & Brief", 
    "Tanggal Dibuat", 
    "Update Terakhir", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var notes = Array.isArray(payload) ? payload : (payload.notes || []);
  var folders = Array.isArray(payload.folders) ? payload.folders : [];
  var folderMap = {};
  folders.forEach(function(f) {
    if (f && f.id) folderMap[f.id] = f.name;
  });

  var rows = [];
  if (notes && notes.length > 0) {
    rows = notes.map(function(n) {
      if (!n) return [];
      var isDeleted = n.isDeleted || n.deleted || n.isTrash;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var folderName = folderMap[n.folderId] || n.folderName || n.folderId || "Utama";
      var tagsText = n.tags ? (Array.isArray(n.tags) ? n.tags.join(", ") : n.tags) : "-";
      var pinnedText = n.isPinned ? "📌 Ya" : "Tidak";
      
      return [
        n.id || "",
        n.title || "Catatan Tanpa Judul",
        folderName,
        n.color || "Kuning",
        tagsText,
        pinnedText,
        n.content || n.text || "",
        n.createdAt || "-",
        n.updatedAt || "-",
        statusDb,
        safeJsonStringify(n)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 4).setHorizontalAlignment("center");
    sheet.getRange(2, 7, rows.length, 1).setWrap(true);
  }
  
  try {
    handleSyncPartition({ partition: 'notes', payload: { notes: notes, folders: folders } });
  } catch (e) {}

  var dropdowns = [
    { col: 6, options: ['📌 Ya', 'Tidak'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "J", 2, columns.length, SpreadsheetApp.BandingTheme.YELLOW, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Catatan & Memo berhasil disinkronkan', count: rows.length });
}

function handleGetNotes(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'notes' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("Catatan & Memo", ["id", "title", "folder", "color", "tags", "isPinned", "content", "createdAt", "updatedAt"], sheetId);
}

// --- 5. WHITEBOARD STUDIO SYNC ---
function handleWhiteboardSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Whiteboard Studio";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#6366f1");
  
  var columns = [
    "ID Canvas", 
    "Nama Canvas / Papan", 
    "Jumlah Node & Bentuk", 
    "Ukuran Canvas", 
    "Thumbnail Pratinjau", 
    "Waktu Dibuat", 
    "Terakhir Diubah", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#6366f1").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var canvases = Array.isArray(payload) ? payload : (payload.canvases || [payload]);
  var rows = [];
  if (canvases && canvases.length > 0) {
    rows = canvases.map(function(c) {
      if (!c) return [];
      var nodes = c.nodes || c.elements || [];
      var nodeCount = nodes.length;
      var thumbLink = makeHyperlink(c.thumbnail || c.previewUrl, "🎨 Lihat Pratinjau");
      var isDeleted = c.isDeleted || c.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      
      return [
        c.id || "",
        c.name || c.title || "Whiteboard Canvas",
        nodeCount + " elemen",
        (c.width || 1920) + " x " + (c.height || 1080),
        thumbLink,
        c.createdAt || "-",
        c.updatedAt || "-",
        statusDb,
        safeJsonStringify(c)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 3).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'canvas', payload: canvases });
  } catch (e) {}

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "H", 2, columns.length, SpreadsheetApp.BandingTheme.INDIGO, []);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Whiteboard Studio berhasil disinkronkan', count: rows.length });
}

// --- 6. TOKO & KATALOG PRODUK DIGITAL SYNC ---
function handleShopSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Manajemen Toko";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#d97706");
  
  var columns = [
    "ID Produk", 
    "Nama Produk / Jasa", 
    "Kode / SKU", 
    "Kategori", 
    "Tipe Produk", 
    "Harga (IDR)", 
    "Harga Coret (IDR)",
    "Stok / Kuota", 
    "Varian & Opsi",
    "Link Cover / Foto", 
    "Link Berkas Digital Drive", 
    "Deskripsi & Fitur", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var products = Array.isArray(payload) ? payload : (payload.products || []);
  var rows = [];
  if (products && products.length > 0) {
    rows = products.map(function(p) {
      if (!p) return [];
      var isDeleted = p.isDeleted || p.isTrash || p.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var code = p.productCode || p.sku || p.code || "-";
      var originalPrice = p.originalPrice || p.regularPrice || 0;
      var variantsText = (p.variants && Array.isArray(p.variants) && p.variants.length > 0)
        ? p.variants.map(function(v) { return (v.name || v.label || "Varian") + ": " + (v.options ? (Array.isArray(v.options) ? v.options.join(", ") : v.options) : (v.price ? "Rp " + v.price : "")); }).join("; ")
        : "-";
      var coverLink = makeHyperlink(p.image || p.coverImage || p.thumbnail, "🖼️ Buka Foto");
      var digitalLink = makeHyperlink(p.downloadUrl || p.digitalFileUrl || p.fileUrl, "📥 Download File");
      
      return [
        p.id || "",
        p.name || "Produk Tanpa Nama",
        code,
        p.category || "Umum",
        p.type || "digital",
        p.price || 0,
        originalPrice,
        p.stock !== undefined ? p.stock : "Unlimited",
        variantsText,
        coverLink,
        digitalLink,
        p.description || "",
        statusDb,
        safeJsonStringify(p)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 6, rows.length, 2).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    sheet.getRange(2, 8, rows.length, 1).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'catalog', payload: products });
  } catch (e) {}

  var dropdowns = [
    { col: 5, options: ['digital', 'service', 'physical', 'license', 'subscription'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "M", 2, columns.length, SpreadsheetApp.BandingTheme.ORANGE, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Manajemen Toko berhasil disinkronkan', count: rows.length });
}

function handleGetProducts(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'catalog' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Manajemen Toko", ["id", "name", "sku", "category", "type", "price", "originalPrice", "stock"], sheetId);
}

// --- 7. TRANSAKSI & INVOICE ARUS KAS (WITH AUTO SISA FORMULA & WHATSAPP) ---
function handleTransactionSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Transaksi & Pesanan";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.setTabColor("#047857");
  
  var columns = [
    "Timestamp", 
    "ID Transaksi", 
    "No. Nota / Invoice",
    "Tanggal Invoice", 
    "Nama Pelanggan", 
    "Kontak (WhatsApp)", 
    "Detail Item / Layanan", 
    "Metode Pembayaran",
    "Subtotal (IDR)", 
    "Diskon (IDR)", 
    "Pajak & Ongkir (IDR)",
    "Total Akhir (IDR)", 
    "Status Pembayaran", 
    "DP / Terbayar (IDR)",
    "Sisa Tagihan (IDR)", 
    "Link Nota Drive", 
    "Link Bukti Pembayaran", 
    "Status Database", 
    "Raw JSON Backup"
  ];

  var dropdowns = [
    { col: 8, options: ['QRIS', 'Transfer BCA', 'Transfer Mandiri', 'Transfer BRI', 'Tunai', 'Kartu Kredit', 'Gerai'] },
    { col: 13, options: ['lunas', 'dp', 'belum', 'batal', 'cicilan'] }
  ];

  if (Array.isArray(payload)) {
    sheet.clear();
    sheet.getBandings().forEach(function(b) { b.remove(); });
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight("bold")
      .setBackground("#047857")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);

    var rows = payload.map(function(t, idx) {
      if (!t) return [];
      var isDeleted = t.isDeleted || t.deleted || t.status === 'batal' || t.status === 'dihapus';
      var statusDb = isDeleted ? "TERHAPUS / BATAL" : "AKTIF";
      var driveLink = makeHyperlink(t.driveUrl || t.invoiceUrl, "📄 Buka Nota Drive");
      var proofLink = makeHyperlink(t.paymentProof || t.attachmentUrl, "💳 Buka Bukti Bayar");
      
      var custName = (t.customer && typeof t.customer === 'object' ? t.customer.name : t.customerName) || t.clientName || "Pelanggan";
      var rawContact = (t.customer && typeof t.customer === 'object' ? (t.customer.phone || t.customer.whatsapp || t.customer.email) : (t.customerContact || t.customerPhone || t.customerEmail)) || "-";
      var waLink = makeWhatsAppLink(rawContact, custName);
      
      var itemsText = Array.isArray(t.items) ? t.items.map(function(it) {
        return (it.name || it.title || "Item") + " (" + (it.qty || 1) + "x @" + (it.price || 0) + ")";
      }).join("; ") : (t.items || t.title || "Pesanan Desain");
      
      var taxAndShipping = (t.tax || t.taxAmount || 0) + (t.shipping || t.shippingCost || 0);
      var dp = t.dpAmount || t.downPayment || t.paidAmount || (t.paymentStatus === 'lunas' ? (t.grandTotal || t.total || 0) : 0);
      var statusBayar = t.paymentStatus || t.status || "belum";
      var paymentMethod = t.paymentMethod || t.method || "QRIS";
      var invoiceNumber = t.invoiceNumber || t.invNo || ("INV-" + (t.id || "").substring(0, 8));
      var rowIdx = 2 + idx;
      var remainingFormula = "=MAX(0, L" + rowIdx + " - N" + rowIdx + ")";
      
      return [
        t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
        t.id || "",
        invoiceNumber,
        t.date || "-",
        custName,
        waLink,
        itemsText,
        paymentMethod,
        t.subtotal || 0,
        t.discount || 0,
        taxAndShipping,
        t.grandTotal || t.total || 0,
        statusBayar,
        dp,
        remainingFormula,
        driveLink,
        proofLink,
        statusDb,
        safeJsonStringify(t)
      ];
    });

    if (rows.length > 0) {
      var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
      dataRange.setValues(rows);
      dataRange.setVerticalAlignment("middle");
      sheet.getRange(2, 1, rows.length, 4).setHorizontalAlignment("center");
      sheet.getRange(2, 8, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 9, rows.length, 4).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
      sheet.getRange(2, 13, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 14, rows.length, 2).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    }

    try {
      handleSyncPartition({ partition: 'transactions', payload: payload });
    } catch (e) {}

    // eslint-disable-next-line no-undef
    applySheetEnhancements(sheet, "R", 2, columns.length, SpreadsheetApp.BandingTheme.TEAL, dropdowns);
    ensureDashboardOverviewTab(ss);
    return jsonResponse({ status: 'success', message: 'Batch transaksi berhasil disinkronkan', count: rows.length });
  }

  // Single transaction insert or update
  var tSingle = payload;
  var lastRow = sheet.getLastRow();
  var rowIndexToUpdate = -1;

  if (lastRow >= 2) {
    var idColValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < idColValues.length; i++) {
      if (idColValues[i][0] === tSingle.id) {
        rowIndexToUpdate = i + 2;
        break;
      }
    }
  }

  var rawDriveUrl = tSingle.driveUrl || tSingle.invoiceUrl;
  var driveLinkFormula = makeHyperlink(rawDriveUrl, "📄 Buka Nota Drive");
  var proofLinkFormula = makeHyperlink(tSingle.paymentProof || tSingle.attachmentUrl, "💳 Buka Bukti Bayar");
  var custNameSingle = (tSingle.customer && typeof tSingle.customer === 'object' ? tSingle.customer.name : tSingle.customerName) || tSingle.clientName || "Pelanggan";
  var custContactSingle = (tSingle.customer && typeof tSingle.customer === 'object' ? (tSingle.customer.phone || tSingle.customer.whatsapp || tSingle.customer.email) : (tSingle.customerContact || tSingle.customerPhone || tSingle.customerEmail)) || "-";
  var waLinkSingle = makeWhatsAppLink(custContactSingle, custNameSingle);
  var targetRowIdx = rowIndexToUpdate > 0 ? rowIndexToUpdate : (lastRow + 1);
  var singleRemainingFormula = "=MAX(0, L" + targetRowIdx + " - N" + targetRowIdx + ")";

  var singleRow = [
    tSingle.createdAt ? new Date(tSingle.createdAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
    tSingle.id || "",
    tSingle.invoiceNumber || ("INV-" + (tSingle.id || "").substring(0, 8)),
    tSingle.date || new Date().toISOString().substring(0, 10),
    custNameSingle,
    waLinkSingle,
    Array.isArray(tSingle.items) ? tSingle.items.map(function(it) { return (it.name || "Item") + " (" + (it.qty || 1) + "x)"; }).join("; ") : (tSingle.items || "Pesanan"),
    tSingle.paymentMethod || "QRIS",
    tSingle.subtotal || 0,
    tSingle.discount || 0,
    (tSingle.tax || 0) + (tSingle.shipping || 0),
    tSingle.grandTotal || tSingle.total || 0,
    tSingle.paymentStatus || tSingle.status || "belum",
    tSingle.dpAmount || (tSingle.paymentStatus === 'lunas' ? (tSingle.grandTotal || 0) : 0),
    singleRemainingFormula,
    driveLinkFormula,
    proofLinkFormula,
    tSingle.isDeleted ? "TERHAPUS" : "AKTIF",
    safeJsonStringify(tSingle)
  ];

  if (rowIndexToUpdate > 0) {
    sheet.getRange(rowIndexToUpdate, 1, 1, columns.length).setValues([singleRow]);
  } else {
    sheet.appendRow(singleRow);
  }

  lastRow = sheet.getLastRow();
  sheet.getRange(2, 9, lastRow - 1, 4).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
  sheet.getRange(2, 14, lastRow - 1, 2).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
  
  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "R", 2, columns.length, SpreadsheetApp.BandingTheme.TEAL, dropdowns);
  ensureDashboardOverviewTab(ss);
  return jsonResponse({ status: 'success', message: 'Transaksi ' + tSingle.id + ' berhasil disimpan di Google Sheets' });
}

function handleGetTransactions(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'transactions' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Transaksi & Pesanan", ["timestamp", "id", "invoiceNumber", "date", "customerName", "contact", "items", "paymentMethod", "subtotal", "discount", "tax", "total", "status", "dp", "remaining"], sheetId);
}

// --- 8. FORMULIR & SURVEI MAKER (DYNAMIC FORM SCHEMAS & RESPONSES) ---
function handleFormsSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "📋 Formulir & Survei";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#7c3aed");
  
  var columns = [
    "ID Formulir", 
    "Judul Formulir", 
    "Deskripsi / Penjelasan", 
    "Warna Tema", 
    "Status Penerimaan Respon", 
    "Auto-Save ke Drive", 
    "Jumlah Pertanyaan", 
    "Rincian Judul Pertanyaan", 
    "Link Excel Tanggapan Drive", 
    "Tanggal Dibuat", 
    "Update Terakhir", 
    "Status Database", 
    "Raw JSON Schema"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#7c3aed").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var forms = Array.isArray(payload) ? payload : (payload.forms || [payload]);
  var rows = [];
  if (forms && forms.length > 0) {
    rows = forms.map(function(f) {
      if (!f) return [];
      var questions = f.questions || [];
      var qSummary = questions.map(function(q, i) {
        return (i + 1) + ". " + (q.title || "Pertanyaan") + " [" + (q.type || "text") + (q.required ? ", Wajib" : "") + "]";
      }).join("\n");
      
      var isDeleted = f.isDeleted || f.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var driveExcelLink = makeHyperlink(f.driveFileUrl, "📊 Buka Excel Tanggapan");
      var acceptingStr = f.acceptingResponses ? "✅ Menerima" : "⛔ Ditutup";
      var autoSaveStr = f.autoSaveDrive ? "Aktif" : "Nonaktif";
      
      return [
        f.id || "",
        f.title || "Formulir Baru",
        f.description || "",
        f.themeColor || "#673ab7",
        acceptingStr,
        autoSaveStr,
        questions.length + " Pertanyaan",
        qSummary || "-",
        driveExcelLink,
        f.createdAt || "-",
        f.updatedAt || "-",
        statusDb,
        safeJsonStringify(f)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 4, rows.length, 4).setHorizontalAlignment("center");
    sheet.getRange(2, 8, rows.length, 1).setWrap(true);
  }
  
  try {
    handleSyncPartition({ partition: 'forms', payload: forms });
  } catch (e) {}

  var dropdowns = [
    { col: 5, options: ['✅ Menerima', '⛔ Ditutup'] },
    { col: 6, options: ['Aktif', 'Nonaktif'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "L", 2, columns.length, SpreadsheetApp.BandingTheme.PURPLE, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Formulir & Survei berhasil disinkronkan', count: rows.length });
}

function handleFormResponsesSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "📥 Tanggapan Formulir";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.setTabColor("#9333ea");
  
  var columns = [
    "Waktu Pengisian", 
    "ID Tanggapan", 
    "ID Formulir", 
    "Judul Formulir", 
    "Nama Responden", 
    "Kontak (WhatsApp / Email)", 
    "Rangkuman Jawaban", 
    "Link Excel Lengkap", 
    "Status Database", 
    "Raw JSON Data"
  ];

  var responses = Array.isArray(payload) ? payload : (payload.responses || [payload]);
  
  if (Array.isArray(payload) || payload.responses) {
    sheet.clear();
    sheet.getBandings().forEach(function(b) { b.remove(); });
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight("bold")
      .setBackground("#9333ea")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);

    var rows = responses.map(function(r) {
      if (!r) return [];
      var answers = r.answers || {};
      var ansText = Object.keys(answers).map(function(k) {
        var v = answers[k];
        return k + ": " + (Array.isArray(v) ? v.join(", ") : v);
      }).join("\n");
      
      var isDeleted = r.isDeleted || r.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var excelLink = makeHyperlink(r.excelUrl || r.driveUrl, "📊 Buka Excel");
      var respondentContact = r.respondentPhone || r.respondentEmail || r.contact || "-";
      var waLink = makeWhatsAppLink(respondentContact, r.respondentName);

      return [
        r.submittedAt ? new Date(r.submittedAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
        r.id || "",
        r.formId || "",
        r.formTitle || "Formulir",
        r.respondentName || "Responden",
        waLink,
        ansText || "-",
        excelLink,
        statusDb,
        safeJsonStringify(r)
      ];
    });

    if (rows.length > 0) {
      var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
      dataRange.setValues(rows);
      dataRange.setVerticalAlignment("middle");
      sheet.getRange(2, 1, rows.length, 3).setHorizontalAlignment("center");
      sheet.getRange(2, 6, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 7, rows.length, 1).setWrap(true);
    }

    try {
      handleSyncPartition({ partition: 'form_responses', payload: responses });
    } catch (e) {}

    // eslint-disable-next-line no-undef
    applySheetEnhancements(sheet, "I", 2, columns.length, SpreadsheetApp.BandingTheme.PURPLE, []);
    ensureDashboardOverviewTab(ss);
    return jsonResponse({ status: 'success', message: 'Tanggapan Formulir berhasil disinkronkan', count: rows.length });
  }

  // Single response append
  var singleR = payload;
  var answersSingle = singleR.answers || {};
  var ansSingleText = Object.keys(answersSingle).map(function(k) {
    var v = answersSingle[k];
    return k + ": " + (Array.isArray(v) ? v.join(", ") : v);
  }).join("\n");

  sheet.appendRow([
    singleR.submittedAt ? new Date(singleR.submittedAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
    singleR.id || ("resp_" + Date.now()),
    singleR.formId || "",
    singleR.formTitle || "Formulir",
    singleR.respondentName || "Responden",
    makeWhatsAppLink(singleR.respondentPhone || singleR.respondentEmail, singleR.respondentName),
    ansSingleText || "-",
    makeHyperlink(singleR.excelUrl, "📊 Buka Excel"),
    "AKTIF",
    safeJsonStringify(singleR)
  ]);

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "I", 2, columns.length, SpreadsheetApp.BandingTheme.PURPLE, []);
  ensureDashboardOverviewTab(ss);
  return jsonResponse({ status: 'success', message: 'Tanggapan formulir berhasil dicatat' });
}

function handleGetForms(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'forms' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("📋 Formulir & Survei", ["id", "title", "description", "themeColor", "acceptingResponses", "autoSaveDrive", "questionsCount"], sheetId);
}

function handleGetFormResponses(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'form_responses' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("📥 Tanggapan Formulir", ["submittedAt", "id", "formId", "formTitle", "respondentName", "contact", "answers"], sheetId);
}

// --- 9. FEED SOSIAL & STATUS UPDATE UTAS SYNC ---
function handleSocialUpdatesSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var updates = Array.isArray(payload) ? payload : (payload ? (payload.updates || payload.posts || [payload]) : []);
  
  var sheetName = "📱 Feed & Status Update (Utas)";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#8b5cf6"); // Violet
  
  var columns = [
    "ID Update", 
    "Tanggal Rilis (Bisa Lampau)", 
    "Kategori Update",
    "Status Publikasi", 
    "Disematkan (Pin)", 
    "Judul / Topik",
    "Isi Cerita / Konten Utas", 
    "Estimasi Baca (Menit)",
    "Tags & Filter Chips",
    "Tipe Media",
    "Lampiran Media (Foto/Video)", 
    "Tag Proyek Terkait", 
    "Tautan Proyek", 
    "Jumlah Suka (Likes)", 
    "Penulis", 
    "Waktu Dibuat", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#7c3aed").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var rows = [];
  if (updates && Array.isArray(updates) && updates.length > 0) {
    rows = updates.map(function(u) {
      if (!u) return [];
      var isDeleted = u.isDeleted || u.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var mediaList = Array.isArray(u.mediaUrls) ? u.mediaUrls : (u.mediaUrl ? [u.mediaUrl] : []);
      var mediaFormula = mediaList.length > 0 ? makeHyperlink(mediaList[0], "🖼️ " + mediaList.length + " Media") : "-";
      var projectLink = u.projectUrl ? makeHyperlink(u.projectUrl, "🔗 Buka Proyek") : "-";
      var authorName = (u.author && u.author.name) ? u.author.name : (u.author || "Arif Wicaksono");
      var dateStr = u.customDate || (u.createdAt ? u.createdAt.substring(0, 10) : "-");
      var pinnedStr = u.isPinned ? "📌 Ya" : "Tidak";
      var pubStr = (u.isPublished === false) ? "Draft" : "Published";
      var catStr = u.category || "Pembaruan";
      var readTime = u.readTime || u.readingTime || (Math.max(1, Math.ceil((u.content || '').split(' ').length / 150)) + " mnt");
      var tagsStr = Array.isArray(u.tags) ? u.tags.join(', ') : (u.tags || '-');

      return [
        u.id || "",
        dateStr,
        catStr,
        pubStr,
        pinnedStr,
        u.title || "Update Studio",
        (u.content || "").substring(0, 800),
        readTime,
        tagsStr,
        u.mediaType || "image",
        mediaFormula,
        u.projectTag || "-",
        projectLink,
        u.likesCount || u.likes || 0,
        authorName,
        u.createdAt || "-",
        statusDb,
        safeJsonStringify(u)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 5).setHorizontalAlignment("center");
    sheet.getRange(2, 7, rows.length, 1).setWrap(true);
    sheet.getRange(2, 8, rows.length, 7).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'social_updates', payload: updates });
  } catch (e) {}

  var dropdowns = [
    { col: 3, options: ['Pembaruan', 'Fitur Baru', 'Perbaikan', 'Desain', 'Pengumuman', 'Tips'] },
    { col: 4, options: ['Published', 'Draft', 'Archived'] },
    { col: 5, options: ['📌 Ya', 'Tidak'] },
    { col: 10, options: ['image', 'video', 'mixed', 'text'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "Q", 2, columns.length, SpreadsheetApp.BandingTheme.PURPLE, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Feed & Status Update berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetSocialUpdates(data) {
  var partitionRes = handleGetPartition({ partition: 'social_updates' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("📱 Feed & Status Update (Utas)", ["id", "customDate", "category", "isPublished", "isPinned", "title", "content", "readTime", "tags", "mediaType", "mediaUrl", "projectTag", "projectUrl", "likesCount", "author", "createdAt"], data.sheetId);
}

// --- 10. PROFIL BISNIS, REKENING BANK & QRIS SYNC ---
function handleBusinessProfileSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "🏢 Profil Bisnis & Rekening";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#0891b2"); // Cyan
  
  var columns = [
    "Kategori Parameter", 
    "Nama Data / Bank", 
    "Nomor Rekening / Nilai", 
    "Atas Nama / Catatan", 
    "Status / Label", 
    "Tautan Berkas / QRIS", 
    "Raw Value Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#0891b2").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var rows = [];
  var bp = payload || {};
  
  // 1. Identitas Bisnis & Kontak
  rows.push(["Identitas Bisnis", "Nama Studio / Brand", bp.name || bp.brandName || "sumr.day | Creative Digital Studio", "Brand Utama", "AKTIF", "-", bp.name || "-"]);
  rows.push(["Identitas Bisnis", "Tagline / Slogan", bp.tagline || "A little sunshine for your screen", "Deskripsi Singkat", "AKTIF", "-", bp.tagline || "-"]);
  rows.push(["Identitas Bisnis", "Email Resmi", bp.email || "-", "Email Notifikasi & Invoice", "AKTIF", "-", bp.email || "-"]);
  rows.push(["Identitas Bisnis", "Nomor WhatsApp", bp.phone || bp.whatsapp || "-", "Pusat Layanan Klien", "AKTIF", makeWhatsAppLink(bp.phone, bp.name), bp.phone || "-"]);
  rows.push(["Identitas Bisnis", "Alamat Studio / Kantor", bp.address || "-", "Domisili Usaha", "AKTIF", "-", bp.address || "-"]);
  rows.push(["Identitas Bisnis", "Website Portofolio", bp.website || "-", "Domain Utama", "AKTIF", makeHyperlink(bp.website, "🌐 Buka Website"), bp.website || "-"]);

  // 2. Rekening Bank Pembayaran
  var bankAccounts = bp.bankAccounts || bp.banks || [];
  if (Array.isArray(bankAccounts) && bankAccounts.length > 0) {
    bankAccounts.forEach(function(bk, idx) {
      if (!bk) return;
      var statusBk = bk.isPrimary ? "⭐ REKENING UTAMA" : "REKENING OPSI";
      rows.push([
        "Rekening Bank",
        bk.bankName || bk.name || ("Bank #" + (idx + 1)),
        bk.accountNumber || bk.accNo || "-",
        bk.accountHolder || bk.holder || "-",
        statusBk,
        "-",
        safeJsonStringify(bk)
      ]);
    });
  } else {
    rows.push(["Rekening Bank", "BCA", "1234567890", "Arif Wicaksono", "⭐ REKENING UTAMA", "-", "-"]);
  }

  // 3. Konfigurasi QRIS
  var qrisUrl = bp.qrisImageUrl || bp.qrisUrl || (bp.qris && bp.qris.url);
  var qrisLinkFormula = qrisUrl ? makeHyperlink(qrisUrl, "📷 Buka QRIS Cloudinary") : "-";
  rows.push([
    "Metode QRIS",
    "Gambar QRIS Statis / Dinamis",
    qrisUrl ? "Tersedia di Cloudinary" : "Belum diunggah",
    "Digunakan di Checkout Katalog & Modal Nota",
    qrisUrl ? "SIAP SCAN" : "KOSONG",
    qrisLinkFormula,
    qrisUrl || "-"
  ]);

  var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
  dataRange.setValues(rows);
  dataRange.setVerticalAlignment("middle");
  sheet.getRange(2, 1, rows.length, 2).setFontWeight("bold");
  sheet.getRange(2, 5, rows.length, 2).setHorizontalAlignment("center");
  
  try {
    handleSyncPartition({ partition: 'business_profile', payload: bp });
  } catch (e) {}

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "E", 2, columns.length, SpreadsheetApp.BandingTheme.CYAN, []);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Profil Bisnis & Rekening berhasil disinkronkan', count: rows.length });
}

function handleGetBusinessProfile(data) {
  var partitionRes = handleGetPartition({ partition: 'business_profile' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return jsonResponse({ status: 'success', data: {} });
}

// --- 11. PELANGGAN CRM & SPACE CIRCLE SYNC ---
function handleCustomerSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Data Pelanggan CRM";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#0284c7");
  
  var columns = [
    "ID Pelanggan", 
    "Nama Pelanggan", 
    "Nomor WhatsApp", 
    "Email", 
    "Perusahaan / Bisnis", 
    "Alamat & Kota", 
    "Total Transaksi (Kali)", 
    "Total Belanja Kumulatif (IDR)", 
    "Status Pelanggan", 
    "Label / Tags", 
    "Catatan Terakhir", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var customers = Array.isArray(payload) ? payload : (payload.customers || []);
  var rows = [];
  if (customers && customers.length > 0) {
    rows = customers.map(function(c) {
      if (!c) return [];
      var isDeleted = c.isDeleted || c.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var waLink = makeWhatsAppLink(c.phone || c.whatsapp, c.name);
      
      return [
        c.id || "",
        c.name || "Klien Anonim",
        waLink,
        c.email || "-",
        c.company || c.business || "-",
        c.address || "-",
        c.totalOrders || c.orderCount || 0,
        c.totalSpent || c.ltv || 0,
        c.status || "Aktif",
        Array.isArray(c.tags) ? c.tags.join(", ") : (c.tags || "-"),
        c.notes || "",
        statusDb,
        safeJsonStringify(c)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 7, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 8, rows.length, 1).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    sheet.getRange(2, 9, rows.length, 1).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'customers', payload: customers });
  } catch (e) {}

  var dropdowns = [
    { col: 9, options: ['VIP', 'Aktif', 'Prospek', 'Nonaktif'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "L", 2, columns.length, SpreadsheetApp.BandingTheme.CYAN, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Data Pelanggan CRM berhasil disinkronkan', count: rows.length });
}

function handleGetCustomers(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'customers' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Data Pelanggan CRM", ["id", "name", "phone", "email", "company", "address", "totalOrders", "totalSpent", "status"], sheetId);
}

// --- 12. SPACE CIRCLE (PENGGUNA & TIM) SYNC ---
function handleUserSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Space Circle (Pengguna)";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#10b981");
  
  var columns = [
    "UID Pengguna", 
    "Nama Lengkap", 
    "Email Akun", 
    "Nomor WhatsApp", 
    "Role / Hak Akses", 
    "Link Foto Avatar", 
    "Status Akun", 
    "Terakhir Login", 
    "Tanggal Terdaftar", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var users = Array.isArray(payload) ? payload : (payload.users || []);
  var rows = [];
  if (users && users.length > 0) {
    rows = users.map(function(u) {
      if (!u) return [];
      var isDeleted = u.isDeleted || u.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var photoLink = makeHyperlink(u.photoURL || u.avatarUrl, "👤 Lihat Avatar");
      var waLink = makeWhatsAppLink(u.phone || u.whatsapp, u.displayName || u.name);
      
      return [
        u.uid || u.id || "",
        u.displayName || u.name || "Pengguna",
        u.email || "-",
        waLink,
        u.role || "Staff",
        photoLink,
        u.status || "Aktif",
        u.lastLogin || "-",
        u.createdAt || "-",
        statusDb,
        safeJsonStringify(u)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 4, rows.length, 5).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'users', payload: users });
  } catch (e) {}

  var dropdowns = [
    { col: 5, options: ['⭐ Super Admin', '🛡️ Admin', '👤 Klien Publik', 'Staff', 'Desainer'] },
    { col: 7, options: ['Aktif', 'Tergembok', 'Suspended', 'Nonaktif'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "J", 2, columns.length, SpreadsheetApp.BandingTheme.GREEN, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Pengguna & Tim berhasil disinkronkan', count: rows.length });
}

function handleGetUsers(data) {
  var partitionRes = handleGetPartition({ partition: 'users' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Space Circle (Pengguna)", ["uid", "name", "email", "phone", "role", "avatar", "status"], data.sheetId);
}

// --- 13. JANJI TEMU & BOOKING SYNC ---
function handleBookingSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Janji Temu & Booking";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#8b5cf6");
  
  var columns = [
    "ID Booking", 
    "Nama Klien", 
    "Nomor WhatsApp", 
    "Email Klien", 
    "Layanan / Keperluan", 
    "Tanggal & Jam Konsultasi", 
    "Lokasi / Platform", 
    "Status Konfirmasi", 
    "Catatan Klien", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var bookings = Array.isArray(payload) ? payload : (payload.bookings || []);
  var rows = [];
  if (bookings && bookings.length > 0) {
    rows = bookings.map(function(b) {
      if (!b) return [];
      var isDeleted = b.isDeleted || b.deleted || b.status === 'batal';
      var statusDb = isDeleted ? "BATAL / TERHAPUS" : "AKTIF";
      var waLink = makeWhatsAppLink(b.phone || b.whatsapp, b.clientName || b.name);
      var formattedDateTime = b.date ? (b.time ? b.date + " " + b.time + " WIB" : b.date) : (b.dateTime || "-");
      
      return [
        b.id || "",
        b.clientName || b.name || "Klien Konsultasi",
        waLink,
        b.clientEmail || b.email || "-",
        b.service || b.purpose || "Konsultasi Studio",
        formattedDateTime,
        b.platform || b.location || "Google Meet",
        b.status || "Menunggu Konfirmasi",
        b.notes || "",
        statusDb,
        safeJsonStringify(b)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 6, rows.length, 3).setHorizontalAlignment("center");
    sheet.getRange(2, 9, rows.length, 1).setWrap(true);
  }
  
  // Auto-sync booking dates to Google Calendar
  try {
    // eslint-disable-next-line no-undef
    var cal = CalendarApp.getDefaultCalendar();
    if (cal && bookings && Array.isArray(bookings)) {
      bookings.forEach(function(b) {
        if (b && b.date && !b.isDeleted && b.status !== 'batal') {
          var bookDate = new Date(b.date);
          if (!isNaN(bookDate.getTime())) {
            var eventTitle = "📅 Sesi: " + (b.service || "Konsultasi") + " (" + (b.clientName || "Klien") + ")";
            var existing = cal.getEventsForDay(bookDate, { search: eventTitle });
            if (existing.length === 0) {
              var newEvent = cal.createAllDayEvent(eventTitle, bookDate, {
                description: "Sesi konsultasi klien studio:\n• Nama: " + (b.clientName || "-") + "\n• WhatsApp: " + (b.phone || "-") + "\n• Platform: " + (b.platform || "Google Meet"),
                location: b.platform || "Google Meet"
              });
              newEvent.addPopupReminder(1440);
              newEvent.addPopupReminder(60);
            }
          }
        }
      });
    }
  } catch (calErr) {}

  try {
    handleSyncPartition({ partition: 'bookings', payload: bookings });
  } catch (e) {}

  var dropdowns = [
    { col: 8, options: ['Menunggu Konfirmasi', 'Terkonfirmasi', 'Selesai', 'Batal'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "J", 2, columns.length, SpreadsheetApp.BandingTheme.PURPLE, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Janji Temu & Booking berhasil disinkronkan', count: rows.length });
}

function handleGetBookings(data) {
  var partitionRes = handleGetPartition({ partition: 'bookings' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Janji Temu & Booking", ["id", "clientName", "phone", "email", "service", "date", "platform", "status"], data.sheetId);
}

// --- 14. PESAN & CHAT KLIEN SYNC ---
function handleChatSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Pesan & Chat Klien";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.setTabColor("#14b8a6");
  
  var columns = [
    "Waktu Kirim", 
    "ID Pesan", 
    "ID Percakapan", 
    "Pengirim", 
    "Nama Pengirim", 
    "Role", 
    "Isi Pesan Chat", 
    "Tautan Berkas Lampiran", 
    "Status Terbaca", 
    "Status Database", 
    "Raw JSON Backup"
  ];

  var messages = Array.isArray(payload) ? payload : (payload.messages || [payload]);

  if (Array.isArray(payload) || payload.messages) {
    sheet.clear();
    sheet.getBandings().forEach(function(b) { b.remove(); });
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight("bold")
      .setBackground("#14b8a6")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);

    var rows = messages.map(function(m) {
      if (!m) return [];
      var isDeleted = m.isDeleted || m.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var attachment = m.attachment || m.fileUrl || m.imageUrl;
      var attachmentFormula = attachment ? makeHyperlink(attachment, "📎 Lihat Lampiran") : "-";
      var readStatus = m.read ? "Terbaca" : "Belum Dibaca";

      return [
        m.timestamp ? new Date(m.timestamp).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
        m.id || "",
        m.conversationId || m.clientId || "Global",
        m.senderId || m.from || "User",
        m.senderName || m.name || "Anonim",
        m.senderRole || m.role || "Client",
        (m.text || m.content || m.message || "").substring(0, 1000),
        attachmentFormula,
        readStatus,
        statusDb,
        safeJsonStringify(m)
      ];
    });

    if (rows.length > 0) {
      var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
      dataRange.setValues(rows);
      dataRange.setVerticalAlignment("middle");
      sheet.getRange(2, 1, rows.length, 6).setHorizontalAlignment("center");
      sheet.getRange(2, 7, rows.length, 1).setWrap(true);
      sheet.getRange(2, 8, rows.length, 2).setHorizontalAlignment("center");
    }

    try {
      handleSyncPartition({ partition: 'chats', payload: messages });
    } catch (e) {}

    // eslint-disable-next-line no-undef
    applySheetEnhancements(sheet, "J", 2, columns.length, SpreadsheetApp.BandingTheme.TEAL, []);
    ensureDashboardOverviewTab(ss);
    return jsonResponse({ status: 'success', message: 'Chat berhasil disinkronkan', count: rows.length });
  }

  // Single message append
  var singleMsg = payload;
  var singleAttach = singleMsg.attachment || singleMsg.fileUrl || singleMsg.imageUrl;
  sheet.appendRow([
    singleMsg.timestamp ? new Date(singleMsg.timestamp).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
    singleMsg.id || ("msg_" + Date.now()),
    singleMsg.conversationId || singleMsg.clientId || "Global",
    singleMsg.senderId || singleMsg.from || "User",
    singleMsg.senderName || singleMsg.name || "Anonim",
    singleMsg.senderRole || singleMsg.role || "Client",
    (singleMsg.text || singleMsg.content || singleMsg.message || "").substring(0, 1000),
    singleAttach ? makeHyperlink(singleAttach, "📎 Lihat Lampiran") : "-",
    singleMsg.read ? "Terbaca" : "Belum Dibaca",
    "AKTIF",
    safeJsonStringify(singleMsg)
  ]);

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "J", 2, columns.length, SpreadsheetApp.BandingTheme.TEAL, []);
  ensureDashboardOverviewTab(ss);
  return jsonResponse({ status: 'success', message: 'Pesan berhasil dicatat' });
}

function handleGetChats(data) {
  var partitionRes = handleGetPartition({ partition: 'chats' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Pesan & Chat Klien", ["timestamp", "id", "conversationId", "sender", "name", "role", "message"], data.sheetId);
}

// --- 15. KUPON DISKON & PROMOSI SYNC ---
function handleDiscountSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Data Diskon & Promo";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#f97316");
  
  var columns = [
    "ID Diskon", 
    "Nama Promo / Kupon", 
    "Kode Kupon", 
    "Tipe Diskon", 
    "Nilai Potongan", 
    "Minimal Pembelian (IDR)", 
    "Batas Kuota Pemakaian", 
    "Jumlah Terpakai", 
    "Masa Berlaku Hingga", 
    "Status Kupon", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#f97316").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var discounts = Array.isArray(payload) ? payload : (payload.discounts || []);
  var rows = [];
  if (discounts && discounts.length > 0) {
    rows = discounts.map(function(d) {
      if (!d) return [];
      var isDeleted = d.isDeleted || d.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var valueDisplay = d.type === 'percentage' ? (d.value + "%") : ("Rp " + (d.value || 0));
      
      return [
        d.id || "",
        d.name || "Kupon Diskon",
        d.code || "PROMO",
        d.type || "percentage",
        valueDisplay,
        d.minPurchase || 0,
        d.usageLimit || "Unlimited",
        d.usedCount || 0,
        d.validUntil || d.expiryDate || "Selamanya",
        d.status || "Aktif",
        statusDb,
        safeJsonStringify(d)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 4).setHorizontalAlignment("center");
    sheet.getRange(2, 6, rows.length, 1).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    sheet.getRange(2, 7, rows.length, 4).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'discounts', payload: discounts });
  } catch (e) {}

  var dropdowns = [
    { col: 4, options: ['percentage', 'fixed'] },
    { col: 10, options: ['Aktif', 'Kedaluwarsa', 'Habis'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "K", 2, columns.length, SpreadsheetApp.BandingTheme.ORANGE, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Data Diskon & Promo berhasil disinkronkan', count: rows.length });
}

function handleGetDiscounts(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'discounts' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Data Diskon & Promo", ["id", "name", "code", "type", "value", "minPurchase", "limit", "status"], sheetId);
}

// --- 16. WEBSITE & BLOG POSTS SYNC ---
function handleWebsiteSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Data Artikel Blog";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  sheet.clear();
  sheet.getBandings().forEach(function(b) { b.remove(); });
  sheet.setTabColor("#2563eb");
  
  var columns = [
    "ID Artikel", 
    "Judul Artikel / Karya", 
    "Slug URL", 
    "Kategori", 
    "Tags", 
    "Link Cover Banner", 
    "Status Publikasi", 
    "Jumlah Pembaca / Views", 
    "Penulis", 
    "Waktu Diterbitkan", 
    "Status Database", 
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);
  
  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);
  
  var posts = Array.isArray(payload) ? payload : (payload.posts || []);
  var rows = [];
  if (posts && posts.length > 0) {
    rows = posts.map(function(p) {
      if (!p) return [];
      var isDeleted = p.isDeleted || p.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var coverLink = makeHyperlink(p.coverImage || p.thumbnail, "🖼️ Buka Cover");
      var tagsStr = Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || "-");
      
      return [
        p.id || "",
        p.title || "Artikel Tanpa Judul",
        p.slug || "-",
        p.category || "Berita",
        tagsStr,
        coverLink,
        p.status || (p.isPublished ? "Published" : "Draft"),
        p.views || p.viewCount || 0,
        p.author || "Arif Wicaksono",
        p.publishedAt || p.createdAt || "-",
        statusDb,
        safeJsonStringify(p)
      ];
    });
    
    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 6, rows.length, 5).setHorizontalAlignment("center");
  }
  
  try {
    handleSyncPartition({ partition: 'website', payload: payload });
  } catch (e) {}

  var dropdowns = [
    { col: 7, options: ['Published', 'Draft', 'Archived'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "K", 2, columns.length, SpreadsheetApp.BandingTheme.CYAN, dropdowns);
  ensureDashboardOverviewTab(ss);
  
  return jsonResponse({ status: 'success', message: 'Website & Blog berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetWebsite(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'website' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("Data Artikel Blog", ["id", "title", "slug", "category", "tags", "status", "views", "author", "publishedAt"], sheetId);
}

// --- 17. BATCH SYNC ORCHESTRATOR (SINKRONISASI KILAT SEMUA MODUL) ---
function handleBatchSync(payload, sheetId) {
  var p = payload || {};
  var results = {};
  var totalProcessed = 0;

  try {
    if (p.projects) {
      handleProjectSync(p.projects, sheetId);
      results.projects = 'ok';
      totalProcessed++;
    }
    if (p.transactions) {
      handleTransactionSync(p.transactions, sheetId);
      results.transactions = 'ok';
      totalProcessed++;
    }
    if (p.notes) {
      handleNotesSync(p.notes, sheetId);
      results.notes = 'ok';
      totalProcessed++;
    }
    if (p.canvases || p.whiteboard) {
      handleWhiteboardSync(p.canvases || p.whiteboard, sheetId);
      results.whiteboard = 'ok';
      totalProcessed++;
    }
    if (p.products || p.shop) {
      handleShopSync(p.products || p.shop, sheetId);
      results.shop = 'ok';
      totalProcessed++;
    }
    if (p.customers) {
      handleCustomerSync(p.customers, sheetId);
      results.customers = 'ok';
      totalProcessed++;
    }
    if (p.users) {
      handleUserSync(p.users, sheetId);
      results.users = 'ok';
      totalProcessed++;
    }
    if (p.bookings) {
      handleBookingSync(p.bookings, sheetId);
      results.bookings = 'ok';
      totalProcessed++;
    }
    if (p.chats) {
      handleChatSync(p.chats, sheetId);
      results.chats = 'ok';
      totalProcessed++;
    }
    if (p.discounts) {
      handleDiscountSync(p.discounts, sheetId);
      results.discounts = 'ok';
      totalProcessed++;
    }
    if (p.website || p.posts) {
      handleWebsiteSync(p.website || p.posts, sheetId);
      results.website = 'ok';
      totalProcessed++;
    }
    if (p.social_updates || p.updates) {
      handleSocialUpdatesSync(p.social_updates || p.updates, sheetId);
      results.social_updates = 'ok';
      totalProcessed++;
    }
    if (p.forms) {
      handleFormsSync(p.forms, sheetId);
      results.forms = 'ok';
      totalProcessed++;
    }
    if (p.form_responses) {
      handleFormResponsesSync(p.form_responses, sheetId);
      results.form_responses = 'ok';
      totalProcessed++;
    }
    if (p.business_profile) {
      handleBusinessProfileSync(p.business_profile, sheetId);
      results.business_profile = 'ok';
      totalProcessed++;
    }

    var ss = getSpreadsheet(sheetId);
    ensureDashboardOverviewTab(ss);

    return jsonResponse({
      status: 'success',
      message: 'Batch sync seluruh modul berhasil diproses secara atomik',
      modulesSynced: results,
      totalCount: totalProcessed,
      timestamp: new Date().toISOString()
    });
  } catch (bErr) {
    return jsonResponse({ status: 'error', message: 'Batch sync gagal: ' + bErr.toString() });
  }
}

// --- 18. GAME CONFIG BACKUP ---
function handleGameConfigBackup(data, sheetId) {
  try {
    var clientId = data.clientId || 'unknown_client';
    var clientName = data.clientName || 'Klien sumr.day';
    var clientEmail = data.clientEmail || '-';
    var gameId = data.gameId || 'game';
    var gameTitle = data.gameTitle || 'Game Instance';
    var tier = data.tier || 'premium';
    var model = data.model || 'rental';
    var configData = data.config || data.payload || {};
    var timestamp = data.timestamp || new Date().toISOString();

    var folder = getOrCreateFolderPath("Agenze_Game_Backups");
    var safeDate = new Date().toISOString().replace(/[:.]/g, '-');
    var fileName = gameId + "_" + clientId + "_" + safeDate + ".json";
    
    var jsonContent = JSON.stringify({
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

    // eslint-disable-next-line no-undef
    var driveFile = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);
    var fileUrl = driveFile.getUrl();
    var fileId = driveFile.getId();

    // Log to Google Sheet
    try {
      var ss = getSpreadsheet(sheetId);
      var logSheet = ss.getSheetByName("Agenze_Game_Logs") || ss.insertSheet("Agenze_Game_Logs");
      if (logSheet.getLastRow() === 0) {
        logSheet.appendRow(["Timestamp", "Nama Klien", "Email Klien", "Judul Game", "Tier", "Model", "File JSON", "Tautan Berkas"]);
        logSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      }
      logSheet.appendRow([
        new Date().toLocaleString("id-ID"),
        clientName,
        clientEmail,
        gameTitle,
        tier,
        model,
        fileName,
        makeHyperlink(fileUrl, "🎮 Buka Config Drive")
      ]);
    } catch (sErr) {}

    return jsonResponse({
      status: 'success',
      message: 'Config game berhasil dicadangkan ke Google Drive & Sheets.',
      fileId: fileId,
      fileUrl: fileUrl
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- 19. PERMANENT ROW DELETION ---
function handlePermanentDelete(data) {
  try {
    var ss = getSpreadsheet(data.sheetId);
    var sheetName = data.sheetName;
    var targetId = data.id;

    if (!sheetName || !targetId) {
      return jsonResponse({ status: 'error', message: 'sheetName dan id wajib diisi' });
    }

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ status: 'error', message: 'Sheet "' + sheetName + '" tidak ditemukan' });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse({ status: 'error', message: 'Sheet kosong' });
    }

    // Default assume ID is at column 1 or 2
    var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var colB = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var rowToDelete = -1;

    for (var i = 0; i < colA.length; i++) {
      if (String(colA[i][0]).trim() === String(targetId).trim()) {
        rowToDelete = i + 2;
        break;
      }
    }

    if (rowToDelete === -1) {
      for (var j = 0; j < colB.length; j++) {
        if (String(colB[j][0]).trim() === String(targetId).trim()) {
          rowToDelete = j + 2;
          break;
        }
      }
    }

    if (rowToDelete > 0) {
      sheet.deleteRow(rowToDelete);
      ensureDashboardOverviewTab(ss);
      return jsonResponse({ status: 'success', message: 'Baris ID ' + targetId + ' berhasil dihapus permanen' });
    }

    return jsonResponse({ status: 'error', message: 'Baris ID ' + targetId + ' tidak ditemukan di sheet' });
  } catch (e) {
    return jsonResponse({ status: 'error', message: e.toString() });
  }
}

// --- 20. GOOGLE CONTACTS & CALENDAR SYNC ---
function handleContactSync(payload, sheetId) {
  try {
    var contacts = Array.isArray(payload) ? payload : (payload.contacts || [payload]);
    var count = 0;
    
    // eslint-disable-next-line no-undef
    if (typeof ContactsApp !== 'undefined') {
      contacts.forEach(function(c) {
        if (c && c.name && (c.phone || c.email)) {
          try {
            // eslint-disable-next-line no-undef
            var existing = ContactsApp.getContactsByName(c.name);
            if (existing.length === 0) {
              // eslint-disable-next-line no-undef
              var newContact = ContactsApp.createContact(c.name.split(' ')[0] || c.name, c.name.split(' ').slice(1).join(' ') || '', c.email || '');
              if (c.phone) {
                var cleanPhone = c.phone.toString().replace(/[^0-9+]/g, '');
                // eslint-disable-next-line no-undef
                newContact.addPhone(ContactsApp.Field.MOBILE_PHONE, cleanPhone);
              }
              count++;
            }
          // eslint-disable-next-line no-empty
          } catch (cErr) {}
        }
      });
    }

    return jsonResponse({ status: 'success', message: 'Google Contacts berhasil disinkronkan', createdCount: count });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleCalendarSync(payload) {
  try {
    // eslint-disable-next-line no-undef
    var cal = CalendarApp.getDefaultCalendar();
    if (!cal) {
      return jsonResponse({ status: 'error', message: 'Google Calendar tidak dapat diakses' });
    }

    var events = Array.isArray(payload) ? payload : (payload.events || [payload]);
    var createdCount = 0;

    events.forEach(function(ev) {
      if (ev && ev.title && ev.date) {
        var d = new Date(ev.date);
        if (!isNaN(d.getTime())) {
          var existing = cal.getEventsForDay(d, { search: ev.title });
          if (existing.length === 0) {
            var event = cal.createAllDayEvent(ev.title, d, {
              description: ev.description || "Dibuat via sumr.day OS",
              location: ev.location || "Studio"
            });
            event.addPopupReminder(1440);
            createdCount++;
          }
        }
      }
    });

    return jsonResponse({ status: 'success', message: 'Google Calendar berhasil disinkronkan', createdCount: createdCount });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- 21. FULL DATABASE BACKUP & RESTORE DENGAN DRIVE COMPRESSION ---
function handleBackup(data) {
  try {
    var payload = data.payload;
    if (!payload) return jsonResponse({ status: 'error', message: 'Payload backup kosong' });

    var folder = getOrCreateFolderPath("Agenze_CMS_Database/Backups");
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    var fileName = "agenze_master_backup_" + timestamp + ".json";
    var contentStr = JSON.stringify(payload, null, 2);

    // eslint-disable-next-line no-undef
    var file = folder.createFile(fileName, contentStr, MimeType.PLAIN_TEXT);
    // eslint-disable-next-line no-undef
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Also update a fixed file for quick single-file restore
    var latestFileIterator = folder.getFilesByName("agenze_master_backup_LATEST.json");
    var latestFile;
    if (latestFileIterator.hasNext()) {
      latestFile = latestFileIterator.next();
      latestFile.setContent(contentStr);
    } else {
      // eslint-disable-next-line no-undef
      latestFile = folder.createFile("agenze_master_backup_LATEST.json", contentStr, MimeType.PLAIN_TEXT);
      // eslint-disable-next-line no-undef
      latestFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    return jsonResponse({
      status: 'success',
      message: 'Master Database berhasil dicadangkan ke Google Drive',
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: fileName,
      sizeBytes: file.getSize(),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Backup gagal: ' + err.toString() });
  }
}

function handleGetBackup(data) {
  try {
    var folder = getOrCreateFolderPath("Agenze_CMS_Database/Backups");
    var fileName = data.fileName || "agenze_master_backup_LATEST.json";
    var files = folder.getFilesByName(fileName);

    if (!files.hasNext()) {
      // Fallback: cari file backup terbaru apapun namanya
      var allFiles = folder.getFiles();
      var newestFile = null;
      var newestDate = new Date(0);
      while (allFiles.hasNext()) {
        var f = allFiles.next();
        if (f.getName().indexOf("agenze_master_backup_") > -1) {
          if (f.getLastUpdated() > newestDate) {
            newestDate = f.getLastUpdated();
            newestFile = f;
          }
        }
      }
      if (newestFile) {
        var contentStrFallback = newestFile.getBlob().getDataAsString();
        return jsonResponse({
          status: 'success',
          fileName: newestFile.getName(),
          updatedAt: newestFile.getLastUpdated().toISOString(),
          data: JSON.parse(contentStrFallback)
        });
      }
      return jsonResponse({ status: 'error', message: 'File backup belum tersedia di Google Drive' });
    }

    var file = files.next();
    var contentStr = file.getBlob().getDataAsString();
    return jsonResponse({
      status: 'success',
      fileName: fileName,
      updatedAt: file.getLastUpdated().toISOString(),
      data: JSON.parse(contentStr)
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Restore gagal: ' + err.toString() });
  }
}

function handleGetStorageStats(data) {
  try {
    var rootFolder = getOrCreateFolderPath("Agenze_CMS_Database");
    var totalBytes = 0;
    var fileCount = 0;

    function countFolder(folder) {
      var files = folder.getFiles();
      while (files.hasNext()) {
        var f = files.next();
        totalBytes += f.getSize();
        fileCount++;
      }
      var subFolders = folder.getFolders();
      while (subFolders.hasNext()) {
        countFolder(subFolders.next());
      }
    }

    countFolder(rootFolder);

    // eslint-disable-next-line no-undef
    var storageLimitBytes = 15 * 1024 * 1024 * 1024; // 15 GB free tier
    var usedMb = (totalBytes / (1024 * 1024)).toFixed(2);

    return jsonResponse({
      status: 'success',
      totalBytes: totalBytes,
      usedMb: parseFloat(usedMb),
      totalFiles: fileCount,
      freeTierLimitGb: 15,
      folderRootName: "Agenze_CMS_Database",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleCleanupBackups(data) {
  try {
    var keepCount = data.keepCount || 5;
    var folder = getOrCreateFolderPath("Agenze_CMS_Database/Backups");
    var files = folder.getFiles();
    var backupList = [];

    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName();
      if (name.indexOf("agenze_master_backup_20") > -1) {
        backupList.push({
          file: f,
          updated: f.getLastUpdated().getTime(),
          name: name
        });
      }
    }

    backupList.sort(function(a, b) {
      return b.updated - a.updated;
    });

    var deletedCount = 0;
    for (var i = keepCount; i < backupList.length; i++) {
      backupList[i].file.setTrashed(true);
      deletedCount++;
    }

    return jsonResponse({
      status: 'success',
      message: 'Pembersihan backup selesai. ' + deletedCount + ' file lama dipindahkan ke Sampah.',
      remainingBackups: Math.min(backupList.length, keepCount)
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- 22. DUAL-VAULT PARTITION SYNC (HEMAT KUOTA & CEPAT) ---
function handleSyncPartition(data) {
  try {
    var partition = data.partition || 'general';
    var payload = data.payload;
    if (!payload) return jsonResponse({ status: 'error', message: 'Payload partisi kosong' });

    var folder = getOrCreateFolderPath("Agenze_CMS_Database/Partitions");
    var fileName = "drive_db_" + partition + ".json";
    var contentStr = JSON.stringify(payload, null, 2);

    var files = folder.getFilesByName(fileName);
    var file;
    if (files.hasNext()) {
      file = files.next();
      file.setContent(contentStr);
    } else {
      // eslint-disable-next-line no-undef
      file = folder.createFile(fileName, contentStr, MimeType.PLAIN_TEXT);
      // eslint-disable-next-line no-undef
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    return jsonResponse({
      status: 'success',
      partition: partition,
      fileName: fileName,
      fileId: file.getId(),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleGetPartition(data) {
  try {
    var partition = data.partition || 'general';
    var folder = getOrCreateFolderPath("Agenze_CMS_Database/Partitions");
    var fileName = "drive_db_" + partition + ".json";

    var files = folder.getFilesByName(fileName);
    if (!files.hasNext()) {
      return jsonResponse({ status: 'error', message: 'Partisi "' + partition + '" belum tersimpan di Drive' });
    }

    var file = files.next();
    var contentStr = file.getBlob().getDataAsString();
    var parsed = JSON.parse(contentStr);
    
    return jsonResponse({
      status: 'success',
      partition: partition,
      fileName: fileName,
      updatedAt: file.getLastUpdated().toISOString(),
      data: parsed
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- 23. PLATFORM CONFIG & GENERIC SPREADSHEET READERS ---
function handleGetPlatformConfig(data) {
  var ss = getSpreadsheet(data.sheetId);
  var sheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
  var rows = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < rows.length; i++) {
    config[rows[i][0]] = rows[i][1];
  }
  return jsonResponse({ status: 'success', config: config });
}

function handleUpdatePlatformConfig(data) {
  var ss = getSpreadsheet(data.sheetId);
  var sheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
  sheet.clear();
  sheet.appendRow(['Key', 'Value']);
  var payload = data.payload || {};
  for (var key in payload) {
    sheet.appendRow([key, payload[key]]);
  }
  return jsonResponse({ status: 'success' });
}

function getGenericSheet(sheetName, keys, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) return jsonResponse({ status: 'success', data: [] });
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse({ status: 'success', data: [] });
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < keys.length; j++) {
      obj[keys[j]] = row[j] || "";
    }
    result.push(obj);
  }
  return jsonResponse({ status: 'success', data: result });
}

// --- 24. WHATSAPP NOTIFICATION BRIDGE ---
function handleSendWhatsAppNotification(payload) {
  try {
    var phone = payload.phone;
    var message = payload.message;
    var gatewayUrl = payload.gatewayUrl;
    var apiKey = payload.apiKey;

    if (!phone || !message) {
      return jsonResponse({ status: 'error', message: 'Nomor telepon dan pesan wajib diisi' });
    }

    if (gatewayUrl) {
      // eslint-disable-next-line no-undef
      var options = {
        method: 'post',
        contentType: 'application/json',
        headers: apiKey ? { 'Authorization': apiKey } : {},
        payload: JSON.stringify({
          target: phone,
          message: message,
          phone: phone
        }),
        muteHttpExceptions: true
      };
      // eslint-disable-next-line no-undef
      var res = UrlFetchApp.fetch(gatewayUrl, options);
      return jsonResponse({ status: 'success', message: 'WhatsApp webhook terkirim', response: res.getContentText() });
    }

    var cleanPhone = phone.toString().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    return jsonResponse({
      status: 'success',
      message: 'Notifikasi siap dikirim via WhatsApp',
      waLink: 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message)
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal kirim notifikasi WhatsApp: ' + e.toString() });
  }
}
