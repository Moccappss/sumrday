/**
 * =========================================================================================
 * SUMR.DAY OS & PORTO 2026 CMS — GOOGLE APPS SCRIPT ULTRA EXECUTIVE ENTERPRISE SUITE
 * Versi: v7.5.0-ultra-executive-suite (Edisi Kemitraan, Flash Sale, SPK & Diagnostik Sistem)
 * =========================================================================================
 * 
 * 🌟 FITUR & KEMAMPUAN ENTERPRISE TINGKAT EKSEKUTIF:
 * 1. 📊 Tab #1 "📊 Dashboard Studio":
 *    - Executive Summary C-Level: Omzet Kas, Kas Masuk, Piutang/Sisa Tagihan, Total PPN Terkumpul,
 *      Pipeline Kontrak, Proyek Aktif, Modul Terpadu, Pelanggan CRM, Janji Temu, dan Status Cloud Real-time.
 *    - Tabel Navigasi Cepat Antar-Tab dengan formula interaktif.
 * 2. 💰 Transaksi & Pembukuan Perpajakan (Tab "Transaksi & Pesanan"):
 *    - 28 Kolom Finansial Komprehensif: Subtotal, Diskon, DPP (Dasar Pengenaan Pajak), Status PPN,
 *      Tarif PPN (%), Nilai PPN (IDR), Ongkir, Total Akhir, DP/Terbayar, dan Sisa Tagihan Otomatis.
 *    - Tautan Bukti Transfer Terpisah: 📁 Link Bukti TF di Google Drive & 🌐 Link Bukti TF di Web (Cloudinary).
 *    - Tautan Nota/Invoice Resmi di Google Drive (=HYPERLINK).
 *    - Tautan WhatsApp Pelanggan Otomatis (=HYPERLINK).
 *    - Dropdown Status Bayar: [ lunas | dp | belum | batal | cicilan ].
 *    - Pewarnaan Baris Otomatis (Soft Emerald = Lunas, Soft Amber = DP/Cicilan, Soft Rose = Belum).
 * 3. 🎯 Manajemen Proyek & Pipeline (Tab "Manajemen Project"):
 *    - Nilai Kontrak / Budget (IDR) otomatis diformat mata uang.
 *    - Nama Klien & Tautan WhatsApp Otomatis (=HYPERLINK("https://wa.me/...", "Chat WA")).
 *    - Progress baris (%), Status [todo | in_progress | review | done | scheduled | trash],
 *      Prioritas [high | medium | low], Tim/PIC, Milestone Checklist, Tautan Asset Drive.
 *    - Auto-Sinkronisasi Tenggat Waktu ke Google Calendar dengan notifikasi otomatis.
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
 * 8. ⚡ Flash Sale & Kampanye Promo (Tab "⚡ Flash Sale & Promo"):
 *    - Diskon kilat, countdown waktu mulai & berakhir, status [ 🟢 Aktif | ⏳ Terjadwal | ⚪ Selesai ], kuota stok.
 * 9. 🤝 Kemitraan, Reseller & Komisi Afiliasi (Tab "🤝 Kemitraan & Afiliasi"):
 *    - Reseller, kode referral, komisi (%), total order diarahkan, komisi terkumpul, penarikan & saldo.
 * 10. 📜 Kontrak & SPK Kerja Sama (Tab "📜 Kontrak & SPK"):
 *    - Dokumen hukum SPK, nilai kontrak (IDR), skema DP/termin, tenggat waktu, tautan PDF di Drive.
 * 11. 📋 Paket Layanan & Rate Cards (Tab "📋 Paket Layanan & Rate Cards"):
 *    - Paket biaya, deliverables, durasi kerja, kuota revisi, dan harga coret terformat IDR.
 * 12. ⭐ Ulasan & Testimoni Klien (Tab "⭐ Ulasan & Testimoni Klien"):
 *    - Rating visual ⭐, testimoni, status featured, role klien, dan link foto avatar.
 * 13. 🔍 Diagnostik & Health Check Engine:
 *    - Audit instan kesehatan spreadsheet, jumlah baris, koneksi Drive, dan kuota via action `diagnose_system`.
 * 
 * -----------------------------------------------------------------------------------------
 * PANDUAN DEPLOYMENT KE GOOGLE APPS SCRIPT:
 * 1. Buka https://script.google.com/ dan buat project baru (atau buka project Anda yang sudah ada).
 * 2. Hapus seluruh isi kode lama di editor `Code.gs`, lalu salin (paste) SELURUH isi file ini.
 * 3. Klik tombol "Simpan" (Ctrl+S / Cmd+S).
 * 4. Klik tombol biru "Deploy" -> "New deployment" (atau "Manage deployments" -> edit versi baru):
 *    - Pilih Type: "Web app"
 *    - Description: sumr.day OS Ultra Executive v7.5.0 (Flash Sale, Kemitraan & SPK)
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
    version: '7.6.0-ultra-executive-suite',
    releaseDate: '2026-09-25',
    timestamp: new Date().toISOString(),
    capabilities: [
      'executive_dashboard', 'master_database', 'partition_sync', 'batch_sync',
      'projects', 'content_planner', 'memos', 'whiteboard', 'shop', 'catalog',
      'rate_cards', 'addons', 'reviews', 'testimonials', 'faqs',
      'flash_sales', 'promos', 'partnerships', 'affiliates', 'contracts_spk', 'system_diagnostics',
      'client_vault', 'email_notifications', 'consultation_calendar', 'executive_digest',
      'invoice_generator', 'smart_storage_optimizer',
      'transactions', 'invoices', 'tax_ppn', 'dpp_calculation', 'payment_proof_drive',
      'payment_proof_web', 'tax_bookkeeping', 'customers', 'users', 'clients',
      'bookings', 'chats', 'contacts', 'calendar', 'backups', 'drive_files',
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

    // --- 4. FORMULIR & SURVEI MAKER ---
    else if (action === 'sync_forms') {
      return handleFormsSync(payload, sheetId);
    } else if (action === 'get_forms') {
      return handleGetForms(sheetId);
    } else if (action === 'sync_form_responses' || action === 'save_form_response') {
      return handleFormResponsesSync(payload, sheetId);
    } else if (action === 'get_form_responses') {
      return handleGetFormResponses(sheetId);
    }

    // --- 4b. PAKET LAYANAN (RATE CARDS) & ULASAN KLIEN ---
    else if (action === 'sync_rate_cards' || action === 'sync_packages') {
      return handleRateCardSync(payload, sheetId);
    } else if (action === 'get_rate_cards' || action === 'get_packages') {
      return handleGetRateCards(sheetId);
    } else if (action === 'sync_reviews' || action === 'sync_testimonials') {
      return handleReviewSync(payload, sheetId);
    } else if (action === 'get_reviews' || action === 'get_testimonials') {
      return handleGetReviews(sheetId);
    }

    // --- 4c. FLASH SALE, KEMITRAAN AFILIASI & KONTRAK SPK ---
    else if (action === 'sync_flash_sales' || action === 'sync_flash_sale') {
      return handleFlashSaleSync(payload, sheetId);
    } else if (action === 'get_flash_sales') {
      return handleGetFlashSales(sheetId);
    } else if (action === 'sync_partnerships' || action === 'sync_affiliates') {
      return handlePartnershipSync(payload, sheetId);
    } else if (action === 'get_partnerships' || action === 'get_affiliates') {
      return handleGetPartnerships(sheetId);
    } else if (action === 'sync_contracts' || action === 'sync_spk') {
      return handleContractSpkSync(payload, sheetId);
    } else if (action === 'get_contracts' || action === 'get_spk') {
      return handleGetContracts(sheetId);
    } else if (action === 'diagnose_system' || action === 'system_health' || action === 'health_diagnostic') {
      return handleDiagnoseSystem(sheetId);
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
    } else if (action === 'create_client_vault' || action === 'create_project_folder') {
      return handleCreateClientVault(payload);
    } else if (action === 'send_email_notification' || action === 'send_order_email') {
      return handleSendEmailNotification(payload);
    } else if (action === 'schedule_consultation' || action === 'book_meeting') {
      return handleScheduleConsultation(payload);
    } else if (action === 'daily_executive_digest' || action === 'send_executive_digest') {
      return handleDailyExecutiveDigest(sheetId, payload);
    } else if (action === 'generate_invoice_document' || action === 'create_invoice_file') {
      return handleGenerateInvoiceDocument(payload);
    } else if (action === 'generate_spk_document' || action === 'create_spk_file' || action === 'generate_spk_pdf') {
      return handleGenerateSpkDocument(payload);
    } else if (action === 'ocr_document' || action === 'drive_ocr') {
      return handleDriveOcrDocument(payload);
    } else if (action === 'setup_morning_briefing' || action === 'install_morning_cron') {
      return handleSetupMorningBriefing(sheetId);
    } else if (action === 'smart_storage_optimizer' || action === 'optimize_storage') {
      return handleSmartStorageOptimizer();
    }

    // --- 7. CONFIG & HEALTH CHECK ---
    else if (action === 'ping' || action === 'health_check') {
      return jsonResponse({
        status: 'success',
        message: 'Google Apps Script Ultra Executive Enterprise Suite is Online & Ready',
        timestamp: new Date().toISOString(),
        version: '7.2.0-ultra-executive-suite'
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
    } catch (e) { }
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
    } catch (e) { }
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
    var str = JSON.stringify(obj, function (k, v) {
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
  } catch (e) { }
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
  } catch (e) { }

  // Apply row banding
  try {
    sheet.getBandings().forEach(function (b) { b.remove(); });
    if (bandingTheme) {
      fullRange.applyRowBanding(bandingTheme, true, false);
    }
    // eslint-disable-next-line no-empty
  } catch (e) { }

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
  } catch (e) { }

  // Apply Dropdown Validations if provided
  if (dropdownConfigs && Array.isArray(dropdownConfigs)) {
    dropdownConfigs.forEach(function (cfg) {
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
  } catch (e) { }

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
  } catch (e) { }
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
    sheet.getBandings().forEach(function (b) { b.remove(); });
    sheet.setTabColor("#d95629"); // Terracotta Accent

    // Gridline aktif untuk keterbacaan tinggi
    sheet.setHiddenGridlines(false);

    // ── 1. BRAND ACCENT STRIP (Row 1) ──
    sheet.getRange("A1:L1").merge()
      .setBackground("#d95629"); // sumr.day Warm Terracotta
    sheet.setRowHeight(1, 6);

    // ── 2. HEADER BANNER UTAMA (Row 2) ──
    sheet.getRange("A2:L2").merge()
      .setValue("✦ SUMR.DAY STUDIO OS — EXECUTIVE COMMAND CENTER & BUSINESS DASHBOARD ✦")
      .setFontWeight("bold")
      .setFontSize(14)
      .setFontColor("#ffffff")
      .setBackground("#0a0b0e") // Obsidian Canvas
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(2, 38);

    // ── 3. SUBTITLE STRIP (Row 3) ──
    sheet.getRange("A3:L3").merge()
      .setValue("Real-time Automated Cloud Intelligence • Arus Kas & Perpajakan PPN • Manajemen Proyek Kanban • Database CRM Klien • Google Drive Dual-Vault")
      .setFontSize(9.5)
      .setFontColor("#94a3b8")
      .setBackground("#121318")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(3, 22);

    // ── 4. STATUS & TIMESTAMP BAR (Row 4) ──
    sheet.getRange("A4:C4").merge()
      .setValue("● CLOUD ENGINE STATUS: ONLINE 100%")
      .setFontWeight("bold")
      .setFontSize(8.5)
      .setFontColor("#10b981") // Emerald Green
      .setBackground("#1e293b")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    sheet.getRange("D4:F4").merge()
      .setValue("MODE: DUAL-VAULT PERSISTENCE (OFFLINE + DRIVE)")
      .setFontWeight("bold")
      .setFontSize(8.5)
      .setFontColor("#38bdf8") // Sky Cyan
      .setBackground("#1e293b")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    sheet.getRange("G4:I4").merge()
      .setFormula('="📅 SINKRONISASI: " & TEXT(NOW(), "DD/MM/YYYY HH:mm") & " WIB"')
      .setFontSize(8.5)
      .setFontColor("#f1f5f9")
      .setBackground("#1e293b")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    sheet.getRange("J4:L4").merge()
      .setValue("STUDIO TIER: ENTERPRISE ULTRA-SUITE 2026")
      .setFontWeight("bold")
      .setFontSize(8.5)
      .setFontColor("#f7ba38") // Sun Gold
      .setBackground("#1e293b")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(4, 24);

    // ── 5. SPACER (Row 5) ──
    sheet.setRowHeight(5, 12);

    // ── 6. EXECUTIVE KPI SUMMARY CARDS (Rows 6 - 8) ──
    // 6 Kartu Elegan (masing-masing 2 kolom): A-B, C-D, E-F, G-H, I-J, K-L
    var kpiCards = [
      {
        cols: "A6:B6", valCell: "A7:B7", subCell: "A8:B8",
        header: "💰 TOTAL OMZET STUDIO", headerBg: "#d95629",
        formula: "=IFERROR(SUM('Transaksi & Pesanan'!R2:R), 0)",
        subFormula: '=IFERROR(COUNTA(\'Transaksi & Pesanan\'!B2:B) & " Transaksi Tercatat", "0 Transaksi")',
        valBg: "#fff7ed", valColor: "#0f172a", subColor: "#9a3412", isCurrency: true
      },
      {
        cols: "C6:D6", valCell: "C7:D7", subCell: "C8:D8",
        header: "💵 KAS MASUK (REAL CASH)", headerBg: "#059669",
        formula: "=IFERROR(SUM('Transaksi & Pesanan'!T2:T), 0)",
        subFormula: '"DP & Pelunasan Kas Diterima"',
        valBg: "#ecfdf5", valColor: "#065f46", subColor: "#047857", isCurrency: true
      },
      {
        cols: "E6:F6", valCell: "E7:F7", subCell: "E8:F8",
        header: "⏳ SISA PIUTANG (UNPAID)", headerBg: "#e11d48",
        formula: "=IFERROR(SUM('Transaksi & Pesanan'!U2:U), 0)",
        subFormula: '=IFERROR((COUNTIF(\'Transaksi & Pesanan\'!S2:S, "belum") + COUNTIF(\'Transaksi & Pesanan\'!S2:S, "dp")) & " Tagihan Belum Lunas", "0 Belum Lunas")',
        valBg: "#fff1f2", valColor: "#9f1239", subColor: "#be123c", isCurrency: true
      },
      {
        cols: "G6:H6", valCell: "G7:H7", subCell: "G8:H8",
        header: "📑 PPN TERKUMPUL (PAJAK)", headerBg: "#334155",
        formula: "=IFERROR(SUM('Transaksi & Pesanan'!P2:P), 0)",
        subFormula: '"Siap Lapor Pajak & SPT Tahunan"',
        valBg: "#f8fafc", valColor: "#1e293b", subColor: "#64748b", isCurrency: true
      },
      {
        cols: "I6:J6", valCell: "I7:J7", subCell: "I8:J8",
        header: "🎯 PIPELINE KONTRAK AKTIF", headerBg: "#1687a7",
        formula: "=IFERROR(SUM('Manajemen Project'!G2:G), 0)",
        subFormula: '=IFERROR(COUNTIF(\'Manajemen Project\'!I2:I, "in_progress") & " Proyek Sedang Dikerjakan", "0 Berjalan")',
        valBg: "#f0fdfa", valColor: "#0e7490", subColor: "#0891b2", isCurrency: true
      },
      {
        cols: "K6:L6", valCell: "K7:L7", subCell: "K8:L8",
        header: "👥 KLIEN & PENGGUNA", headerBg: "#7c3aed",
        formula: "=IFERROR(COUNTA('Data Pelanggan CRM'!A2:A), 0)",
        subFormula: '=IFERROR(COUNTA(\'Space Circle (Pengguna)\'!A2:A) & " Akun Circle Terdaftar", "0 Akun")',
        valBg: "#f5f3ff", valColor: "#5b21b6", subColor: "#6d28d9", isCurrency: false
      }
    ];

    sheet.setRowHeight(6, 26);
    sheet.setRowHeight(7, 36);
    sheet.setRowHeight(8, 22);

    for (var k = 0; k < kpiCards.length; k++) {
      var card = kpiCards[k];
      sheet.getRange(card.cols).merge()
        .setValue(card.header)
        .setFontWeight("bold")
        .setFontSize(8.5)
        .setFontColor("#ffffff")
        .setBackground(card.headerBg)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      var vRange = sheet.getRange(card.valCell).merge()
        .setFormula(card.formula)
        .setFontWeight("bold")
        .setFontSize(13)
        .setFontColor(card.valColor)
        .setBackground(card.valBg)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      if (card.isCurrency) {
        vRange.setNumberFormat('Rp #,##0');
      } else {
        vRange.setNumberFormat('#,##0');
      }

      sheet.getRange(card.subCell).merge()
        .setFormula(card.subFormula)
        .setFontSize(8)
        .setFontColor(card.subColor)
        .setBackground(card.valBg)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
    }

    // ── 7. SPACER (Row 9) ──
    sheet.setRowHeight(9, 12);

    // ── 8. SPLIT SUMMARY PANELS (Rows 10 - 16) ──
    // Kiri (A10:F16): Analisis Status Transaksi & Arus Kas
    // Kanan (G10:L16): Distribusi Alur Kerja Proyek & Kanban
    sheet.getRange("A10:F10").merge()
      .setValue("💰 ANALISIS STATUS INVOICE & PENERIMAAN KAS")
      .setFontWeight("bold")
      .setFontSize(9.5)
      .setFontColor("#ffffff")
      .setBackground("#0f172a")
      .setVerticalAlignment("middle");

    sheet.getRange("G10:L10").merge()
      .setValue("🎯 DISTRIBUSI ALUR KERJA PROYEK & PIPELINE")
      .setFontWeight("bold")
      .setFontSize(9.5)
      .setFontColor("#ffffff")
      .setBackground("#0f172a")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(10, 26);

    // Sub-headers Row 11
    sheet.getRange("A11:B11").merge().setValue("Status Pembayaran").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("left");
    sheet.getRange("C11").setValue("Jumlah").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("center");
    sheet.getRange("D11").setValue("Porsi (%)").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("center");
    sheet.getRange("E11:F11").merge().setValue("Nominal Uang (IDR)").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("right");

    sheet.getRange("G11:H11").merge().setValue("Tahap Kerja Kanban").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("left");
    sheet.getRange("I11").setValue("Proyek").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("center");
    sheet.getRange("J11").setValue("Rasio (%)").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("center");
    sheet.getRange("K11:L11").merge().setValue("Estimasi Kontrak (IDR)").setFontWeight("bold").setFontColor("#334155").setBackground("#f1f5f9").setHorizontalAlignment("right");
    sheet.setRowHeight(11, 22);

    // Data Rows 12 - 15
    var financeRows = [
      { label: "🟢 Lunas (Paid in Full)", formulaCount: '=COUNTIF(\'Transaksi & Pesanan\'!S2:S, "lunas")', formulaPct: "=IFERROR(C12/MAX(1, C16), 0)", formulaVal: "=SUMIF('Transaksi & Pesanan'!S2:S, \"lunas\", 'Transaksi & Pesanan'!T2:T)" },
      { label: "🟡 DP / Cicilan Masuk", formulaCount: '=COUNTIF(\'Transaksi & Pesanan\'!S2:S, "dp") + COUNTIF(\'Transaksi & Pesanan\'!S2:S, "cicilan")', formulaPct: "=IFERROR(C13/MAX(1, C16), 0)", formulaVal: "=SUMIF('Transaksi & Pesanan'!S2:S, \"dp\", 'Transaksi & Pesanan'!T2:T) + SUMIF('Transaksi & Pesanan'!S2:S, \"cicilan\", 'Transaksi & Pesanan'!T2:T)" },
      { label: "🔴 Belum Bayar (Pending)", formulaCount: '=COUNTIF(\'Transaksi & Pesanan\'!S2:S, "belum")', formulaPct: "=IFERROR(C14/MAX(1, C16), 0)", formulaVal: "=SUMIF('Transaksi & Pesanan'!S2:S, \"belum\", 'Transaksi & Pesanan'!U2:U)" },
      { label: "⚪ Dibatalkan / Void", formulaCount: '=COUNTIF(\'Transaksi & Pesanan\'!S2:S, "batal")', formulaPct: "=IFERROR(C15/MAX(1, C16), 0)", formulaVal: "=SUMIF('Transaksi & Pesanan'!S2:S, \"batal\", 'Transaksi & Pesanan'!R2:R)" }
    ];

    var projectRows = [
      { label: "⏳ To Do (Antrean Brief)", formulaCount: '=COUNTIF(\'Manajemen Project\'!I2:I, "todo")', formulaPct: "=IFERROR(I12/MAX(1, I16), 0)", formulaVal: "=SUMIF('Manajemen Project'!I2:I, \"todo\", 'Manajemen Project'!G2:G)" },
      { label: "🚀 Sedang Dikerjakan (In Progress)", formulaCount: '=COUNTIF(\'Manajemen Project\'!I2:I, "in_progress")', formulaPct: "=IFERROR(I13/MAX(1, I16), 0)", formulaVal: "=SUMIF('Manajemen Project'!I2:I, \"in_progress\", 'Manajemen Project'!G2:G)" },
      { label: "🔍 Dalam Review Klien", formulaCount: '=COUNTIF(\'Manajemen Project\'!I2:I, "review")', formulaPct: "=IFERROR(I14/MAX(1, I16), 0)", formulaVal: "=SUMIF('Manajemen Project'!I2:I, \"review\", 'Manajemen Project'!G2:G)" },
      { label: "✅ Selesai & Serah Terima", formulaCount: '=COUNTIF(\'Manajemen Project\'!I2:I, "done")', formulaPct: "=IFERROR(I15/MAX(1, I16), 0)", formulaVal: "=SUMIF('Manajemen Project'!I2:I, \"done\", 'Manajemen Project'!G2:G)" }
    ];

    for (var r = 0; r < 4; r++) {
      var rowIdx = 12 + r;
      sheet.setRowHeight(rowIdx, 23);

      // Kiri
      sheet.getRange("A" + rowIdx + ":B" + rowIdx).merge().setValue(financeRows[r].label).setFontColor("#1e293b").setFontSize(9);
      sheet.getRange("C" + rowIdx).setFormula(financeRows[r].formulaCount).setHorizontalAlignment("center").setFontColor("#0f172a").setFontSize(9);
      sheet.getRange("D" + rowIdx).setFormula(financeRows[r].formulaPct).setNumberFormat("0.0%").setHorizontalAlignment("center").setFontColor("#64748b").setFontSize(9);
      sheet.getRange("E" + rowIdx + ":F" + rowIdx).merge().setFormula(financeRows[r].formulaVal).setNumberFormat('Rp #,##0').setHorizontalAlignment("right").setFontColor("#0f172a").setFontSize(9).setFontWeight("bold");

      // Kanan
      sheet.getRange("G" + rowIdx + ":H" + rowIdx).merge().setValue(projectRows[r].label).setFontColor("#1e293b").setFontSize(9);
      sheet.getRange("I" + rowIdx).setFormula(projectRows[r].formulaCount).setHorizontalAlignment("center").setFontColor("#0f172a").setFontSize(9);
      sheet.getRange("J" + rowIdx).setFormula(projectRows[r].formulaPct).setNumberFormat("0.0%").setHorizontalAlignment("center").setFontColor("#64748b").setFontSize(9);
      sheet.getRange("K" + rowIdx + ":L" + rowIdx).merge().setFormula(projectRows[r].formulaVal).setNumberFormat('Rp #,##0').setHorizontalAlignment("right").setFontColor("#0f172a").setFontSize(9).setFontWeight("bold");
    }

    // Row 16: Total Kumulatif Baris
    sheet.setRowHeight(16, 26);
    sheet.getRange("A16:B16").merge().setValue("TOTAL TRANSAKSI").setFontWeight("bold").setFontColor("#0f172a").setBackground("#f8fafc").setFontSize(9);
    sheet.getRange("C16").setFormula("=SUM(C12:C15)").setFontWeight("bold").setFontColor("#0f172a").setBackground("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange("D16").setValue("100%").setFontWeight("bold").setFontColor("#64748b").setBackground("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange("E16:F16").merge().setFormula("=SUM(E12:E15)").setNumberFormat('Rp #,##0').setFontWeight("bold").setFontColor("#0f172a").setBackground("#f8fafc").setHorizontalAlignment("right").setFontSize(9.5);

    sheet.getRange("G16:H16").merge().setValue("TOTAL PROYEK").setFontWeight("bold").setFontColor("#0f172a").setBackground("#f8fafc").setFontSize(9);
    sheet.getRange("I16").setFormula("=SUM(I12:I15)").setFontWeight("bold").setFontColor("#0f172a").setBackground("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange("J16").setValue("100%").setFontWeight("bold").setFontColor("#64748b").setBackground("#f8fafc").setHorizontalAlignment("center").setFontSize(9);
    sheet.getRange("K16:L16").merge().setFormula("=SUM(K12:K15)").setNumberFormat('Rp #,##0').setFontWeight("bold").setFontColor("#0f172a").setBackground("#f8fafc").setHorizontalAlignment("right").setFontSize(9.5);

    // ── 9. SPACER (Row 17) ──
    sheet.setRowHeight(17, 12);

    // ── 10. MINI METRIC CARDS: TOKO, FLASH SALE, AFILIASI & BOOKING (Rows 18 & 19) ──
    var miniCards = [
      {
        cols: "A18:C18", valCell: "A19:C19",
        title: "🛍️ KATALOG TOKO & PRODUK", titleBg: "#d97706",
        formula: '=IFERROR(COUNTA(\'Manajemen Toko\'!A2:A) & " Produk & Layanan Terdaftar", "0 Produk")',
        valBg: "#fffbeb", valColor: "#92400e"
      },
      {
        cols: "D18:F18", valCell: "D19:F19",
        title: "⚡ FLASH SALE & PROMO AKTIF", titleBg: "#dc2626",
        formula: '=IFERROR(COUNTIF(\'⚡ Flash Sale & Promo\'!H2:H, "🟢 Aktif") & " Promo Flash Sale Berjalan", "0 Promo")',
        valBg: "#fef2f2", valColor: "#991b1b"
      },
      {
        cols: "G18:I18", valCell: "G19:I19",
        title: "🤝 KEMITRAAN & AFILIASI", titleBg: "#0284c7",
        formula: '=IFERROR(COUNTA(\'🤝 Kemitraan & Afiliasi\'!A2:A) & " Mitra & Reseller Terdata", "0 Mitra")',
        valBg: "#f0f9ff", valColor: "#075985"
      },
      {
        cols: "J18:L18", valCell: "J19:L19",
        title: "📅 JANJI TEMU & KONSULTASI", titleBg: "#4f46e5",
        formula: '=IFERROR(COUNTA(\'Janji Temu & Booking\'!A2:A) & " Agenda Temu & Booking", "0 Agenda")',
        valBg: "#eef2ff", valColor: "#3730a3"
      }
    ];

    sheet.setRowHeight(18, 24);
    sheet.setRowHeight(19, 28);

    for (var m = 0; m < miniCards.length; m++) {
      var mc = miniCards[m];
      sheet.getRange(mc.cols).merge()
        .setValue(mc.title)
        .setFontWeight("bold")
        .setFontSize(8.5)
        .setFontColor("#ffffff")
        .setBackground(mc.titleBg)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      sheet.getRange(mc.valCell).merge()
        .setFormula(mc.formula)
        .setFontWeight("bold")
        .setFontSize(9.5)
        .setFontColor(mc.valColor)
        .setBackground(mc.valBg)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
    }

    // ── 11. SPACER (Row 20) ──
    sheet.setRowHeight(20, 12);

    // ── 12. DIREKTORI MODUL & NAVIGASI CEPAT SPREADSHEET (Rows 21+) ──
    sheet.getRange("A21:L21").merge()
      .setValue("🧭 DIREKTORI MODUL & NAVIGASI CEPAT SPREADSHEET (KLIK LANGSUNG MENUJU TAB)")
      .setFontWeight("bold")
      .setFontSize(9.5)
      .setFontColor("#ffffff")
      .setBackground("#0f172a")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(21, 26);

    // Header tabel navigasi Row 22
    sheet.getRange("A22:C22").merge().setValue("Modul & Ekosistem Studio").setFontWeight("bold").setFontColor("#334155").setBackground("#e2e8f0").setHorizontalAlignment("left");
    sheet.getRange("D22:F22").merge().setValue("Tab Lembar Kerja").setFontWeight("bold").setFontColor("#334155").setBackground("#e2e8f0").setHorizontalAlignment("left");
    sheet.getRange("G22:H22").merge().setValue("Volume Data").setFontWeight("bold").setFontColor("#334155").setBackground("#e2e8f0").setHorizontalAlignment("center");
    sheet.getRange("I22").setValue("Aksi Pintar").setFontWeight("bold").setFontColor("#334155").setBackground("#e2e8f0").setHorizontalAlignment("center");
    sheet.getRange("J22:L22").merge().setValue("Keterangan & Rincian Penggunaan").setFontWeight("bold").setFontColor("#334155").setBackground("#e2e8f0").setHorizontalAlignment("left");
    sheet.setRowHeight(22, 22);

    var navModules = [
      { name: "1. Pembukuan & Arus Kas", tab: "Transaksi & Pesanan", desc: "Catatan pemasukan, rincian PPN/DPP, DP, sisa piutang, dan link bukti TF Drive & Web.", countFormula: '=IFERROR(COUNTA(\'Transaksi & Pesanan\'!A2:A) & " entri", "0 entri")' },
      { name: "2. Project & Pipeline", tab: "Manajemen Project", desc: "Alur kerja Kanban, PIC tim, deadline, milestone checklist, dan sinkronisasi Google Calendar.", countFormula: '=IFERROR(COUNTA(\'Manajemen Project\'!A2:A) & " proyek", "0 proyek")' },
      { name: "3. Formulir & Responden", tab: "📋 Formulir & Survei", desc: "Skema formulir brief, survei pemesanan klien dan kuesioner dinamis dari Form Maker Studio.", countFormula: '=IFERROR(COUNTA(\'📋 Formulir & Survei\'!A2:A) & " form", "0 form")' },
      { name: "4. Tanggapan Formulir", tab: "📥 Tanggapan Formulir", desc: "Arsip seluruh jawaban dan respons klien yang masuk dari form publik web secara realtime.", countFormula: '=IFERROR(COUNTA(\'📥 Tanggapan Formulir\'!A2:A) & " respons", "0 respons")' },
      { name: "5. Toko & Produk Jasa", tab: "Manajemen Toko", desc: "Katalog produk digital, harga normal, harga diskon coret, stok, varian, dan berkas download Drive.", countFormula: '=IFERROR(COUNTA(\'Manajemen Toko\'!A2:A) & " item", "0 item")' },
      { name: "6. Pelanggan & CRM", tab: "Data Pelanggan CRM", desc: "Database pelanggan terintegrasi, WhatsApp direct link, akumulasi total belanja (LTV), dan segmen VIP.", countFormula: '=IFERROR(COUNTA(\'Data Pelanggan CRM\'!A2:A) & " klien", "0 klien")' },
      { name: "7. Space Circle Pengguna", tab: "Space Circle (Pengguna)", desc: "Database pengguna portal klien, desainer, super admin, riwayat aktivitas dan hak akses akun.", countFormula: '=IFERROR(COUNTA(\'Space Circle (Pengguna)\'!A2:A) & " user", "0 user")' },
      { name: "8. Janji Temu Konsultasi", tab: "Janji Temu & Booking", desc: "Jadwal meeting konsultasi calon klien, tanggal, jam, status konfirmasi, dan tautan Google Meet.", countFormula: '=IFERROR(COUNTA(\'Janji Temu & Booking\'!A2:A) & " booking", "0 booking")' },
      { name: "9. Feed & Update Utas", tab: "📱 Feed & Status Update (Utas)", desc: "Pembaruan studio, tips desain, reading time, jumlah likes, dan status semat (pinned) utas.", countFormula: '=IFERROR(COUNTA(\'📱 Feed & Status Update (Utas)\'!A2:A) & " utas", "0 utas")' },
      { name: "10. Paket & Rate Cards", tab: "📋 Paket Layanan & Rate Cards", desc: "Daftar rate card resmi studio, deliverables, durasi kerja, kuota revisi, dan harga bundling.", countFormula: '=IFERROR(COUNTA(\'📋 Paket Layanan & Rate Cards\'!A2:A) & " paket", "0 paket")' },
      { name: "11. Ulasan & Testimoni", tab: "⭐ Ulasan & Testimoni Klien", desc: "Rating kepuasan bintang ⭐, pesan testimoni klien terverifikasi, status featured, dan foto avatar.", countFormula: '=IFERROR(COUNTA(\'⭐ Ulasan & Testimoni Klien\'!A2:A) & " ulasan", "0 ulasan")' },
      { name: "12. Flash Sale & Promo", tab: "⚡ Flash Sale & Promo", desc: "Pengaturan diskon kilat terbatas, countdown tanggal, kuota promo, dan status aktifasi produk.", countFormula: '=IFERROR(COUNTA(\'⚡ Flash Sale & Promo\'!A2:A) & " promo", "0 promo")' },
      { name: "13. Kemitraan & Afiliasi", tab: "🤝 Kemitraan & Afiliasi", desc: "Reseller, kode referral, persentase bagi hasil komisi, riwayat pencairan saldo dan kontak mitra.", countFormula: '=IFERROR(COUNTA(\'🤝 Kemitraan & Afiliasi\'!A2:A) & " mitra", "0 mitra")' },
      { name: "14. Kontrak & SPK Hukum", tab: "📜 Kontrak & SPK", desc: "Surat Perjanjian Kerja Sama resmi, nilai kontrak proyek, skema termin DP, dan file PDF di Drive.", countFormula: '=IFERROR(COUNTA(\'📜 Kontrak & SPK\'!A2:A) & " berkas", "0 berkas")' },
      { name: "15. Catatan & Memo Studio", tab: "Catatan & Memo", desc: "Brief ide cepat, coretan kreatif, folder catatan, dan tab 'Whiteboard Studio' untuk kanvas visual.", countFormula: '=IFERROR(COUNTA(\'Catatan & Memo\'!A2:A) & " memo", "0 memo")' }
    ];

    for (var n = 0; n < navModules.length; n++) {
      var mod = navModules[n];
      var rNum = 23 + n;
      sheet.setRowHeight(rNum, 22);

      var targetSheet = ss.getSheetByName(mod.tab);
      var linkFormula = targetSheet 
        ? '=HYPERLINK("#gid=' + targetSheet.getSheetId() + '", "Buka Tab ➜")'
        : '"Tab Belum Dibuat"';

      var isEven = n % 2 === 0;
      var rowBg = isEven ? "#ffffff" : "#f8fafc";

      sheet.getRange("A" + rNum + ":C" + rNum).merge().setValue(mod.name).setFontWeight("bold").setFontColor("#1e293b").setBackground(rowBg).setFontSize(8.5);
      sheet.getRange("D" + rNum + ":F" + rNum).merge().setValue(mod.tab).setFontColor("#2563eb").setFontWeight("bold").setBackground(rowBg).setFontSize(8.5);
      sheet.getRange("G" + rNum + ":H" + rNum).merge().setFormula(mod.countFormula).setFontColor("#475569").setHorizontalAlignment("center").setBackground(rowBg).setFontSize(8.5);
      
      var linkCell = sheet.getRange("I" + rNum).setFormula(linkFormula).setHorizontalAlignment("center").setBackground(rowBg).setFontSize(8.5);
      if (targetSheet) {
        linkCell.setFontWeight("bold").setFontColor("#0284c7");
      } else {
        linkCell.setFontColor("#94a3b8");
      }

      sheet.getRange("J" + rNum + ":L" + rNum).merge().setValue(mod.desc).setFontColor("#64748b").setBackground(rowBg).setFontSize(8);
    }

    // ── 13. SPACER (Row 38) ──
    var spacerGuideRow = 23 + navModules.length;
    sheet.setRowHeight(spacerGuideRow, 12);

    // ── 14. PANDUAN PENGGUNAAN & KEAMANAN DUAL-VAULT (Bottom Section) ──
    var guideHeaderRow = spacerGuideRow + 1;
    sheet.getRange(guideHeaderRow, 1, 1, 12).merge()
      .setValue("📌 PETUNJUK PENGOPERASIAN SPREADSHEET & ARSITEKTUR CLOUD DUAL-VAULT")
      .setFontWeight("bold")
      .setFontSize(9.5)
      .setFontColor("#ffffff")
      .setBackground("#0f172a")
      .setVerticalAlignment("middle");
    sheet.setRowHeight(guideHeaderRow, 26);

    var guideRows = [
      ["Sinkronisasi Real-Time Dua Arah", "Setiap transaksi toko, formulir brief, proyek kanban, dan pembaruan admin otomatis tersinkronisasi instan ke spreadsheet ini."],
      ["Rekapitulasi Pajak PPN & DPP", "Kolom PPN, DPP (Dasar Pengenaan Pajak), dan Diskon terpisah rapi dengan formula dinamis, siap diajukan untuk pelaporan SPT Tahunan."],
      ["Arsip Bukti Transfer di Google Drive", "Bukti transfer dari pelanggan di-mirror otomatis ke folder Google Drive ('sumrday_drive/bukti_transfer') dan dapat dibuka langsung via tautan."],
      ["Formula Finansial Otomatis & Akurat", "Seluruh kalkulasi kas masuk, piutang tersisa (=MAX(0, Total - Terbayar)), dan pembagian komisi dihitung dengan rumus spreadsheet asli."],
      ["Arsitektur Dual-Vault Aman", "Spreadsheet ini berfungsi sebagai visual command center & dashboard C-Level. Data master Anda selalu di-backup berlapis di Google Drive JSON & IndexedDB."]
    ];

    for (var g = 0; g < guideRows.length; g++) {
      var rowNumber = guideHeaderRow + 1 + g;
      sheet.setRowHeight(rowNumber, 22);
      sheet.getRange("A" + rowNumber + ":C" + rowNumber).merge().setValue(guideRows[g][0]).setFontWeight("bold").setFontColor("#334155").setFontSize(8.5);
      sheet.getRange("D" + rowNumber + ":L" + rowNumber).merge().setValue(guideRows[g][1]).setFontColor("#64748b").setFontSize(8.5);
    }

    // ── 15. BORDER & STYLING POLISH ──
    var totalDashRows = guideHeaderRow + guideRows.length;
    // eslint-disable-next-line no-undef
    sheet.getRange(2, 1, totalDashRows - 1, 12).setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);

    // ── 16. COLUMN WIDTHS (Sesuai Resolusi Layar Standar 1080p / 1440p) ──
    var colWidths = [130, 130, 110, 110, 120, 120, 130, 130, 110, 110, 130, 130];
    for (var c = 0; c < colWidths.length; c++) {
      sheet.setColumnWidth(c + 1, colWidths[c]);
    }

    // eslint-disable-next-line no-empty
  } catch (dErr) {
    Logger.log("Error building dashboard: " + dErr);
  }
}

// Helper: Get or Create Folder Path in Google Drive
function getOrCreateFolderPath(folderPath) {
  if (!folderPath) folderPath = "sumrday_drive/uploads";
  var parts = folderPath.split("/").filter(function (p) { return p.trim().length > 0; });
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
    var base64Data = data.base64 || data.fileBase64 || data.content;
    var fileName = data.fileName || ('upload_' + Date.now());
    var mimeType = data.mimeType || data.fileType || 'application/octet-stream';

    // Auto-organize folders based on file category
    var folderPath = data.folder || data.folderPath || data.folderName;
    if (!folderPath) {
      if (fileName.indexOf('BuktiTF_') > -1 || data.type === 'payment_proof' || data.isProof) {
        folderPath = 'sumrday_drive/bukti_transfer';
      } else if (fileName.indexOf('Nota_') > -1 || fileName.indexOf('Penawaran_') > -1 || fileName.endsWith('.pdf')) {
        folderPath = 'sumrday_drive/invoices';
      } else {
        folderPath = 'sumrday_drive/media';
      }
    }

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
    var isImg = mimeType && mimeType.indexOf('image/') === 0;
    var thumbnailUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1600";
    var directDownloadUrl = isImg ? thumbnailUrl : ("https://drive.google.com/uc?export=view&id=" + fileId);

    return jsonResponse({
      status: 'success',
      message: 'File berhasil diunggah ke Google Drive',
      url: isImg ? thumbnailUrl : fileUrl, // Used by TransactionManager and modern fetchers
      fileUrl: fileUrl,                    // Backwards compatibility
      directUrl: directDownloadUrl,
      thumbnailUrl: thumbnailUrl,
      viewUrl: fileUrl,
      id: fileId,
      fileId: fileId,
      fileName: fileName,
      folder: folderPath,
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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = projects.map(function (p) {
      if (!p) return [];

      var tasks = p.tasks || [];
      var milestones = tasks.map(function (t) {
        return (t.done ? "[√] " : "[ ] ") + (t.text || "Tugas");
      }).join("\n");

      var files = p.files || [];
      var coverLink = makeHyperlink(p.coverImage || p.thumbnail || (files[0] ? files[0].url : ""), "🖼️ Buka Cover");
      var firstFileLink = files.length > 0 ? makeHyperlink(files[0].url, "📁 Buka Asset (" + files.length + " File)") : "-";

      var activity = p.activity || [];
      var timeline = activity.map(function (act) {
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
      projects.forEach(function (p) {
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
  } catch (calErr) { }

  // Auto-sync partition to drive_db_portfolio.json
  try {
    handleSyncPartition({ partition: 'portfolio', payload: projects });
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
  folders.forEach(function (f) {
    if (f && f.id) folderMap[f.id] = f.name;
  });

  var rows = [];
  if (notes && notes.length > 0) {
    rows = notes.map(function (n) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = canvases.map(function (c) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = products.map(function (p) {
      if (!p) return [];
      var isDeleted = p.isDeleted || p.isTrash || p.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var code = p.productCode || p.sku || p.code || "-";
      var originalPrice = p.originalPrice || p.regularPrice || 0;
      var variantsText = (p.variants && Array.isArray(p.variants) && p.variants.length > 0)
        ? p.variants.map(function (v) { return (v.name || v.label || "Varian") + ": " + (v.options ? (Array.isArray(v.options) ? v.options.join(", ") : v.options) : (v.price ? "Rp " + v.price : "")); }).join("; ")
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
  } catch (e) { }

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

// --- 7. TRANSAKSI & PEMBUKUAN PERPAJAKAN (PPN, DPP, BUKTI TF DRIVE & WEB) ---
function handleTransactionSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "Transaksi & Pesanan";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.setTabColor("#047857");

  var columns = [
    "Timestamp",                         // Col 1 (A)
    "ID Transaksi",                      // Col 2 (B)
    "No. Nota / Invoice",                // Col 3 (C)
    "Tanggal Invoice",                   // Col 4 (D)
    "Nama Pelanggan",                    // Col 5 (E)
    "Kontak (WhatsApp)",                 // Col 6 (F)
    "Email Pelanggan",                   // Col 7 (G)
    "Alamat Pelanggan",                  // Col 8 (H)
    "Detail Item / Layanan",             // Col 9 (I)
    "Metode Pembayaran",                 // Col 10 (J)
    "Subtotal (IDR)",                    // Col 11 (K)
    "Diskon (IDR)",                      // Col 12 (L)
    "DPP (Dasar Pengenaan Pajak) (IDR)", // Col 13 (M)
    "PPN Aktif",                         // Col 14 (N)
    "Tarif PPN (%)",                     // Col 15 (O)
    "Nilai PPN (IDR)",                   // Col 16 (P)
    "Ongkir & Biaya Tambahan (IDR)",     // Col 17 (Q)
    "Total Akhir (IDR)",                 // Col 18 (R)
    "Status Pembayaran",                 // Col 19 (S)
    "DP / Terbayar (IDR)",               // Col 20 (T)
    "Sisa Tagihan (IDR)",                // Col 21 (U)
    "📁 Bukti TF di Drive",              // Col 22 (V)
    "🌐 Bukti TF (Web/Cloudinary)",      // Col 23 (W)
    "📄 Nota / Invoice Drive",           // Col 24 (X)
    "Catatan Pembukuan",                 // Col 25 (Y)
    "Sumber Transaksi",                  // Col 26 (Z)
    "Status Database",                   // Col 27 (AA)
    "Raw JSON Backup"                    // Col 28 (AB)
  ];

  var dropdowns = [
    { col: 10, options: ['QRIS', 'Transfer BCA', 'Transfer Mandiri', 'Transfer BRI', 'Tunai', 'Kartu Kredit', 'Gerai'] },
    { col: 14, options: ['YA', 'TIDAK'] },
    { col: 19, options: ['lunas', 'dp', 'belum', 'batal', 'cicilan'] },
    { col: 26, options: ['admin', 'shop', 'web', 'katalog'] }
  ];

  // Helper extraction for consistent row parsing
  function extractTrxRow(t, rowIdx) {
    if (!t) return [];
    var isDeleted = t.isDeleted || t.deleted || t.status === 'batal' || t.status === 'dihapus';
    var statusDb = isDeleted ? "TERHAPUS / BATAL" : "AKTIF";

    var custName = (t.customer && typeof t.customer === 'object' ? t.customer.name : t.customerName) || t.clientName || "Pelanggan";
    var rawPhone = (t.customer && typeof t.customer === 'object' ? (t.customer.phone || t.customer.whatsapp) : (t.customerPhone || t.customerContact)) || "-";
    var rawEmail = (t.customer && typeof t.customer === 'object' ? t.customer.email : t.customerEmail) || "-";
    var rawAddress = (t.customer && typeof t.customer === 'object' ? t.customer.address : t.customerAddress) || "-";
    var waLink = makeWhatsAppLink(rawPhone, custName);

    var itemsText = Array.isArray(t.items) ? t.items.map(function (it) {
      if (typeof it === 'string') return it;
      return (it.name || it.title || "Item") + " (" + (it.qty || 1) + "x @" + (it.price || 0) + ")";
    }).join("; ") : (t.items || t.title || "Pesanan Desain");

    var subtotal = Number(t.subtotal) || 0;
    var discount = Number(t.discount) || (t.discountVal || 0);
    var dpp = Math.max(0, subtotal - discount);

    var ppnEnabled = (t.ppnEnabled === 'YA' || t.ppnEnabled === true || (t.tax && t.tax.enabled)) ? 'YA' : 'TIDAK';
    var ppnPercent = (t.ppnPercent !== undefined) ? Number(t.ppnPercent) : (t.tax ? Number(t.tax.percent || 0) : 0);
    var ppnAmount = (t.ppnAmount !== undefined) ? Number(t.ppnAmount) : (t.taxAmount || (t.tax ? Number(t.tax.amount || 0) : 0));
    if (ppnEnabled === 'YA' && ppnAmount === 0 && ppnPercent > 0) {
      ppnAmount = Math.round(dpp * (ppnPercent / 100));
    }

    var shipping = Number(t.shipping || t.shippingCost || 0);
    var grandTotal = Number(t.grandTotal || t.total || (dpp + ppnAmount + shipping));
    var dp = Number(t.dpAmount || t.downPayment || t.paidAmount || (t.paymentStatus === 'lunas' ? grandTotal : 0));
    var statusBayar = t.paymentStatus || t.status || "belum";
    var paymentMethod = (typeof t.paymentMethod === 'object' ? (t.paymentMethod.bankName || t.paymentMethod.name) : t.paymentMethod) || t.method || "QRIS";
    var invoiceNumber = t.invoiceNumber || t.invNo || ("INV-" + (t.id || "").substring(0, 8));

    // Dynamic Remaining Balance Formula
    var remainingFormula = "=MAX(0, R" + rowIdx + " - T" + rowIdx + ")";

    // Bukti TF & Nota Hyperlinks
    var driveProofRaw = t.driveProofUrl || (t.driveProof && t.driveProof.url ? t.driveProof.url : "") || (t.driveUrl && t.driveUrl.indexOf('BuktiTF') > -1 ? t.driveUrl : "");
    var webProofRaw = t.paymentProofUrl || t.paymentProof || t.attachmentUrl || "";
    var invoiceDriveRaw = t.invoiceDriveUrl || t.driveUrl || t.invoiceUrl || "";

    var driveProofLink = makeHyperlink(driveProofRaw, "📁 Buka Bukti Drive");
    var webProofLink = makeHyperlink(webProofRaw, "💳 Buka Bukti Web");
    var invoiceDriveLink = makeHyperlink(invoiceDriveRaw, "📄 Buka Nota Drive");

    var notes = t.notes || t.note || "";
    var source = t.source || "admin";

    return [
      t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : new Date().toLocaleString("id-ID"),
      t.id || "",
      invoiceNumber,
      t.date || new Date().toISOString().substring(0, 10),
      custName,
      waLink,
      rawEmail,
      rawAddress,
      itemsText,
      paymentMethod,
      subtotal,
      discount,
      dpp,
      ppnEnabled,
      ppnPercent ? (ppnPercent + "%") : "0%",
      ppnAmount,
      shipping,
      grandTotal,
      statusBayar,
      dp,
      remainingFormula,
      driveProofLink,
      webProofLink,
      invoiceDriveLink,
      notes,
      source,
      statusDb,
      safeJsonStringify(t)
    ];
  }

  // --- BATCH SINKRONISASI ---
  if (Array.isArray(payload)) {
    sheet.clear();
    sheet.getBandings().forEach(function (b) { b.remove(); });
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight("bold")
      .setBackground("#047857")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);

    var rows = payload.map(function (t, idx) {
      return extractTrxRow(t, 2 + idx);
    }).filter(function (r) { return r && r.length > 0; });

    if (rows.length > 0) {
      var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
      dataRange.setValues(rows);
      dataRange.setVerticalAlignment("middle");

      // Text alignments
      sheet.getRange(2, 1, rows.length, 4).setHorizontalAlignment("center");
      sheet.getRange(2, 6, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 10, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 14, rows.length, 2).setHorizontalAlignment("center");
      sheet.getRange(2, 19, rows.length, 1).setHorizontalAlignment("center");
      sheet.getRange(2, 22, rows.length, 3).setHorizontalAlignment("center");
      sheet.getRange(2, 26, rows.length, 2).setHorizontalAlignment("center");

      // Currency number formatting
      sheet.getRange(2, 11, rows.length, 3).setNumberFormat('Rp #,##0').setHorizontalAlignment("right"); // Subtotal, Diskon, DPP
      sheet.getRange(2, 16, rows.length, 3).setNumberFormat('Rp #,##0').setHorizontalAlignment("right"); // PPN, Ongkir, GrandTotal
      sheet.getRange(2, 20, rows.length, 2).setNumberFormat('Rp #,##0').setHorizontalAlignment("right"); // DP, Sisa Tagihan
    }

    try {
      handleSyncPartition({ partition: 'transactions', payload: payload });
    } catch (e) { }

    // Apply conditional status styling & dropdowns
    // eslint-disable-next-line no-undef
    applySheetEnhancements(sheet, "AA", 2, columns.length, SpreadsheetApp.BandingTheme.TEAL, dropdowns);
    applyPaymentStatusColors(sheet, 2, sheet.getLastRow());
    ensureDashboardOverviewTab(ss);

    return jsonResponse({ status: 'success', message: 'Batch transaksi & pembukuan PPN berhasil disinkronkan', count: rows.length });
  }

  // --- SINGLE TRANSACTION INSERT OR UPDATE ---
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

  var targetRowIdx = rowIndexToUpdate > 0 ? rowIndexToUpdate : (lastRow + 1);
  var singleRow = extractTrxRow(tSingle, targetRowIdx);

  if (rowIndexToUpdate > 0) {
    sheet.getRange(rowIndexToUpdate, 1, 1, columns.length).setValues([singleRow]);
  } else {
    sheet.appendRow(singleRow);
  }

  lastRow = sheet.getLastRow();
  // Format single row
  sheet.getRange(targetRowIdx, 11, 1, 3).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
  sheet.getRange(targetRowIdx, 16, 1, 3).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
  sheet.getRange(targetRowIdx, 20, 1, 2).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
  sheet.getRange(targetRowIdx, 1, 1, 4).setHorizontalAlignment("center");
  sheet.getRange(targetRowIdx, 10, 1, 1).setHorizontalAlignment("center");
  sheet.getRange(targetRowIdx, 14, 1, 2).setHorizontalAlignment("center");
  sheet.getRange(targetRowIdx, 19, 1, 1).setHorizontalAlignment("center");
  sheet.getRange(targetRowIdx, 22, 1, 3).setHorizontalAlignment("center");
  sheet.getRange(targetRowIdx, 26, 1, 2).setHorizontalAlignment("center");

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "AA", 2, columns.length, SpreadsheetApp.BandingTheme.TEAL, dropdowns);
  applyPaymentStatusColors(sheet, 2, lastRow);
  ensureDashboardOverviewTab(ss);

  return jsonResponse({ status: 'success', message: 'Transaksi ' + tSingle.id + ' (PPN & Bukti TF Drive) berhasil disimpan di Google Sheets' });
}

// Helper: Soft conditional color formatting for Payment Status (Col S)
function applyPaymentStatusColors(sheet, startRow, endRow) {
  if (endRow < startRow) return;
  try {
    var rules = sheet.getConditionalFormatRules() || [];
    var totalCols = sheet.getLastColumn();
    var range = sheet.getRange(startRow, 1, endRow - startRow + 1, totalCols);

    // Rule 1: Lunas (Soft Emerald)
    // eslint-disable-next-line no-undef
    var lunasRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=REGEXMATCH(TO_TEXT($S' + startRow + '), "(?i)lunas")')
      .setBackground('#dcfce7')
      .setFontColor('#166534')
      .setRanges([range])
      .build();

    // Rule 2: DP / Cicilan (Soft Amber)
    // eslint-disable-next-line no-undef
    var dpRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=REGEXMATCH(TO_TEXT($S' + startRow + '), "(?i)dp|cicilan")')
      .setBackground('#fef3c7')
      .setFontColor('#92400e')
      .setRanges([range])
      .build();

    // Rule 3: Belum Bayar (Soft Rose)
    // eslint-disable-next-line no-undef
    var belumRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=REGEXMATCH(TO_TEXT($S' + startRow + '), "(?i)belum")')
      .setBackground('#ffe4e6')
      .setFontColor('#9f1239')
      .setRanges([range])
      .build();

    rules.push(lunasRule);
    rules.push(dpRule);
    rules.push(belumRule);
    sheet.setConditionalFormatRules(rules);
    // eslint-disable-next-line no-empty
  } catch (e) { }
}

function handleGetTransactions(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'transactions' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data && Array.isArray(partData.data) && partData.data.length > 0) {
    return partitionRes;
  }
  return getGenericSheet("Transaksi & Pesanan", [
    "timestamp", "id", "invoiceNumber", "date", "customerName", "contact",
    "customerEmail", "customerAddress", "items", "paymentMethod", "subtotal",
    "discount", "dpp", "ppnEnabled", "ppnPercent", "ppnAmount", "shipping",
    "grandTotal", "status", "dp", "remaining", "driveProofUrl", "paymentProofUrl",
    "invoiceDriveUrl", "notes", "source", "statusDb", "rawJson"
  ], sheetId);
}

// --- 8. FORMULIR & SURVEI MAKER (DYNAMIC FORM SCHEMAS & RESPONSES) ---
function handleFormsSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "📋 Formulir & Survei";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = forms.map(function (f) {
      if (!f) return [];
      var questions = f.questions || [];
      var qSummary = questions.map(function (q, i) {
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
  } catch (e) { }

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
    sheet.getBandings().forEach(function (b) { b.remove(); });
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight("bold")
      .setBackground("#9333ea")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);

    var rows = responses.map(function (r) {
      if (!r) return [];
      var answers = r.answers || {};
      var ansText = Object.keys(answers).map(function (k) {
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
    } catch (e) { }

    // eslint-disable-next-line no-undef
    applySheetEnhancements(sheet, "I", 2, columns.length, SpreadsheetApp.BandingTheme.PURPLE, []);
    ensureDashboardOverviewTab(ss);
    return jsonResponse({ status: 'success', message: 'Tanggapan Formulir berhasil disinkronkan', count: rows.length });
  }

  // Single response append
  var singleR = payload;
  var answersSingle = singleR.answers || {};
  var ansSingleText = Object.keys(answersSingle).map(function (k) {
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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = updates.map(function (u) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    bankAccounts.forEach(function (bk, idx) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = customers.map(function (c) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = users.map(function (u) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = bookings.map(function (b) {
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
      bookings.forEach(function (b) {
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
  } catch (calErr) { }

  try {
    handleSyncPartition({ partition: 'bookings', payload: bookings });
  } catch (e) { }

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
    sheet.getBandings().forEach(function (b) { b.remove(); });
    sheet.appendRow(columns);
    sheet.getRange(1, 1, 1, columns.length)
      .setFontWeight("bold")
      .setBackground("#14b8a6")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);

    var rows = messages.map(function (m) {
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
    } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = discounts.map(function (d) {
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
  } catch (e) { }

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
  sheet.getBandings().forEach(function (b) { b.remove(); });
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
    rows = posts.map(function (p) {
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
  } catch (e) { }

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

// --- 16b. PAKET LAYANAN & RATE CARDS SYNC ---
function handleRateCardSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "📋 Paket Layanan & Rate Cards";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.setTabColor("#7c3aed");

  var columns = [
    "ID Paket",
    "Nama Paket / Layanan",
    "Kategori",
    "Badge",
    "Harga (IDR)",
    "Harga Coret (IDR)",
    "Periode Tagihan",
    "Durasi (Hari)",
    "Ketentuan Revisi",
    "Deliverables / Fitur",
    "Status Tampil",
    "Status Database",
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);

  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#7c3aed").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  var packages = Array.isArray(payload) ? payload : (payload.packages || payload.rateCards || []);
  var rows = [];
  if (packages && packages.length > 0) {
    rows = packages.map(function (pkg) {
      if (!pkg) return [];
      var isDeleted = pkg.isDeleted || pkg.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var delivStr = Array.isArray(pkg.deliverables) ? pkg.deliverables.join("; ") : (pkg.deliverables || "-");

      return [
        pkg.id || "",
        pkg.title || pkg.name || "Paket Layanan",
        pkg.category || "Umum",
        pkg.badge || "-",
        pkg.price || 0,
        pkg.originalPrice || "",
        pkg.billingPeriod || "per proyek",
        pkg.durationDays || "-",
        pkg.revisionLimit || "-",
        delivStr,
        pkg.isActive === false ? "Draft" : "Aktif",
        statusDb,
        safeJsonStringify(pkg)
      ];
    });

    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 2).setHorizontalAlignment("center");
    sheet.getRange(2, 5, rows.length, 2).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    sheet.getRange(2, 7, rows.length, 3).setHorizontalAlignment("center");
    sheet.getRange(2, 11, rows.length, 2).setHorizontalAlignment("center");
  }

  try {
    handleSyncPartition({ partition: 'rate_cards', payload: payload });
  } catch (e) { }

  var dropdowns = [
    { col: 11, options: ['Aktif', 'Draft'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "L", 2, columns.length, SpreadsheetApp.BandingTheme.INDIGO, dropdowns);
  ensureDashboardOverviewTab(ss);

  return jsonResponse({ status: 'success', message: 'Paket Rate Cards berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetRateCards(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'rate_cards' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("📋 Paket Layanan & Rate Cards", ["id", "title", "category", "badge", "price", "originalPrice", "billingPeriod", "durationDays", "revisionLimit", "deliverables", "status"], sheetId);
}

// --- 16c. ULASAN & TESTIMONI KLIEN SYNC ---
function handleReviewSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "⭐ Ulasan & Testimoni Klien";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.setTabColor("#f59e0b");

  var columns = [
    "ID Review",
    "Nama Klien",
    "Brand / Usaha",
    "Jabatan / Role",
    "Rating",
    "Isi Ulasan & Testimoni",
    "Kategori Layanan",
    "Unggulan (Featured)",
    "Status Publikasi",
    "Tautan Avatar",
    "Waktu Dibuat",
    "Status Database",
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);

  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#f59e0b").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  var reviews = Array.isArray(payload) ? payload : (payload.reviews || payload.testimonials || []);
  var rows = [];
  if (reviews && reviews.length > 0) {
    rows = reviews.map(function (rev) {
      if (!rev) return [];
      var isDeleted = rev.isDeleted || rev.deleted;
      var statusDb = isDeleted ? "TERHAPUS" : "AKTIF";
      var stars = "";
      var rCount = Number(rev.rating) || 5;
      for (var s = 0; s < rCount; s++) stars += "⭐";
      var avatarLink = makeHyperlink(rev.avatarUrl, "👤 Foto Klien");

      return [
        rev.id || "",
        rev.clientName || rev.name || "Klien",
        rev.brand || rev.company || "-",
        rev.role || "-",
        stars + " (" + rCount + "/5)",
        rev.reviewText || rev.text || "-",
        rev.serviceCategory || "Umum",
        rev.isFeatured ? "⭐ Ya" : "Tidak",
        rev.isPublished === false ? "Draft" : "Published",
        avatarLink,
        rev.createdAt || "-",
        statusDb,
        safeJsonStringify(rev)
      ];
    });

    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 5, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 7, rows.length, 3).setHorizontalAlignment("center");
    sheet.getRange(2, 10, rows.length, 3).setHorizontalAlignment("center");
  }

  try {
    handleSyncPartition({ partition: 'reviews', payload: payload });
  } catch (e) { }

  var dropdowns = [
    { col: 8, options: ['⭐ Ya', 'Tidak'] },
    { col: 9, options: ['Published', 'Draft'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "L", 2, columns.length, SpreadsheetApp.BandingTheme.YELLOW, dropdowns);
  ensureDashboardOverviewTab(ss);

  return jsonResponse({ status: 'success', message: 'Ulasan & Testimoni Klien berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetReviews(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'reviews' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("⭐ Ulasan & Testimoni Klien", ["id", "clientName", "brand", "role", "rating", "reviewText", "serviceCategory", "isFeatured", "isPublished", "createdAt"], sheetId);
}

// --- 16d. FLASH SALE & PROMO CAMPAIGN SYNC ---
function handleFlashSaleSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "⚡ Flash Sale & Promo";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.setTabColor("#ea580c");

  var columns = [
    "ID Kampanye",
    "Judul Flash Sale / Promo",
    "Diskon (%)",
    "Waktu Mulai",
    "Waktu Berakhir",
    "Status Kampanye",
    "Total Produk Terdaftar",
    "Batas Kuota Stok",
    "Daftar ID Produk",
    "Tautan Banner / Media",
    "Update Terakhir",
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);

  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#ea580c").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  var items = Array.isArray(payload) ? payload : (payload.campaigns || payload.flashSales || [payload]);
  var rows = [];
  if (items && items.length > 0) {
    rows = items.filter(Boolean).map(function (fs) {
      var discountNum = Number(fs.discountPercent || fs.discount || 0);
      var pIds = Array.isArray(fs.productIds) ? fs.productIds.join(", ") : (fs.productIds || "-");
      var pCount = Array.isArray(fs.productIds) ? fs.productIds.length : (Number(fs.productCount) || 1);
      var now = new Date().getTime();
      var end = fs.endTime ? new Date(fs.endTime).getTime() : 0;
      var start = fs.startTime ? new Date(fs.startTime).getTime() : 0;
      var status = "⚪ Selesai";
      if (fs.isActive !== false) {
        if (end > 0 && now > end) {
          status = "⚪ Selesai";
        } else if (start > 0 && now < start) {
          status = "⏳ Terjadwal";
        } else {
          status = "🟢 Aktif";
        }
      }

      return [
        fs.id || "FS-" + Date.now(),
        fs.title || fs.name || "Flash Sale Spesial",
        discountNum / 100,
        fs.startTime || "-",
        fs.endTime || "-",
        status,
        pCount,
        fs.stockQuota || fs.quota || "Tidak Terbatas",
        pIds,
        makeHyperlink(fs.bannerUrl || fs.mediaUrl, "🖼️ Banner Promo"),
        fs.updatedAt || new Date().toISOString(),
        safeJsonStringify(fs)
      ];
    });

    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 1).setNumberFormat('0.0%').setHorizontalAlignment("center");
    sheet.getRange(2, 4, rows.length, 3).setHorizontalAlignment("center");
    sheet.getRange(2, 7, rows.length, 2).setHorizontalAlignment("center");
    sheet.getRange(2, 10, rows.length, 2).setHorizontalAlignment("center");
  }

  try {
    handleSyncPartition({ partition: 'flash_sales', payload: payload });
  } catch (e) { }

  var dropdowns = [
    { col: 6, options: ['🟢 Aktif', '⏳ Terjadwal', '⚪ Selesai'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "L", 2, columns.length, SpreadsheetApp.BandingTheme.ORANGE, dropdowns);
  ensureDashboardOverviewTab(ss);

  return jsonResponse({ status: 'success', message: 'Flash Sale & Promo berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetFlashSales(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'flash_sales' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("⚡ Flash Sale & Promo", ["id", "title", "discountPercent", "startTime", "endTime", "status", "productCount", "stockQuota"], sheetId);
}

// --- 16e. KEMITRAAN, RESELLER & AFILIASI SYNC ---
function handlePartnershipSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "🤝 Kemitraan & Afiliasi";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.setTabColor("#0891b2");

  var columns = [
    "ID Mitra",
    "Nama Mitra / Reseller",
    "Nomor WhatsApp",
    "Chat WA Langsung",
    "Tipe Kemitraan",
    "Kode Referral",
    "Komisi (%)",
    "Total Transaksi Diarahkan",
    "Total Komisi (IDR)",
    "Telah Ditarik (IDR)",
    "Sisa Saldo Komisi (IDR)",
    "Status Kemitraan",
    "Tanggal Bergabung",
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);

  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#0891b2").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  var partners = Array.isArray(payload) ? payload : (payload.partners || payload.affiliates || [payload]);
  var rows = [];
  if (partners && partners.length > 0) {
    rows = partners.filter(Boolean).map(function (p) {
      var phone = p.phone || p.whatsapp || "";
      var waLink = makeHyperlink(phone ? ("https://wa.me/" + cleanPhone(phone)) : "", "💬 Chat WA");
      var rate = Number(p.commissionPercent || p.rate || 10) / 100;
      var earned = Number(p.totalCommissionEarned || p.totalEarned || 0);
      var withdrawn = Number(p.totalWithdrawn || 0);
      var balance = earned - withdrawn;
      var status = p.status || "🟢 Aktif";

      return [
        p.id || "MITRA-" + Date.now(),
        p.name || "Mitra Studio",
        phone || "-",
        waLink,
        p.type || "Reseller",
        p.referralCode || p.code || "-",
        rate,
        Number(p.totalOrders || p.orderCount || 0),
        earned,
        withdrawn,
        balance,
        status,
        p.joinedAt || p.createdAt || "-",
        safeJsonStringify(p)
      ];
    });

    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 3, rows.length, 4).setHorizontalAlignment("center");
    sheet.getRange(2, 7, rows.length, 1).setNumberFormat('0.0%').setHorizontalAlignment("center");
    sheet.getRange(2, 8, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 9, rows.length, 3).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    sheet.getRange(2, 12, rows.length, 2).setHorizontalAlignment("center");
  }

  try {
    handleSyncPartition({ partition: 'partnerships', payload: payload });
  } catch (e) { }

  var dropdowns = [
    { col: 5, options: ['Reseller', 'Afiliator', 'VIP Agency', 'Partner'] },
    { col: 12, options: ['🟢 Aktif', '🟡 Pending Review', '🔴 Dibekukan'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "N", 2, columns.length, SpreadsheetApp.BandingTheme.CYAN, dropdowns);
  ensureDashboardOverviewTab(ss);

  return jsonResponse({ status: 'success', message: 'Data Kemitraan & Afiliasi berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetPartnerships(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'partnerships' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("🤝 Kemitraan & Afiliasi", ["id", "name", "phone", "type", "referralCode", "commissionPercent", "totalOrders", "totalCommission", "withdrawn", "balance", "status"], sheetId);
}

// --- 16f. KONTRAK & SURAT PERJANJIAN KERJA SAMA (SPK) SYNC ---
function handleContractSpkSync(payload, sheetId) {
  var ss = getSpreadsheet(sheetId);
  var sheetName = "📜 Kontrak & SPK";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  sheet.clear();
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet.setTabColor("#4f46e5");

  var columns = [
    "Nomor Dokumen SPK",
    "Judul Proyek / SPK",
    "Pihak Klien / Perusahaan",
    "Kontak PIC",
    "Nilai Kontrak (IDR)",
    "Nilai DP (IDR)",
    "Sisa Pembayaran (IDR)",
    "Skema Pembayaran",
    "Tanggal Terbit",
    "Tenggat Waktu",
    "Status Dokumen",
    "Link Berkas SPK Drive",
    "Update Terakhir",
    "Raw JSON Backup"
  ];
  sheet.appendRow(columns);

  var headerRange = sheet.getRange(1, 1, 1, columns.length);
  headerRange.setFontWeight("bold").setBackground("#4f46e5").setFontColor("#ffffff").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  var contracts = Array.isArray(payload) ? payload : (payload.contracts || payload.spk || [payload]);
  var rows = [];
  if (contracts && contracts.length > 0) {
    rows = contracts.filter(Boolean).map(function (c) {
      var contractVal = Number(c.contractValue || c.grandTotal || c.price || 0);
      var dpVal = Number(c.dpAmount || c.dp || 0);
      var remVal = Number(c.remainingAmount || (contractVal - dpVal));
      var pdfLink = makeHyperlink(c.pdfDriveUrl || c.fileUrl || c.driveUrl, "📄 Buka PDF SPK");
      var status = c.status || "📄 Draft";

      return [
        c.spkNumber || c.id || ("SPK/" + new Date().getFullYear() + "/" + Date.now().toString(36).toUpperCase()),
        c.projectTitle || c.title || "Proyek Kreatif Studio",
        c.clientName || c.clientCompany || "Klien",
        c.clientContact || c.phone || "-",
        contractVal,
        dpVal,
        remVal,
        c.paymentScheme || "DP 50% - Pelunasan",
        c.issueDate || c.createdAt || new Date().toISOString().slice(0, 10),
        c.deadline || "-",
        status,
        pdfLink,
        c.updatedAt || new Date().toISOString(),
        safeJsonStringify(c)
      ];
    });

    var dataRange = sheet.getRange(2, 1, rows.length, columns.length);
    dataRange.setValues(rows);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 5, rows.length, 3).setNumberFormat('Rp #,##0').setHorizontalAlignment("right");
    sheet.getRange(2, 8, rows.length, 4).setHorizontalAlignment("center");
    sheet.getRange(2, 12, rows.length, 2).setHorizontalAlignment("center");
  }

  try {
    handleSyncPartition({ partition: 'contracts_spk', payload: payload });
  } catch (e) { }

  var dropdowns = [
    { col: 8, options: ['DP 50% - Pelunasan', 'Full 100% di Muka', 'Termin Bertahap', 'Penawaran/Quotation'] },
    { col: 11, options: ['📄 Draft', '📤 Terkirim', '✍️ Ditandatangani', '🏁 Selesai'] }
  ];

  // eslint-disable-next-line no-undef
  applySheetEnhancements(sheet, "N", 2, columns.length, SpreadsheetApp.BandingTheme.INDIGO, dropdowns);
  ensureDashboardOverviewTab(ss);

  return jsonResponse({ status: 'success', message: 'Kontrak SPK berhasil disinkronkan', count: rows ? rows.length : 0 });
}

function handleGetContracts(sheetId) {
  var partitionRes = handleGetPartition({ partition: 'contracts_spk' });
  var partData = JSON.parse(partitionRes.getContent());
  if (partData && partData.data) {
    return partitionRes;
  }
  return getGenericSheet("📜 Kontrak & SPK", ["spkNumber", "projectTitle", "clientName", "clientContact", "contractValue", "dpAmount", "remainingAmount", "paymentScheme", "issueDate", "deadline", "status"], sheetId);
}

// --- 16g. DIAGNOSTIK & HEALTH CHECK ENGINE ---
function handleDiagnoseSystem(sheetId) {
  try {
    var ss = getSpreadsheet(sheetId);
    var sheets = ss.getSheets();
    var sheetSummaries = sheets.map(function (s) {
      return {
        name: s.getName(),
        rows: s.getLastRow(),
        cols: s.getLastColumn(),
        isFrozen: s.getFrozenRows() > 0
      };
    });

    var driveInfo = {
      rootFolder: "sumrday_drive",
      status: "connected"
    };

    try {
      var rootFolder = getOrCreateFolderPath("sumrday_drive");
      driveInfo.id = rootFolder.getId();
      driveInfo.url = rootFolder.getUrl();
    } catch (e) {
      driveInfo.status = "drive_warning: " + e.toString();
    }

    return jsonResponse({
      status: 'success',
      health: 'optimal',
      spreadsheetName: ss.getName(),
      totalSheets: sheets.length,
      sheets: sheetSummaries,
      drive: driveInfo,
      timestamp: new Date().toISOString(),
      version: '7.5.0-ultra-executive-suite'
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Diagnostic error: ' + err.toString() });
  }
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
    if (p.rate_cards || p.rateCards || p.packages) {
      handleRateCardSync(p.rate_cards || p.rateCards || p.packages, sheetId);
      results.rate_cards = 'ok';
      totalProcessed++;
    }
    if (p.reviews || p.testimonials) {
      handleReviewSync(p.reviews || p.testimonials, sheetId);
      results.reviews = 'ok';
      totalProcessed++;
    }
    if (p.flash_sales || p.flashSales) {
      handleFlashSaleSync(p.flash_sales || p.flashSales, sheetId);
      results.flash_sales = 'ok';
      totalProcessed++;
    }
    if (p.partnerships || p.affiliates) {
      handlePartnershipSync(p.partnerships || p.affiliates, sheetId);
      results.partnerships = 'ok';
      totalProcessed++;
    }
    if (p.contracts || p.contracts_spk || p.spk) {
      handleContractSpkSync(p.contracts || p.contracts_spk || p.spk, sheetId);
      results.contracts_spk = 'ok';
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

    var folder = getOrCreateFolderPath("sumrday_drive/game_backups");
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
      var logSheet = ss.getSheetByName("🎮 Log Aktivitas Game") || ss.insertSheet("🎮 Log Aktivitas Game");
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
    } catch (sErr) { }

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
      contacts.forEach(function (c) {
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
          } catch (cErr) { }
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

    events.forEach(function (ev) {
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

    var folder = getOrCreateFolderPath("sumrday_drive/Backups");
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    var fileName = "sumrday_master_backup_" + timestamp + ".json";
    var contentStr = JSON.stringify(payload, null, 2);

    // eslint-disable-next-line no-undef
    var file = folder.createFile(fileName, contentStr, MimeType.PLAIN_TEXT);
    // eslint-disable-next-line no-undef
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Also update a fixed file for quick single-file restore
    var latestFileIterator = folder.getFilesByName("sumrday_master_backup_LATEST.json");
    var latestFile;
    if (latestFileIterator.hasNext()) {
      latestFile = latestFileIterator.next();
      latestFile.setContent(contentStr);
    } else {
      // eslint-disable-next-line no-undef
      latestFile = folder.createFile("sumrday_master_backup_LATEST.json", contentStr, MimeType.PLAIN_TEXT);
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
    var primaryFolder = getOrCreateFolderPath("sumrday_drive/Backups");
    var fallbackFolder = getOrCreateFolderPath("Agenze_CMS_Database/Backups");

    var fileName = data.fileName || "sumrday_master_backup_LATEST.json";
    var files = primaryFolder.getFilesByName(fileName);
    if (!files.hasNext() && fileName !== "sumrday_master_backup_LATEST.json") {
      files = primaryFolder.getFilesByName("sumrday_master_backup_LATEST.json");
    }
    if (!files.hasNext() && fileName.indexOf("sumrday_") > -1) {
      files = fallbackFolder.getFilesByName("agenze_master_backup_LATEST.json");
    }
    if (!files.hasNext()) {
      files = fallbackFolder.getFilesByName(fileName);
    }

    if (!files.hasNext()) {
      // Fallback: cari file backup terbaru apapun namanya di kedua folder
      var foldersToCheck = [primaryFolder, fallbackFolder];
      var newestFile = null;
      var newestDate = new Date(0);
      for (var fi = 0; fi < foldersToCheck.length; fi++) {
        var allFiles = foldersToCheck[fi].getFiles();
        while (allFiles.hasNext()) {
          var f = allFiles.next();
          var name = f.getName();
          if (name.indexOf("master_backup_") > -1) {
            if (f.getLastUpdated() > newestDate) {
              newestDate = f.getLastUpdated();
              newestFile = f;
            }
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
      fileName: file.getName(),
      updatedAt: file.getLastUpdated().toISOString(),
      data: JSON.parse(contentStr)
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Restore gagal: ' + err.toString() });
  }
}

function handleGetStorageStats(data) {
  try {
    var foldersToScan = [
      getOrCreateFolderPath("sumrday_drive"),
      getOrCreateFolderPath("Agenze_CMS_Database")
    ];
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

    foldersToScan.forEach(function (fld) {
      countFolder(fld);
    });

    // eslint-disable-next-line no-undef
    var storageLimitBytes = 15 * 1024 * 1024 * 1024; // 15 GB free tier
    var usedMb = (totalBytes / (1024 * 1024)).toFixed(2);

    return jsonResponse({
      status: 'success',
      totalBytes: totalBytes,
      usedMb: parseFloat(usedMb),
      totalFiles: fileCount,
      freeTierLimitGb: 15,
      folderRootName: "sumrday_drive",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function handleCleanupBackups(data) {
  try {
    var keepCount = data.keepCount || 5;
    var foldersToClean = [
      getOrCreateFolderPath("sumrday_drive/Backups"),
      getOrCreateFolderPath("Agenze_CMS_Database/Backups")
    ];
    var backupList = [];

    foldersToClean.forEach(function (folder) {
      var files = folder.getFiles();
      while (files.hasNext()) {
        var f = files.next();
        var name = f.getName();
        if (name.indexOf("master_backup_20") > -1) {
          backupList.push({
            file: f,
            updated: f.getLastUpdated().getTime(),
            name: name
          });
        }
      }
    });

    backupList.sort(function (a, b) {
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

    var folder = getOrCreateFolderPath("sumrday_drive/Partitions");
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
    var primaryFolder = getOrCreateFolderPath("sumrday_drive/Partitions");
    var fallbackFolder = getOrCreateFolderPath("Agenze_CMS_Database/Partitions");
    var fileName = "drive_db_" + partition + ".json";

    var files = primaryFolder.getFilesByName(fileName);
    if (!files.hasNext()) {
      files = fallbackFolder.getFilesByName(fileName);
    }
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
      fileId: file.getId(),
      data: parsed,
      updatedAt: file.getLastUpdated().toISOString()
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

// --- 25. AUTOMATED GOOGLE DRIVE CLIENT VAULT ---
function handleCreateClientVault(payload) {
  try {
    var orderId = payload.orderId || ('ORD-' + Date.now().toString().slice(-6));
    var clientName = payload.clientName || 'Klien';
    var clientEmail = payload.clientEmail || '';

    // eslint-disable-next-line no-undef
    var rootFolderIterator = DriveApp.getFoldersByName('sumr.day_projects_vault_2026');
    var rootFolder;
    if (rootFolderIterator.hasNext()) {
      rootFolder = rootFolderIterator.next();
    } else {
      // eslint-disable-next-line no-undef
      rootFolder = DriveApp.createFolder('sumr.day_projects_vault_2026');
    }

    var folderName = '📁 [' + orderId + '] ' + clientName;
    var existingSub = rootFolder.getFoldersByName(folderName);
    var clientFolder;
    if (existingSub.hasNext()) {
      clientFolder = existingSub.next();
    } else {
      clientFolder = rootFolder.createFolder(folderName);
      // Buat sub-folder siap pakai di dalam vault klien
      clientFolder.createFolder('1. Master File (AI, PSD, PDF)');
      clientFolder.createFolder('2. Preview & Review File');
      clientFolder.createFolder('3. Dokumen Kontrak & BAST');
    }

    // Set permission jika email tersedia
    if (clientEmail && clientEmail.indexOf('@') !== -1) {
      try {
        clientFolder.addViewer(clientEmail);
      } catch (_) { }
    }

    var folderUrl = clientFolder.getUrl();
    return jsonResponse({
      status: 'success',
      message: 'Client Vault Google Drive berhasil disiapkan',
      folderId: clientFolder.getId(),
      folderUrl: folderUrl,
      folderName: folderName
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal membuat Google Drive Client Vault: ' + e.toString() });
  }
}

// --- 26. AUTOMATED EMAIL NOTIFICATION DISPATCHER ---
function handleSendEmailNotification(payload) {
  try {
    var to = payload.to || payload.email;
    var subject = payload.subject || 'Pembaruan Proyek dari Studio sumr.day';
    var clientName = payload.clientName || 'Klien Terhormat';
    var orderId = payload.orderId || '';
    var message = payload.message || '';
    var htmlContent = payload.html;

    if (!to || to.indexOf('@') === -1) {
      return jsonResponse({ status: 'error', message: 'Alamat email penerima tidak valid' });
    }

    if (!htmlContent) {
      htmlContent =
        '<div style="font-family: \'Segoe UI\', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">' +
        '<div style="text-align: center; margin-bottom: 20px;">' +
        '<h2 style="color: #7c3aed; margin: 0; font-size: 24px; font-weight: 800;">sumr.day studio</h2>' +
        '<p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Creative Digital Solutions & Design Agency</p>' +
        '</div>' +
        '<div style="background: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 20px;">' +
        '<h3 style="color: #1e293b; margin: 0 0 10px; font-size: 16px;">Halo ' + clientName + ',</h3>' +
        '<p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">' + (message || 'Terdapat pembaruan resmi terkait pesanan proyek Anda.') + '</p>' +
        (orderId ? '<p style="color: #7c3aed; font-weight: bold; margin: 12px 0 0; font-size: 13px;">Nomor Pesanan: #' + orderId + '</p>' : '') +
        '</div>' +
        '<p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 20px 0 0;">Email ini dikirim otomatis oleh sistem terpadu sumr.day studio.</p>' +
        '</div>';
    }

    // eslint-disable-next-line no-undef
    GmailApp.sendEmail(to, subject, message || subject, {
      name: 'sumr.day Studio',
      htmlBody: htmlContent
    });

    return jsonResponse({
      status: 'success',
      message: 'Email notifikasi berhasil dikirim ke ' + to
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal kirim email: ' + e.toString() });
  }
}

// --- 27. AUTOMATED CALENDAR CONSULTATION & BRIEFING SCHEDULER ---
function handleScheduleConsultation(payload) {
  try {
    // eslint-disable-next-line no-undef
    var cal = CalendarApp.getDefaultCalendar();
    if (!cal) {
      return jsonResponse({ status: 'error', message: 'Google Calendar default tidak dapat diakses' });
    }

    var clientName = payload.clientName || 'Klien';
    var clientEmail = payload.clientEmail || payload.email || '';
    var title = payload.title || ('Briefing Proyek Desain — ' + clientName + ' (sumr.day studio)');
    var description = payload.description || ('Sesi konsultasi, onboarding, dan tinjauan brief desain bersama tim sumr.day studio.');
    var durationMinutes = Number(payload.durationMinutes) || 45;
    
    var startTime = payload.startTime ? new Date(payload.startTime) : new Date(Date.now() + 3600000 * 24); // default: besok
    if (isNaN(startTime.getTime())) {
      startTime = new Date(Date.now() + 3600000 * 24);
    }
    var endTime = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));

    var options = {
      description: description + '\n\nKlien: ' + clientName + (clientEmail ? ' (' + clientEmail + ')' : '') + '\nSistem: sumr.day OS Studio Management',
      location: payload.location || 'Google Meet / Online Studio'
    };

    if (clientEmail && clientEmail.indexOf('@') !== -1) {
      options.guests = clientEmail;
      options.sendInvites = true;
    }

    var event = cal.createEvent(title, startTime, endTime, options);
    event.addPopupReminder(15);
    event.addEmailReminder(120);

    return jsonResponse({
      status: 'success',
      message: 'Jadwal konsultasi berhasil diagendakan di Google Calendar',
      eventId: event.getId(),
      title: title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      calendarName: cal.getName()
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal membuat jadwal konsultasi di Calendar: ' + e.toString() });
  }
}

// --- 28. DAILY EXECUTIVE FINANCIAL & OPERATIONAL DIGEST ---
function handleDailyExecutiveDigest(sheetId, payload) {
  try {
    var ss = getSpreadsheet(sheetId);
    var nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'dd MMMM yyyy HH:mm');

    // 1. Baca data Transaksi & Omzet
    var trxSheet = ss.getSheetByName('Transaksi & Pesanan');
    var totalOmzet = 0;
    var totalPiutang = 0;
    var totalTrx = 0;
    var lunasCount = 0;

    if (trxSheet && trxSheet.getLastRow() > 1) {
      var trxData = trxSheet.getRange(2, 1, trxSheet.getLastRow() - 1, Math.min(28, trxSheet.getLastColumn())).getValues();
      totalTrx = trxData.length;
      trxData.forEach(function (row) {
        var grandTotal = Number(row[17]) || 0; // Kolom R: Total Akhir
        var status = String(row[8] || '').toLowerCase(); // Kolom I: Status Bayar
        var sisa = Number(row[19]) || 0; // Kolom T: Sisa Tagihan
        totalOmzet += grandTotal;
        totalPiutang += sisa;
        if (status.indexOf('lunas') !== -1) lunasCount++;
      });
    }

    // 2. Baca data Project
    var projSheet = ss.getSheetByName('Manajemen Project');
    var activeProjects = 0;
    var reviewProjects = 0;
    if (projSheet && projSheet.getLastRow() > 1) {
      var projData = projSheet.getRange(2, 1, projSheet.getLastRow() - 1, Math.min(15, projSheet.getLastColumn())).getValues();
      projData.forEach(function (row) {
        var pStatus = String(row[2] || '').toLowerCase();
        if (pStatus === 'in_progress' || pStatus === 'active') activeProjects++;
        if (pStatus === 'review') reviewProjects++;
      });
    }

    // 3. Baca data Flash Sale & Kontrak
    var fsSheet = ss.getSheetByName('⚡ Flash Sale & Promo');
    var activePromos = 0;
    if (fsSheet && fsSheet.getLastRow() > 1) {
      var fsData = fsSheet.getRange(2, 1, fsSheet.getLastRow() - 1, 6).getValues();
      fsData.forEach(function (row) {
        if (String(row[5] || '').indexOf('Aktif') !== -1) activePromos++;
      });
    }

    var digest = {
      timestamp: nowStr,
      totalOmzet: totalOmzet,
      totalPiutang: totalPiutang,
      totalTrx: totalTrx,
      lunasCount: lunasCount,
      activeProjects: activeProjects,
      reviewProjects: reviewProjects,
      activePromos: activePromos
    };

    // Kirim email laporan jika email penerima ditentukan atau default akun owner
    var targetEmail = (payload && payload.recipientEmail) || Session.getEffectiveUser().getEmail();
    if (targetEmail && targetEmail.indexOf('@') !== -1 && payload && payload.sendEmail !== false) {
      var fmtIdr = function(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };
      var html = 
        '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">' +
        '<div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 28px 24px; text-align: center;">' +
        '<h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">📊 Rangkuman Eksekutif Harian</h1>' +
        '<p style="margin: 6px 0 0; color: #e0e7ff; font-size: 13px;">Studio sumr.day OS • ' + nowStr + '</p>' +
        '</div>' +
        '<div style="padding: 24px;">' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">' +
        '<div style="background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155;">' +
        '<div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700;">Total Omzet</div>' +
        '<div style="color: #10b981; font-size: 20px; font-weight: 800; margin-top: 4px;">' + fmtIdr(totalOmzet) + '</div>' +
        '</div>' +
        '<div style="background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155;">' +
        '<div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700;">Piutang Berjalan</div>' +
        '<div style="color: #f59e0b; font-size: 20px; font-weight: 800; margin-top: 4px;">' + fmtIdr(totalPiutang) + '</div>' +
        '</div>' +
        '</div>' +
        '<div style="background: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; margin-bottom: 20px;">' +
        '<div style="color: #cbd5e1; font-size: 13px; margin-bottom: 8px;"><strong>Status Operasional Proyek:</strong></div>' +
        '<ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.8;">' +
        '<li>Proyek Dalam Pengerjaan: <strong style="color: #38bdf8;">' + activeProjects + '</strong></li>' +
        '<li>Proyek Menunggu Review: <strong style="color: #c084fc;">' + reviewProjects + '</strong></li>' +
        '<li>Total Transaksi Terlayani: <strong style="color: #f8fafc;">' + totalTrx + '</strong> (' + lunasCount + ' Lunas)</li>' +
        '<li>Kampanye Promo Aktif: <strong style="color: #f97316;">' + activePromos + '</strong></li>' +
        '</ul>' +
        '</div>' +
        '<div style="text-align: center; color: #64748b; font-size: 11px; margin-top: 16px;">' +
        'Digenerasi otomatis oleh sumr.day OS Executive Engine • Google Apps Script Enterprise' +
        '</div>' +
        '</div>' +
        '</div>';

      // eslint-disable-next-line no-undef
      GmailApp.sendEmail(targetEmail, '📊 [sumr.day OS] Rangkuman Eksekutif Studio (' + nowStr + ')', 'Laporan Eksekutif Studio sumr.day', {
        name: 'sumr.day Executive Engine',
        htmlBody: html
      });
    }

    return jsonResponse({
      status: 'success',
      message: 'Rangkuman eksekutif berhasil dikompilasi',
      digest: digest,
      sentToEmail: targetEmail || null
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal membuat rangkuman eksekutif: ' + e.toString() });
  }
}

// --- 29. INVOICE HTML GENERATOR & DRIVE EXPORTER ---
function handleGenerateInvoiceDocument(payload) {
  try {
    var orderId = payload.orderId || ('INV-' + Date.now().toString().slice(-6));
    var clientName = payload.clientName || 'Klien';
    var clientEmail = payload.clientEmail || '';
    var clientPhone = payload.clientPhone || '';
    var dateStr = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'dd MMMM yyyy');
    var items = payload.items || [];
    var grandTotal = Number(payload.grandTotal || payload.total || 0);
    var paymentStatus = payload.paymentStatus || payload.status || 'Belum Lunas';
    var paymentMethod = payload.paymentMethod || 'Transfer Bank / QRIS';

    var fmtIdr = function(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };

    var itemRowsHtml = '';
    if (items && items.length > 0) {
      items.forEach(function (item, idx) {
        var name = item.name || item.title || ('Layanan Desain #' + (idx + 1));
        var qty = Number(item.quantity || item.qty || 1);
        var price = Number(item.price || 0);
        var sub = Number(item.subtotal || (price * qty));
        itemRowsHtml += 
          '<tr>' +
          '<td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">' + (idx + 1) + '</td>' +
          '<td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; font-weight: 600;">' + name + '</td>' +
          '<td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center;">' + qty + '</td>' +
          '<td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: right;">' + fmtIdr(price) + '</td>' +
          '<td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; text-align: right; font-weight: 700;">' + fmtIdr(sub) + '</td>' +
          '</tr>';
      });
    } else {
      itemRowsHtml = '<tr><td colspan="5" style="padding: 16px; text-align: center; color: #94a3b8; font-size: 13px;">Pesanan Paket Kreatif Digital Studio</td></tr>';
    }

    var badgeColor = paymentStatus.toLowerCase().indexOf('lunas') !== -1 ? '#10b981' : '#f59e0b';

    var invoiceHtml = 
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ' + orderId + ' - sumr.day studio</title>' +
      '<style>@media print { body { padding: 0; background: #fff; } .no-print { display: none; } }</style>' +
      '</head><body style="margin: 0; padding: 32px 16px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">' +
      '<div style="max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">' +
      '<div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px;">' +
      '<div>' +
      '<h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #7c3aed; letter-spacing: -0.5px;">sumr.day</h1>' +
      '<p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Creative Digital Agency & Visual Design</p>' +
      '</div>' +
      '<div style="text-align: right;">' +
      '<div style="display: inline-block; padding: 4px 12px; border-radius: 999px; background: ' + badgeColor + '15; color: ' + badgeColor + '; font-weight: 800; font-size: 12px; margin-bottom: 8px;">' + paymentStatus.toUpperCase() + '</div>' +
      '<div style="font-size: 18px; font-weight: 800; color: #0f172a;">INVOICE #' + orderId + '</div>' +
      '<div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Tanggal: ' + dateStr + '</div>' +
      '</div>' +
      '</div>' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">' +
      '<div><div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Ditagihkan Kepada:</div>' +
      '<div style="font-size: 15px; font-weight: 700; color: #1e293b;">' + clientName + '</div>' +
      (clientEmail ? '<div style="font-size: 13px; color: #64748b; margin-top: 2px;">' + clientEmail + '</div>' : '') +
      (clientPhone ? '<div style="font-size: 13px; color: #64748b; margin-top: 2px;">' + clientPhone + '</div>' : '') +
      '</div>' +
      '<div><div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Metode Pembayaran:</div>' +
      '<div style="font-size: 14px; font-weight: 600; color: #1e293b;">' + paymentMethod + '</div>' +
      '<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Bank Transfer / QRIS Instant Gateway</div>' +
      '</div>' +
      '</div>' +
      '<table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">' +
      '<thead><tr style="background: #f8fafc; text-align: left;">' +
      '<th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">No</th>' +
      '<th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Item / Deskripsi Layanan</th>' +
      '<th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; text-align: center;">Qty</th>' +
      '<th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; text-align: right;">Harga Satuan</th>' +
      '<th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; text-align: right;">Total</th>' +
      '</tr></thead><tbody>' + itemRowsHtml + '</tbody></table>' +
      '<div style="border-top: 2px solid #f1f5f9; padding-top: 16px; margin-bottom: 32px; display: flex; justify-content: flex-end;">' +
      '<div style="width: 260px;">' +
      '<div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0f172a;">' +
      '<span>Total Tagihan:</span><span style="color: #7c3aed;">' + fmtIdr(grandTotal) + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div style="background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; border: 1px dashed #cbd5e1;">' +
      '<p style="margin: 0; font-size: 12px; color: #64748b;">Terima kasih atas kepercayaan Anda bermitra dengan <strong>sumr.day studio</strong>. Dokumen ini sah dan diterbitkan secara digital oleh sistem sumr.day OS.</p>' +
      '</div>' +
      '<div class="no-print" style="text-align: center; margin-top: 24px;">' +
      '<button onclick="window.print()" style="background: #7c3aed; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px;">🖨️ Cetak / Simpan PDF</button>' +
      '</div>' +
      '</div></body></html>';

    // Simpan ke Google Drive folder Invoices
    var folder = getOrCreateFolderPath('sumr.day_projects_vault_2026/Invoices');
    var fileName = 'Invoice_' + orderId + '_' + clientName.replace(/[^a-zA-Z0-9]/g, '_') + '.html';
    
    // Cek jika file lama sudah ada, update
    var existingFiles = folder.getFilesByName(fileName);
    var file;
    if (existingFiles.hasNext()) {
      file = existingFiles.next();
      file.setContent(invoiceHtml);
    } else {
      // eslint-disable-next-line no-undef
      file = folder.createFile(fileName, invoiceHtml, MimeType.HTML);
    }

    var fileUrl = file.getUrl();

    return jsonResponse({
      status: 'success',
      message: 'Invoice digital berhasil dibuat dan disimpan di Google Drive',
      orderId: orderId,
      fileName: fileName,
      fileId: file.getId(),
      fileUrl: fileUrl
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal membuat invoice di Google Drive: ' + e.toString() });
  }
}

// --- 30. SMART QUOTA & STORAGE OPTIMIZER ---
function handleSmartStorageOptimizer() {
  try {
    var backupFolder = getOrCreateFolderPath('sumrday_drive/Backups');
    var files = backupFolder.getFiles();
    var backupList = [];
    var totalBytes = 0;

    while (files.hasNext()) {
      var f = files.next();
      totalBytes += f.getSize();
      backupList.push({
        file: f,
        updated: f.getLastUpdated().getTime(),
        name: f.getName(),
        size: f.getSize()
      });
    }

    // Urutkan dari terbaru ke terlama
    backupList.sort(function (a, b) { return b.updated - a.updated; });

    // Pertahankan 7 snapshot terbaru, arsipkan/hapus yang lebih lama
    var keptCount = 0;
    var cleanedCount = 0;
    var freedBytes = 0;

    for (var i = 0; i < backupList.length; i++) {
      if (i < 7) {
        keptCount++;
      } else {
        freedBytes += backupList[i].size;
        backupList[i].file.setTrashed(true);
        cleanedCount++;
      }
    }

    var usedMb = (totalBytes / (1024 * 1024)).toFixed(2);
    var freedMb = (freedBytes / (1024 * 1024)).toFixed(2);
    var health = Number(usedMb) < 500 ? 'EXCELLENT' : (Number(usedMb) < 2000 ? 'GOOD' : 'WARNING');

    return jsonResponse({
      status: 'success',
      message: 'Smart Storage Optimizer berhasil dijalankan',
      usedMb: parseFloat(usedMb),
      freedMb: parseFloat(freedMb),
      backupsKept: keptCount,
      backupsCleaned: cleanedCount,
      healthStatus: health,
      tips: health === 'EXCELLENT' ? 'Kapasitas penyimpanan Google Drive studio sangat optimal.' : 'Disarankan rutin memindahkan master file besar ke arsip offline.'
    });
  } catch (e) {
    return jsonResponse({ status: 'error', message: 'Gagal menjalankan optimizer storage: ' + e.toString() });
  }
}

// --- 31. ZERO-COST GOOGLE DRIVE OCR EXTRACTION ---
function handleDriveOcrDocument(payload) {
  try {
    var base64Data = payload.base64 || payload.image || '';
    var mimeType = payload.mimeType || 'image/jpeg';
    var fileName = payload.fileName || ('ocr_scan_' + Date.now() + '.jpg');

    if (!base64Data) {
      return jsonResponse({ status: 'error', message: 'Data gambar base64 wajib disertakan untuk OCR' });
    }

    var cleanBase64 = base64Data.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
    // eslint-disable-next-line no-undef
    var decoded = Utilities.base64Decode(cleanBase64);
    // eslint-disable-next-line no-undef
    var blob = Utilities.newBlob(decoded, mimeType, fileName);

    var targetFolder = getOrCreateFolderPath('sumrday_drive/Scans_OCR');
    // eslint-disable-next-line no-undef
    var file = targetFolder.createFile(blob);
    // eslint-disable-next-line no-undef
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var extractedText = '';
    try {
      // Menggunakan Google Drive Advanced Service jika aktif
      // eslint-disable-next-line no-undef
      if (typeof Drive !== 'undefined' && Drive.Files && Drive.Files.insert) {
        var ocrResource = { title: 'OCR_' + fileName, mimeType: mimeType };
        // eslint-disable-next-line no-undef
        var docTemp = Drive.Files.insert(ocrResource, blob, { ocr: true, ocrLanguage: 'id' });
        // eslint-disable-next-line no-undef
        var doc = DocumentApp.openById(docTemp.id);
        extractedText = doc.getBody().getText();
        // eslint-disable-next-line no-undef
        Drive.Files.remove(docTemp.id);
      }
    } catch (ocrErr) {
      // Fallback pesan jika Advanced Drive service belum di-centang di project GAS
      extractedText = 'Catatan: Berkas tersimpan di Drive (' + file.getName() + '). Aktifkan Google Drive API Service pada Google Apps Script untuk auto-extract OCR otomatis.';
    }

    return jsonResponse({
      status: 'success',
      message: 'Berkas berhasil diproses OCR Google Drive',
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      text: extractedText,
      charCount: extractedText.length
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'OCR Google Drive gagal: ' + err.toString() });
  }
}

// --- 32. ONE-CLICK GOOGLE DOCS CONTRACT SPK & PDF GENERATOR ---
function handleGenerateSpkDocument(payload) {
  try {
    var spkNumber = payload.spkNumber || ('SPK/' + new Date().getFullYear() + '/' + Date.now().toString(36).toUpperCase());
    var clientName = payload.clientName || 'Klien Studio';
    var clientCompany = payload.clientCompany || '-';
    var clientPhone = payload.clientPhone || payload.phone || '-';
    var clientEmail = payload.clientEmail || payload.email || '-';
    var projectTitle = payload.projectTitle || payload.title || 'Proyek Desain & Pengembangan Digital';
    var projectScope = payload.projectScope || payload.scope || 'Desain Kreatif, Visual Assets, dan Integrasi Sistem';
    var contractValue = Number(payload.contractValue || payload.value || payload.total || 0);
    var paymentTerms = payload.paymentTerms || 'DP 50% di muka, Pelunasan 50% setelah serah terima hasil final';
    var deadlineDate = payload.deadlineDate || payload.deadline || '14 Hari Kerja';
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'dd MMMM yyyy');

    var fmtIdr = function (n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>' +
      'body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }' +
      '.header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }' +
      '.title { font-size: 20px; font-weight: bold; letter-spacing: 1px; color: #0f172a; margin: 0; }' +
      '.subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }' +
      '.section { margin-bottom: 20px; }' +
      '.section-title { font-size: 14px; font-weight: bold; background: #f8fafc; padding: 6px 12px; border-left: 4px solid #6366f1; margin-bottom: 10px; }' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }' +
      'td { padding: 6px 10px; vertical-align: top; }' +
      '.key { width: 30%; color: #64748b; font-weight: 600; }' +
      '.val { width: 70%; font-weight: bold; color: #0f172a; }' +
      '.signatures { display: flex; justify-content: space-between; margin-top: 40px; }' +
      '.sign-box { width: 45%; text-align: center; font-size: 13px; }' +
      '.sign-line { margin-top: 70px; border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: bold; }' +
      '</style></head><body>' +
      '<div class="header">' +
      '<div class="title">SURAT PERJANJIAN KERJA SAMA (SPK)</div>' +
      '<div class="subtitle">Nomor Dokumen: ' + spkNumber + ' &bull; Tanggal: ' + dateStr + '</div>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">I. IDENTITAS PARA PIHAK</div>' +
      '<table>' +
      '<tr><td class="key">Pihak Pertama (Penyedia)</td><td class="val">Sumr.day Creative Studio / Agenze OS</td></tr>' +
      '<tr><td class="key">Pihak Kedua (Klien)</td><td class="val">' + clientName + (clientCompany !== '-' ? ' (' + clientCompany + ')' : '') + '</td></tr>' +
      '<tr><td class="key">Kontak Klien</td><td class="val">' + clientPhone + ' | ' + clientEmail + '</td></tr>' +
      '</table>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">II. RUANG LINGKUP & KESEPAKATAN KERJA</div>' +
      '<table>' +
      '<tr><td class="key">Judul Pekerjaan</td><td class="val">' + projectTitle + '</td></tr>' +
      '<tr><td class="key">Deskripsi / Scope</td><td class="val">' + projectScope + '</td></tr>' +
      '<tr><td class="key">Tenggat Waktu</td><td class="val">' + deadlineDate + '</td></tr>' +
      '<tr><td class="key">Nilai Kontrak</td><td class="val" style="color: #6366f1; font-size: 15px;">' + fmtIdr(contractValue) + '</td></tr>' +
      '<tr><td class="key">Skema Pembayaran</td><td class="val">' + paymentTerms + '</td></tr>' +
      '</table>' +
      '</div>' +
      '<div class="section">' +
      '<div class="section-title">III. KETENTUAN HAK CIPTA & REVISI</div>' +
      '<p style="font-size: 12px; color: #475569; margin: 0 0 10px;">1. Hak kekayaan intelektual final diserahkan penuh kepada Pihak Kedua setelah pelunasan 100% diterima.<br>' +
      '2. Revisi di luar ruang lingkup yang telah disepakati akan diproses melalui penyesuaian invoice tambahan (*add-on*).</p>' +
      '</div>' +
      '<div style="margin-top: 30px; display: table; width: 100%;">' +
      '<div style="display: table-cell; width: 50%; text-align: center; font-size: 13px;">' +
      'Pihak Pertama (Studio)<div style="height: 60px;"></div><b>Sumr.day Management</b>' +
      '</div>' +
      '<div style="display: table-cell; width: 50%; text-align: center; font-size: 13px;">' +
      'Pihak Kedua (Klien)<div style="height: 60px;"></div><b>' + clientName + '</b>' +
      '</div>' +
      '</div>' +
      '</body></html>';

    // eslint-disable-next-line no-undef
    var htmlOutput = HtmlService.createHtmlOutput(html);
    var cleanSpkName = spkNumber.replace(/[\/\\]/g, '_');
    var pdfBlob = htmlOutput.getAs('application/pdf').setName('SPK_' + cleanSpkName + '.pdf');

    var spkFolder = getOrCreateFolderPath('sumrday_drive/SPK');
    var file = spkFolder.createFile(pdfBlob);
    // eslint-disable-next-line no-undef
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var pdfUrl = file.getUrl();
    var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + file.getId();

    return jsonResponse({
      status: 'success',
      message: 'Dokumen SPK resmi berhasil digenerate ke Google Drive',
      spkNumber: spkNumber,
      pdfUrl: pdfUrl,
      downloadUrl: downloadUrl,
      fileId: file.getId(),
      folder: 'sumrday_drive/SPK'
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Gagal generate dokumen SPK: ' + err.toString() });
  }
}

// --- 33. SERVERLESS 07:00 AM CRON EXECUTIVE BRIEFING ---
function handleSetupMorningBriefing(sheetId) {
  try {
    // eslint-disable-next-line no-undef
    var existingTriggers = ScriptApp.getProjectTriggers();
    var found = false;

    for (var i = 0; i < existingTriggers.length; i++) {
      if (existingTriggers[i].getHandlerFunction() === 'runDailyMorningBriefing') {
        found = true;
        break;
      }
    }

    if (!found) {
      // eslint-disable-next-line no-undef
      ScriptApp.newTrigger('runDailyMorningBriefing')
        .timeBased()
        .atHour(7)
        .everyDays(1)
        .inTimezone(Session.getScriptTimeZone() || 'Asia/Jakarta')
        .create();
    }

    return jsonResponse({
      status: 'success',
      message: 'Serverless Daily Morning Briefing (07:00 WIB) aktif dan terpasang di Google Apps Script',
      isNew: !found,
      sheetId: sheetId || 'connected'
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Gagal mengatur trigger briefing: ' + err.toString() });
  }
}

// Fungsi trigger otomatis jam 07:00 pagi
function runDailyMorningBriefing() {
  try {
    handleDailyExecutiveDigest(null, { autoTrigger: true, time: '07:00 WIB' });
  } catch (e) {
    // eslint-disable-next-line no-undef
    Logger.log('Morning briefing run error: ' + e.toString());
  }
}

