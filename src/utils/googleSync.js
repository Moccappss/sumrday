import { storage } from './storage';
import { GOOGLE_CONFIG } from '../config/AppConfig';

const GAS_LIMIT_BYTES = 11534336; // 11MB limit

export function extractSheetId(input) {
  const val = input || GOOGLE_CONFIG.sheetId;
  if (!val) return '';
  const trimmed = String(val).trim();
  // Support if user pasted full Google Sheets URL
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : trimmed;
}

export function sanitizeScriptUrl(url) {
  let val = url || GOOGLE_CONFIG.appsScriptUrl;
  if (!val) return '';
  val = String(val).trim();
  if (_failed404Url && val === _failed404Url && GOOGLE_CONFIG.appsScriptUrl && GOOGLE_CONFIG.appsScriptUrl !== _failed404Url) {
    return String(GOOGLE_CONFIG.appsScriptUrl).trim();
  }
  return val;
}

/**
 * Client-Side Image Pre-Compressor for Google Drive Uploads
 * Mengubah format gambar (JPEG/PNG) menjadi WebP berukuran ringkas sebelum di-upload ke Google Drive
 * Menghemat lebih dari 90% kuota Google Drive dan mempercepat waktu sync
 */
export async function compressImageForDrive(file, maxWidth = 1920, quality = 0.82) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const originalName = file.name || 'image';
            const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
            const compressed = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(compressed);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}


let _failed404Url = null;
let _isGas404OfflineLogged = false;
let _lastDriveBackupSignature = '';

async function safeFetchGAS(scriptUrl, payload, notify) {
  const cleanUrl = sanitizeScriptUrl(scriptUrl);
  if (!cleanUrl) {
    const errMsg = '⚠️ URL Google Apps Script belum diatur di Pengaturan Global (Integrasi Cloud).';
    if (notify) notify(errMsg, 'error');
    throw new Error(errMsg);
  }

  // If a previously failed 404 URL is being called again in background auto-sync without manual trigger, suppress it
  if (_failed404Url && cleanUrl === _failed404Url && !notify) {
    return null;
  }

  // Reset 404 block if URL changed or if manually triggered with notify
  if (cleanUrl !== _failed404Url) {
    _failed404Url = null;
    _isGas404OfflineLogged = false;
  }

  // Detect if user is using the /dev test deployment URL
  if (cleanUrl.endsWith('/dev')) {
    const errMsg = '⚠️ Anda memasukkan URL /dev (Test Deployment). Google Apps Script memblokir akses /dev untuk web app. Silakan buat "New Deployment" tipe "Web app" dengan akses "Anyone", lalu gunakan link berakhiran /exec.';
    if (notify) notify(errMsg, 'error');
    throw new Error(errMsg);
  }

  const bodyString = JSON.stringify(payload);
  const payloadSize = new Blob([bodyString]).size;

  if (payloadSize > GAS_LIMIT_BYTES) {
    const sizeMB = (payloadSize / (1024 * 1024)).toFixed(2);
    const limitMB = (GAS_LIMIT_BYTES / (1024 * 1024)).toFixed(2);
    const errMsg = `⚠️ Ukuran data database terlalu besar (${sizeMB} MB) untuk batas Google Apps Script (${limitMB} MB). Ini biasanya disebabkan oleh unggahan gambar beresolusi tinggi secara offline (Base64) pada Halaman/Stiker. Harap bersihkan data tidak penting atau gunakan Cloudinary agar file tersimpan di awan secara optimal.`;
    if (notify) notify(errMsg, 'error');
    throw new Error(errMsg);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyString,
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 404 || text.includes('Halaman Tidak Ditemukan') || text.includes('Page Not Found') || text.includes('Maaf, saat ini tidak dapat membuka file')) {
        _failed404Url = cleanUrl;
        const errMsg = '⚠️ URL Google Apps Script tidak ditemukan (Status 404). Pastikan Web App Google Apps Script sudah di-deploy sebagai Web App ("New Deployment" dengan Who has access: Anyone) dan URL berakhiran /exec di Pengaturan Global.';
        if (notify) {
          notify(errMsg, 'error');
        } else if (!_isGas404OfflineLogged) {
          console.warn('[AutoSync] Background sync paused: Google Apps Script URL returned 404. Update the URL in Global Settings or .env.');
          _isGas404OfflineLogged = true;
        }
        if (!notify) return null;
        throw new Error(errMsg);
      }
      if (text.includes('exceeds the limit') || response.status === 400) {
        const errMsg = `⚠️ Gagal: Ukuran request melebihi batas keras Google Apps Script (11MB). Harap kurangi aset offline atau pindahkan aset gambar ke Cloudinary.`;
        if (notify) notify(errMsg, 'error');
        throw new Error(errMsg);
      }
      const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE html');
      const cleanError = isHtml ? `Google Apps Script Error (Status ${response.status})` : text;
      throw new Error(cleanError || `Server error: ${response.status}`);
    }

    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      const errMsg = '⚠️ Koneksi ke Google Apps Script timeout (melebihi 45 detik). Silakan periksa koneksi internet atau coba beberapa saat lagi.';
      if (notify) notify(errMsg, 'error');
      throw new Error(errMsg);
    }
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError')) {
      const errMsg = '⚠️ Gagal terhubung ke Google Apps Script. Pastikan Web App di-deploy dengan akses "Who has access: Anyone" dan gunakan URL yang berakhiran /exec (bukan /dev).';
      if (notify) notify(errMsg, 'error');
      throw new Error(errMsg);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Utilitas untuk Sinkronisasi Google Drive & Sheets via Apps Script Bridge
 * VERSI LANJUTAN: Mendukung Upload File & Multi-Tab
 */
export const googleSync = {
  /**
   * Mengirim backup semua data ke Google Drive
   */
  async backupToDrive(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);

      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur di Pengaturan Global.', 'error');
        return false;
      }

      if (notify) notify('⏳ Menyimpan seluruh Master Database ke Google Drive...');

      const [
        projects, pages, stickers, frames, whiteboard,
        notes, memos, memoFolders, blogPosts, blogs, shopProducts, catalog,
        catalogProducts, catalogCategories, catalogVouchers,
        transactions, bookings, bookingSettings, biodata, mainWebsite, gallery, mediaVault, vaultFolders,
        links, users, contacts, chatMessages, trxDiscounts, trxCustomers, trxSettings,
        activityLogs, forms, formResponses, socialUpdates, businessProfile,
        rateCards, rateCardAddons, clientReviews, clientFeedbacks, clientFaqs,
        portfolioWorks, customGames, gameLicenses, kanbanColumns, projectCategories,
        invitationsList, invitationMakerData,
        clientFlipbooks, proofingProjects, contractsSpk, partnerships, flashSales,
        contentPlans, crmLeads, whatsappTemplates, customPages, brandVaults,
        clientVaultFiles, quickTodos, studioInquiries, projectReminders
      ] = await Promise.all([
        storage.getItem('porto_projects', []),
        storage.getItem('porto_pages', {}),
        storage.getItem('porto_stickers', {}),
        storage.getItem('porto_frames', {}),
        storage.getItem('porto_whiteboard_canvases', []),
        storage.getItem('porto_memo_notes', []),
        storage.getItem('porto_memos', []),
        storage.getItem('porto_memo_folders', []),
        storage.getItem('porto_blog_posts', []),
        storage.getItem('porto_blogs', []),
        storage.getItem('porto_shop_products', []),
        storage.getItem('porto_catalog', []),
        storage.getItem('porto_catalog_products', []),
        storage.getItem('porto_catalog_categories', []),
        storage.getItem('porto_catalog_vouchers', []),
        storage.getItem('porto_transactions', []),
        storage.getItem('porto_bookings', []),
        storage.getItem('porto_booking_settings', {}),
        storage.getItem('porto_biodata', {}),
        storage.getItem('porto_main_website', null),
        storage.getItem('porto_media_gallery', []),
        storage.getItem('porto_media_vault', []),
        storage.getItem('porto_vault_folders', []),
        storage.getItem('porto_links', []),
        storage.getItem('porto_users', []),
        storage.getItem('porto_contacts', []),
        storage.getItem('porto_chat_messages', []),
        storage.getItem('porto_trx_discounts', []),
        storage.getItem('porto_trx_customers', []),
        storage.getItem('porto_trx_settings', {}),
        storage.getItem('porto_activity_logs', []),
        storage.getItem('porto_forms', []),
        storage.getItem('porto_form_responses', {}),
        storage.getItem('porto_social_updates', []),
        storage.getItem('porto_business_profile', null),
        storage.getItem('porto_rate_cards', []),
        storage.getItem('porto_rate_card_addons', []),
        storage.getItem('porto_client_reviews', []),
        storage.getItem('porto_client_feedbacks', []),
        storage.getItem('porto_client_faqs', []),
        storage.getItem('porto_portfolio', []),
        storage.getItem('porto_custom_games', []),
        storage.getItem('porto_game_licenses', []),
        storage.getItem('porto_kanban_columns', []),
        storage.getItem('porto_project_categories', []),
        storage.getItem('porto_invitations_list', []),
        storage.getItem('porto_invitation_maker_data', null),
        storage.getItem('porto_client_flipbooks', []),
        storage.getItem('porto_proofing_projects', []),
        storage.getItem('porto_contracts_spk', []),
        storage.getItem('porto_partnerships', []),
        storage.getItem('porto_flash_sales', []),
        storage.getItem('porto_content_plans', []),
        storage.getItem('porto_crm_leads', []),
        storage.getItem('porto_whatsapp_templates', []),
        storage.getItem('porto_custom_pages', []),
        storage.getItem('porto_brand_vaults', []),
        storage.getItem('porto_client_vault_files', []),
        storage.getItem('porto_quick_todos', []),
        storage.getItem('porto_studio_inquiries', []),
        storage.getItem('porto_project_reminders', [])
      ]);

      // Custom Templates & Categories from localStorage
      const getLocalJson = (k, fallback = []) => {
        try {
          if (typeof localStorage === 'undefined') return fallback;
          const val = localStorage.getItem(k);
          return val ? JSON.parse(val) : fallback;
        } catch { return fallback; }
      };

      const customTemplates = {
        projectTemplates: getLocalJson('agenze_custom_project_templates'),
        projectCategories: getLocalJson('agenze_custom_project_categories'),
        websiteTemplates: getLocalJson('agenze_custom_website_templates'),
        websiteCategories: getLocalJson('agenze_custom_website_categories'),
        noteTemplates: getLocalJson('agenze_custom_note_templates'),
        noteCategories: getLocalJson('agenze_custom_note_categories'),
        blogTemplates: getLocalJson('agenze_custom_blog_templates'),
        blogCategories: getLocalJson('agenze_custom_blog_categories')
      };

      const themeSettings = {
        accentColor: (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || '#7c3aed',
        themePalette: (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_theme_palette') : null) || 'indigo',
        themeMode: (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_theme_mode') : null) || 'system',
        customPalettes: getLocalJson('porto_custom_palettes', []),
        weatherMode: (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_weather_mode') : null) || 'auto'
      };

      const currentUser = storage.getCurrentUser ? storage.getCurrentUser() : { uid: null, scope: 'global' };
      const isPrivateUser = currentUser.scope === 'private' && currentUser.uid;
      const folderCategory = isPrivateUser ? `Users/${currentUser.uid}` : 'Admin';
      const fileName = isPrivateUser ? `user_database_${currentUser.uid}.json` : 'sumrday_master_backup_LATEST.json';

      const backupData = {
        version: '3.0-complete-master-drive',
        exportedAt: new Date().toISOString(),
        userContext: {
          uid: currentUser.uid || 'master_admin',
          scope: currentUser.scope,
          folderCategory,
          fileName
        },
        porto_settings: settings,
        porto_biodata: biodata,
        porto_projects: projects,
        porto_pages: pages,
        porto_stickers: stickers,
        porto_frames: frames,
        porto_whiteboard_canvases: whiteboard,
        porto_memo_notes: (notes && notes.length > 0) ? notes : memos,
        porto_memo_folders: memoFolders,
        porto_blog_posts: (blogPosts && blogPosts.length > 0) ? blogPosts : blogs,
        porto_catalog_products: (catalogProducts && catalogProducts.length > 0) ? catalogProducts : ((catalog && catalog.length > 0) ? catalog : shopProducts),
        porto_catalog_categories: catalogCategories,
        porto_catalog_vouchers: catalogVouchers,
        porto_transactions: transactions,
        porto_trx_discounts: trxDiscounts,
        porto_trx_customers: trxCustomers,
        porto_trx_settings: trxSettings,
        porto_chat_messages: chatMessages,
        porto_bookings: bookings,
        porto_booking_settings: bookingSettings,
        porto_main_website: mainWebsite,
        porto_media_gallery: gallery,
        porto_media_vault: mediaVault,
        porto_vault_folders: vaultFolders,
        porto_links: links,
        porto_users: users,
        porto_contacts: contacts,
        porto_activity_logs: Array.isArray(activityLogs) ? activityLogs.slice(0, 100) : [],
        porto_forms: forms,
        porto_form_responses: formResponses,
        porto_social_updates: socialUpdates,
        porto_business_profile: businessProfile,
        porto_rate_cards: rateCards,
        porto_rate_card_addons: rateCardAddons,
        porto_client_reviews: clientReviews,
        porto_client_feedbacks: clientFeedbacks,
        porto_client_faqs: clientFaqs,
        porto_portfolio: (portfolioWorks && portfolioWorks.length > 0) ? portfolioWorks : [],
        porto_custom_games: customGames,
        porto_game_licenses: gameLicenses,
        porto_kanban_columns: kanbanColumns,
        porto_project_categories: projectCategories,
        porto_invitations_list: invitationsList,
        porto_invitation_maker_data: invitationMakerData,
        porto_client_flipbooks: clientFlipbooks,
        porto_proofing_projects: proofingProjects,
        porto_contracts_spk: contractsSpk,
        porto_partnerships: partnerships,
        porto_flash_sales: flashSales,
        porto_content_plans: contentPlans,
        porto_crm_leads: crmLeads,
        porto_whatsapp_templates: whatsappTemplates,
        porto_custom_pages: customPages,
        porto_brand_vaults: brandVaults,
        porto_client_vault_files: clientVaultFiles,
        porto_quick_todos: quickTodos,
        porto_studio_inquiries: studioInquiries,
        porto_project_reminders: projectReminders,
        custom_templates: customTemplates,
        theme_settings: themeSettings
      };

      // Deduplicate background auto-backups when data has not changed
      const currentSignature = JSON.stringify({ ...backupData, exportedAt: undefined });
      if (!notify && _lastDriveBackupSignature && _lastDriveBackupSignature === currentSignature) {
        return true;
      }

      const response = await safeFetchGAS(scriptUrl, { 
        action: 'backup', 
        folderCategory,
        fileName,
        userContext: backupData.userContext,
        payload: backupData 
      }, notify);
      if (!response) return false;

      _lastDriveBackupSignature = currentSignature;

      const now = new Date().toISOString();
      await storage.setItem('porto_last_backup', now);
      if (notify) notify(`✅ Seluruh Master Database, Template Kustom & Tema Warna berhasil dibackup ke Google Drive!`);
      return true;
    } catch (err) {
      if (notify) {
        console.error('Backup to Google Drive failed:', err);
        if (!err.message.includes('Ukuran data') && !err.message.includes('melebihi batas') && !err.message.includes('⚠️')) {
          notify('❌ Gagal backup ke Drive: ' + err.message, 'error');
        }
      } else {
        if (!_isGas404OfflineLogged) {
          console.warn('[AutoSync] Background Drive sync paused:', err?.message || err);
          _isGas404OfflineLogged = true;
        }
      }
      return false;
    }
  },

  /**
   * Memulihkan seluruh Master Database dari Google Drive (1-Click Restore)
   */
  async restoreFromDrive(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);

      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return false;
      }

      const currentUser = storage.getCurrentUser ? storage.getCurrentUser() : { uid: null, scope: 'global' };
      const isPrivateUser = currentUser.scope === 'private' && currentUser.uid;
      const folderCategory = isPrivateUser ? `Users/${currentUser.uid}` : 'Admin';
      const fileName = isPrivateUser ? `user_database_${currentUser.uid}.json` : 'sumrday_master_backup_LATEST.json';

      if (notify) notify(`⏳ Mengambil Database (${folderCategory}) dari Google Drive...`);

      const response = await safeFetchGAS(scriptUrl, { 
        action: 'get_backup',
        folderCategory,
        fileName,
        userContext: { uid: currentUser.uid || 'master_admin', scope: currentUser.scope }
      }, notify);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const rawPayload = result.data.payload || result.data;
        const data = rawPayload.collections ? { ...rawPayload, ...rawPayload.collections } : rawPayload;
        const itemsToSave = {};

        const collections = [
          'porto_settings', 'porto_biodata', 'porto_projects', 'porto_pages',
          'porto_stickers', 'porto_frames', 'porto_whiteboard_canvases',
          'porto_memo_notes', 'porto_memos', 'porto_memo_folders', 
          'porto_blog_posts', 'porto_blogs', 'porto_blog', 'porto_shop_products', 'porto_catalog', 
          'porto_catalog_products', 'porto_catalog_categories', 'porto_catalog_vouchers',
          'porto_transactions', 'porto_trx_discounts', 'porto_trx_customers', 'porto_trx_settings',
          'porto_chat_messages', 'porto_bookings', 'porto_booking_settings', 
          'porto_main_website', 'porto_media_gallery', 'porto_media_vault', 'porto_vault_folders', 'porto_links', 
          'porto_users', 'porto_contacts', 'porto_activity_logs',
          'porto_forms', 'porto_form_responses', 'porto_social_updates', 'porto_business_profile',
          'porto_rate_cards', 'porto_rate_card_addons', 'porto_client_reviews', 'porto_client_feedbacks', 'porto_client_faqs',
          'porto_portfolio', 'porto_custom_games', 'porto_games_data', 'porto_game_licenses',
          'porto_kanban_columns', 'porto_project_categories',
          'porto_invitations_list', 'porto_invitation_maker_data',
          'porto_client_flipbooks', 'porto_proofing_projects', 'porto_contracts_spk',
          'porto_partnerships', 'porto_flash_sales', 'porto_content_plans',
          'porto_crm_leads', 'porto_whatsapp_templates', 'porto_custom_pages',
          'porto_brand_vaults', 'porto_client_vault_files', 'porto_quick_todos',
          'porto_studio_inquiries', 'porto_project_reminders'
        ];

        for (const col of collections) {
          if (data[col] !== undefined) {
            itemsToSave[col] = data[col];
          }
        }

        // Restore Custom Templates & Categories
        if (data.custom_templates && typeof localStorage !== 'undefined') {
          const ct = data.custom_templates;
          if (ct.projectTemplates) localStorage.setItem('agenze_custom_project_templates', JSON.stringify(ct.projectTemplates));
          if (ct.projectCategories) localStorage.setItem('agenze_custom_project_categories', JSON.stringify(ct.projectCategories));
          if (ct.websiteTemplates) localStorage.setItem('agenze_custom_website_templates', JSON.stringify(ct.websiteTemplates));
          if (ct.websiteCategories) localStorage.setItem('agenze_custom_website_categories', JSON.stringify(ct.websiteCategories));
          if (ct.noteTemplates) localStorage.setItem('agenze_custom_note_templates', JSON.stringify(ct.noteTemplates));
          if (ct.noteCategories) localStorage.setItem('agenze_custom_note_categories', JSON.stringify(ct.noteCategories));
          if (ct.blogTemplates) localStorage.setItem('agenze_custom_blog_templates', JSON.stringify(ct.blogTemplates));
          if (ct.blogCategories) localStorage.setItem('agenze_custom_blog_categories', JSON.stringify(ct.blogCategories));
        }

        // Restore Theme Settings
        if (data.theme_settings && typeof localStorage !== 'undefined') {
          const ts = data.theme_settings;
          if (ts.accentColor) {
            localStorage.setItem('porto_accent_color', ts.accentColor);
            window.dispatchEvent(new CustomEvent('porto_accent_color_changed', { detail: { color: ts.accentColor } }));
          }
          if (ts.themePalette) localStorage.setItem('porto_theme_palette', ts.themePalette);
          if (ts.themeMode) localStorage.setItem('porto_theme_mode', ts.themeMode);
          if (ts.customPalettes) localStorage.setItem('porto_custom_palettes', JSON.stringify(ts.customPalettes));
          if (ts.weatherMode) localStorage.setItem('porto_weather_mode', ts.weatherMode);
        }

        // Support legacy & alternate schema mappings (Guarantees zero-miss database restore)
        if (data.projects && !itemsToSave['porto_projects']) itemsToSave['porto_projects'] = data.projects;
        if (data.portfolio && !itemsToSave['porto_portfolio']) itemsToSave['porto_portfolio'] = data.portfolio;
        if (data.pages && !itemsToSave['porto_pages']) itemsToSave['porto_pages'] = data.pages;
        if (data.notes && !itemsToSave['porto_memo_notes']) itemsToSave['porto_memo_notes'] = data.notes;
        if (data.porto_memos && !itemsToSave['porto_memo_notes']) itemsToSave['porto_memo_notes'] = data.porto_memos;
        if (data.porto_memo_notes && !itemsToSave['porto_memos']) itemsToSave['porto_memos'] = data.porto_memo_notes;
        if (data.porto_blogs && !itemsToSave['porto_blog_posts']) itemsToSave['porto_blog_posts'] = data.porto_blogs;
        if (data.porto_blog_posts && !itemsToSave['porto_blogs']) itemsToSave['porto_blogs'] = data.porto_blog_posts;
        if (data.porto_blog_posts && !itemsToSave['porto_blog']) itemsToSave['porto_blog'] = data.porto_blog_posts;
        if (data.porto_catalog && !itemsToSave['porto_shop_products']) itemsToSave['porto_shop_products'] = data.porto_catalog;
        if (data.porto_shop_products && !itemsToSave['porto_catalog']) itemsToSave['porto_catalog'] = data.porto_shop_products;
        if (data.porto_catalog && !itemsToSave['porto_catalog_products']) itemsToSave['porto_catalog_products'] = data.porto_catalog;
        if (data.porto_catalog_products && !itemsToSave['porto_catalog']) itemsToSave['porto_catalog'] = data.porto_catalog_products;
        if (data.porto_catalog_products && !itemsToSave['porto_shop_products']) itemsToSave['porto_shop_products'] = data.porto_catalog_products;
        if (data.porto_custom_games && !itemsToSave['porto_games_data']) itemsToSave['porto_games_data'] = data.porto_custom_games;
        if (data.porto_games_data && !itemsToSave['porto_custom_games']) itemsToSave['porto_custom_games'] = data.porto_games_data;
        if (data.memoFolders && !itemsToSave['porto_memo_folders']) itemsToSave['porto_memo_folders'] = data.memoFolders;
        if (data.settings && !itemsToSave['porto_settings']) itemsToSave['porto_settings'] = data.settings;

        await storage.batchSetItems(itemsToSave, false);

        window.dispatchEvent(new Event('porto_saved'));
        window.dispatchEvent(new Event('porto_settings_updated'));
        window.dispatchEvent(new Event('porto_stickers_updated'));

        if (notify) notify('✅ Seluruh data berhasil dipulihkan dari Google Drive!');
        return true;
      } else {
        throw new Error(result.message || 'File database di Google Drive kosong.');
      }
    } catch (err) {
      console.error('Restore from Google Drive failed:', err);
      if (notify && !err.message.includes('⚠️')) {
        notify('❌ Gagal memulihkan dari Drive: ' + err.message, 'error');
      }
      return false;
    }
  },



  /**
   * Sinkronisasi Proyek dengan Google Sheets (Multi-Tab & Two-Way Sync)
   */
  async syncProjectsWithSheets(projects, setProjects, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Script URL belum diatur di Settings.', 'warning');
        return false;
      }

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_sheets',
        sheetId: sheetId,
        payload: projects
      }, notify);

      const result = await response.json();
      if (result.status === 'success') {
        // Mendukung Two-Way Sync jika script Apps Script mengembalikan projects hasil merge
        if (result.projects && Array.isArray(result.projects)) {
          setProjects(result.projects);
          await storage.setItem('porto_projects', result.projects);
        }
        
        if (notify) notify('✅ Sinkronisasi ke "Manajemen Project" Berhasil!');
        window.dispatchEvent(new Event('porto_saved'));
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi: ' + (result.message || 'Error tidak diketahui'), 'error');
      return false;
    } catch (err) {
      console.error('Sync failed:', err);
      if (notify && !err.message.includes('Ukuran data') && !err.message.includes('melebihi batas') && !err.message.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi: Kendala jaringan atau izin script', 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Notes & Kanvas Kreatif dengan Google Sheets
   */
  async syncNotes(notes, folders, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Script URL belum diatur di Settings.', 'warning');
        return false;
      }

      const finalNotes = notes || await storage.getItem('porto_memo_notes', []);
      const finalFolders = folders || await storage.getItem('porto_memo_folders', []);

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_notes',
        sheetId: sheetId,
        payload: {
          notes: finalNotes,
          folders: finalFolders
        }
      }, notify);

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`✅ ${result.message || 'Sinkronisasi Catatan & Kanvas ke Google Sheets Berhasil!'}`);
        window.dispatchEvent(new Event('porto_saved'));
        return true;
      }
      
      if (result.message === 'Unknown action') {
        if (notify) notify('⚠️ Skrip Google Apps Script belum diperbarui: Salin kode terbaru dari google_apps_script.js dan lakukan Deploy Ulang (New Deployment) di Google Sheets Anda.', 'error');
        return false;
      }

      if (notify) notify('❌ Gagal sinkronisasi: ' + (result.message || 'Error tidak diketahui'), 'error');
      return false;
    } catch (err) {
      console.error('Notes sync failed:', err);
      if (notify && !err.message?.includes('Ukuran data') && !err.message?.includes('melebihi batas') && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi: Kendala jaringan atau izin script', 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Whiteboard dengan Google Sheets (Legacy & Canvas)
   */
  async syncWhiteboard(canvases, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) return false;

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_whiteboard',
        sheetId: sheetId,
        payload: canvases
      }, notify);

      const result = await response.json();
      if (result.status === 'success') {
        window.dispatchEvent(new Event('porto_saved'));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Whiteboard sync failed:', err);
      return false;
    }
  },

  /**
   * Mengambil konfigurasi platform dari Google Sheets (untuk Lintas Perangkat)
   */
  async getPlatformConfig() {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) return null;

      const response = await safeFetchGAS(scriptUrl, { action: 'get_platform_config', sheetId: sheetId });
      if (!response) return null;
      const result = await response.json();
      return result.status === 'success' ? result.config : null;
    } catch (err) {
      console.error('Failed to get platform config:', err);
      return null;
    }
  },

  /**
   * Menyimpan konfigurasi platform ke Google Sheets
   */
  async setPlatformConfig(config) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) return false;

      const response = await safeFetchGAS(scriptUrl, { action: 'update_platform_config', sheetId: sheetId, payload: config });
      if (!response) return false;
      const result = await response.json();
      return result.status === 'success';
    } catch (err) {
      console.error('Failed to set platform config:', err);
      return false;
    }
  },

  /**
   * Sync Contact/Leads & Clients directly to Google Contacts & Sheets
   */
  async syncContactToGoogle(contactData, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur di Pengaturan Global.', 'error');
        return false;
      }

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_contacts',
        sheetId: sheetId || '',
        payload: contactData
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`✅ ${contactData.name || 'Kontak'} berhasil tersinkron ke Google Contacts!`);
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi kontak: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Failed to sync contact to Google:', err);
      if (notify) notify('❌ Gagal sinkronisasi Google Contacts: ' + err.message, 'error');
      return false;
    }
  },

  /**
   * Bulk Sync All Clients to Google Contacts
   */
  async syncAllContactsToGoogle(clientsList, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur di Pengaturan Global.', 'error');
        return false;
      }

      if (notify) notify('⏳ Menyinkronkan seluruh daftar klien ke Google Contacts...');

      const payload = (clientsList || []).map(c => ({
        name: c.name || c.fullName || 'Klien',
        email: c.email || '',
        phone: c.phone || c.whatsapp || '',
        notes: `Total Pesanan: ${c.totalOrders || 0} • Status: ${c.status || 'Active'}`
      }));

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_contacts',
        sheetId: sheetId || '',
        payload: payload
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`✅ ${result.count || payload.length} Klien berhasil tersinkron ke Google Contacts & Sheets!`);
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi klien: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Failed to bulk sync contacts:', err);
      if (notify) notify('❌ Gagal sinkronisasi massal Google Contacts: ' + err.message, 'error');
      return false;
    }
  },

  /**
   * Sinkronisasi Chat Admin, Client Messages & Komentar ke Google Sheets & Drive
   */
  async syncChats(chatsList, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) return false;

      const finalChats = chatsList || await storage.getItem('porto_chat_messages', []) || [];

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_chats',
        sheetId: sheetId || '',
        payload: finalChats
      }, notify);

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Riwayat Chat & Komentar berhasil disinkronkan ke Google Sheets & Drive!');
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[GoogleSync] syncChats failed:', err);
      return false;
    }
  },

  /**
   * Hapus baris secara permanen langsung dari Google Sheets
   */
  async deleteRowPermanently(idOrIds, sheetName = null, notify = null) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) return false;

      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      const response = await safeFetchGAS(scriptUrl, {
        action: 'permanent_delete',
        sheetId: sheetId || '',
        sheetName: sheetName || '',
        ids: ids
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`🗑️ ${result.deletedCount || ids.length} data berhasil dihapus permanen dari Google Sheets!`);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[GoogleSync] permanent_delete error:', err);
      return false;
    }
  },

  /**
   * Mengunggah file apa saja (PDF, DOCX, ZIP, MP4, PNG, FIG, dll) langsung ke Google Drive
   * Dilengkapi kompresi WebP otomatis untuk gambar dan direct preview URLs
   */
  async uploadFileToDrive(file, notify, customFolder = 'Attachments', userContext = null) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        throw new Error('Google Apps Script URL belum diatur');
      }

      if (notify) notify('⏳ Mengompres & mengunggah berkas ke Google Drive...');

      // Pre-compress image files to lightweight WebP
      const processedFile = await compressImageForDrive(file);

      // Convert file to Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64 = String(result).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
      });

      const currentUser = userContext || (storage.getCurrentUser ? storage.getCurrentUser() : { uid: null, scope: 'global' });
      const isPrivate = currentUser.scope === 'private' && currentUser.uid;
      const finalFolder = isPrivate 
        ? `Agenze_CMS_Database/Users/${currentUser.uid}/${customFolder}`
        : `Agenze_CMS_Database/Admin/${customFolder}`;

      const response = await safeFetchGAS(scriptUrl, {
        action: 'upload_file',
        fileName: processedFile.name,
        mimeType: processedFile.type || 'application/octet-stream',
        folder: finalFolder,
        folderPath: finalFolder,
        folderName: finalFolder,
        base64: base64Data
      }, notify);
      if (!response) throw new Error('Gagal terhubung ke Google Apps Script');

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Berkas tersimpan di Google Drive!');
        const fileId = result.fileId || result.id;
        const isImage = (processedFile.type || '').startsWith('image/');
        const resolvedUrl = (isImage && fileId)
          ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`
          : (result.directUrl || result.downloadUrl || result.url || result.fileUrl);

        // Auto-register uploaded Drive file into Media Gallery & Media Vault so it is immediately accessible everywhere
        try {
          if (resolvedUrl) {
            const nowMs = Date.now();
            const nowIso = new Date(nowMs).toISOString();
            const mediaType = isImage ? 'image' : ((processedFile.type || '').startsWith('video/') ? 'video' : 'document');
            if (isImage || mediaType === 'video') {
              const curGallery = (await storage.getItem('porto_media_gallery', [])) || [];
              if (Array.isArray(curGallery) && !curGallery.some(g => g?.url === resolvedUrl)) {
                const newGItem = {
                  id: `drive_${fileId || nowMs}`,
                  url: resolvedUrl,
                  name: processedFile.name || 'Berkas Drive',
                  resource_type: mediaType,
                  format: (processedFile.name || '').split('.').pop() || 'webp',
                  source: 'drive',
                  createdAt: nowMs
                };
                await storage.setItem('porto_media_gallery', [newGItem, ...curGallery]);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('porto_media_uploaded', { detail: newGItem }));
                }
              }
            }
            const curVault = (await storage.getItem('porto_media_vault', [])) || [];
            if (Array.isArray(curVault) && !curVault.some(v => v?.url === resolvedUrl)) {
              const newVItem = {
                id: `mv_drive_${fileId || nowMs}`,
                name: processedFile.name || 'Berkas Drive',
                url: resolvedUrl,
                type: mediaType,
                source: 'drive',
                folderId: 'fld-drive-projects',
                folder: customFolder || 'Google Drive Projects',
                size: processedFile.size || result.size || 0,
                createdAt: nowIso
              };
              await storage.setItem('porto_media_vault', [newVItem, ...curVault]);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('porto_media_vault_updated'));
              }
            }
          }
        } catch (regErr) {
          console.warn('[GoogleSync] Auto-register Drive media warning:', regErr);
        }

        return resolvedUrl;
      }
      throw new Error(result.message || 'Gagal mengunggah file ke Google Drive');
    } catch (err) {
      console.error('[GoogleSync] uploadFileToDrive error:', err);
      if (notify && !err.message.includes('URL belum diatur')) {
        notify('❌ Gagal upload ke Drive: ' + err.message, 'error');
      }
      throw err;
    }
  },

  /**
   * Otomatis menghapus file dari Google Drive saat dihapus dari website
   */
  async deleteFileFromDrive(fileUrlOrId, notify) {
    try {
      if (!fileUrlOrId) return false;
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) return false;

      // Extract file id if full URL is given
      let fileId = fileUrlOrId;
      const idMatch = String(fileUrlOrId).match(/[-\w]{25,}/);
      if (idMatch) {
        fileId = idMatch[0];
      }

      const response = await safeFetchGAS(scriptUrl, {
        action: 'delete_file',
        fileId: fileId,
        fileUrl: fileUrlOrId
      });
      if (!response) return false;

      const result = await response.json().catch(() => null);
      if (result && result.status === 'success') {
        if (notify) notify('🗑️ Berkas otomatis dihapus dari Google Drive');
        return true;
      }
      return true;
    } catch (err) {
      console.warn('[GoogleSync] deleteFileFromDrive non-blocking error:', err);
      return false;
    }
  },

  /**
   * Mengambil status statistik dan kuota penyimpanan Google Drive
   */
  async getDriveStorageStats(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) return null;

      const response = await safeFetchGAS(scriptUrl, { action: 'get_storage_stats' }, notify);
      const result = await response.json();
      if (result.status === 'success') {
        return result;
      }
      return null;
    } catch (err) {
      console.warn('[GoogleSync] getDriveStorageStats error:', err);
      return null;
    }
  },

  /**
   * Membersihkan snapshot backup lama di Google Drive untuk menghemat kapasitas
   */
  async cleanupDriveBackups(keepCount = 5, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return false;
      }

      if (notify) notify('⏳ Membersihkan backup Google Drive usang...');
      const response = await safeFetchGAS(scriptUrl, { action: 'cleanup_backups', keepCount }, notify);
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`✅ ${result.message || 'Pembersihan backup Drive selesai!'}`, 'success');
        return true;
      }
      if (notify) notify(`❌ ${result.message || 'Gagal membersihkan backup'}`, 'error');
      return false;
    } catch (err) {
      console.error('[GoogleSync] cleanupDriveBackups error:', err);
      if (notify) notify('❌ Gagal membersihkan backup: ' + err.message, 'error');
      return false;
    }
  },

  /**
   * Ekstraksi teks nota/dokumen fisik gratis menggunakan Google Drive OCR
   */
  async ocrDocumentWithDrive(base64Image, fileName = 'scan.jpg', mimeType = 'image/jpeg', notify = null) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('URL Google Apps Script belum diatur', 'error');
        return null;
      }
      if (notify) notify('Memproses OCR via Google Drive...');
      const response = await safeFetchGAS(scriptUrl, {
        action: 'ocr_document',
        payload: { base64: base64Image, fileName, mimeType }
      }, notify);
      if (!response) return null;
      const result = await response.json().catch(() => null);
      if (result && result.status === 'success') {
        if (notify) notify('OCR Dokumen berhasil dibaca', 'success');
        return result;
      }
      return result;
    } catch (err) {
      console.warn('[GoogleSync] ocrDocumentWithDrive error:', err);
      return null;
    }
  },

  /**
   * One-Click Generate Surat Perjanjian Kerja Sama (SPK) PDF ke Google Drive
   */
  async generateSpkDocument(spkData, notify = null) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('URL Google Apps Script belum diatur', 'error');
        return null;
      }
      if (notify) notify('Membuat berkas SPK resmi di Google Drive...');
      const response = await safeFetchGAS(scriptUrl, {
        action: 'generate_spk_document',
        payload: spkData
      }, notify);
      if (!response) return null;
      const result = await response.json().catch(() => null);
      if (result && result.status === 'success') {
        if (notify) notify('Dokumen SPK resmi siap di Google Drive', 'success');
        return result;
      }
      return result;
    } catch (err) {
      console.error('[GoogleSync] generateSpkDocument error:', err);
      return null;
    }
  },

  /**
   * Pasang Serverless 07:00 AM Cron Executive Briefing
   */
  async setupMorningBriefing(notify = null) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('URL Google Apps Script belum diatur', 'error');
        return false;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'setup_morning_briefing',
        sheetId: settings.googleSheetId
      }, notify);
      if (!response) return false;
      const result = await response.json().catch(() => null);
      if (result && result.status === 'success') {
        if (notify) notify('Serverless 07:00 AM Briefing aktif', 'success');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[GoogleSync] setupMorningBriefing error:', err);
      return false;
    }
  },
  async syncProjectToCalendar(project, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Script belum dipasang!', 'error');
        return false;
      }
      if (!project.deadline) {
        if (notify) notify('⚠️ Proyek ini tidak memiliki deadline', 'error');
        return false;
      }

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_calendar',
        payload: {
          projectId: project.id,
          title: project.title,
          description: project.description || '',
          deadline: project.deadline
        }
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) {
          if (result.message === 'Added to Calendar') {
            notify('📅 Berhasil ditambahkan ke Google Calendar!');
          } else {
            notify('ℹ️ Sudah ada di Google Calendar');
          }
        }
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Failed to sync calendar:', err);
      if (notify) notify(`❌ Gagal: ${err.message}`, 'error');
      return false;
    }
  },

  /**
   * Sinkronisasi Katalog Toko dengan Google Sheets
   */
  async syncShop(products, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script belum dipasang!', 'error');
        return false;
      }

      const finalProducts = products || (await storage.getItem('porto_catalog_products', [])) || (await storage.getItem('porto_shop_products', [])) || [];

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_shop',
        sheetId: sheetId,
        payload: finalProducts
      }, notify);
      if (!response) return false;

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi ke "Manajemen Toko" Berhasil!');
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Toko: ' + (result.message || 'Error tidak diketahui'), 'error');
      return false;
    } catch (err) {
      console.error('Shop sync failed:', err);
      if (notify && !err.message.includes('Ukuran data') && !err.message.includes('melebihi batas') && !err.message.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Toko: Kendala jaringan atau izin script', 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Transaksi & Invoice dengan Google Sheets
   */
  async syncTransactions(transactions, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script belum dipasang!', 'error');
        return false;
      }

      const finalTransactions = transactions || (await storage.getItem('porto_transactions', [])) || [];

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_transactions',
        sheetId: sheetId,
        payload: finalTransactions
      }, notify);

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi ke "Transaksi & Pesanan" Berhasil!');
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Transaksi: ' + (result.message || 'Error tidak diketahui'), 'error');
      return false;
    } catch (err) {
      console.error('Transactions sync failed:', err);
      if (notify && !err.message.includes('Ukuran data') && !err.message.includes('melebihi batas') && !err.message.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Transaksi: Kendala jaringan atau izin script', 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Pusat Bisnis, Kontak & Rekening Bank ke Google Sheets & Drive
   */
  async syncBusinessProfile(profile, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script belum dipasang!', 'error');
        return false;
      }

      const finalProfile = profile || (await storage.getItem('porto_business_profile', null));
      if (!finalProfile) return false;

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_business_profile',
        sheetId: sheetId,
        payload: finalProfile
      }, notify);

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi "Pusat Bisnis & Rekening" Berhasil!');
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Bisnis: ' + (result.message || 'Error tidak diketahui'), 'error');
      return false;
    } catch (err) {
      console.error('Business profile sync failed:', err);
      return false;
    }
  },

  /**
   * Sinkronisasi Halaman Website & Artikel Blog ke Google Sheets & Drive
   */
  async syncWebsite(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script belum dipasang di Pengaturan Global!', 'error');
        return false;
      }

      const posts = await storage.getItem('porto_blog_posts', []);
      const pages = await storage.getItem('porto_pages', {});

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_website',
        sheetId: sheetId,
        payload: { posts, pages, settings }
      }, notify);
      if (!response) return false;

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Website & Blog ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_website', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Website: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Website sync failed:', err);
      if (notify && !err.message.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Website: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Status Update / Utas Feed ke Google Sheets & Drive
   */
  async syncSocialUpdates(updates, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script belum dipasang di Pengaturan Global!', 'error');
        return false;
      }

      const list = updates || (await storage.getItem('porto_social_updates', []));

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_social_updates',
        sheetId: sheetId,
        payload: list
      }, notify);
      if (!response) return false;

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Feed & Update (Utas) ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_social_updates', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Feed: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Social updates sync failed:', err);
      if (notify && !err.message.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Feed: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Skema Formulir & Survei ke Google Sheets
   */
  async syncForms(forms, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script atau Sheet ID belum dipasang di Pengaturan Global!', 'error');
        return false;
      }

      const list = forms || (await storage.getItem('porto_forms', []));

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_forms',
        sheetId: sheetId,
        payload: list
      }, notify);
      if (!response) return false;

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Formulir & Survei ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_forms', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Formulir: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Forms sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Formulir: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Tanggapan Formulir ke Google Sheets
   */
  async syncFormResponses(responses, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ URL Google Script atau Sheet ID belum dipasang di Pengaturan Global!', 'error');
        return false;
      }

      const list = responses || (await storage.getItem('porto_form_responses', {}));

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_form_responses',
        sheetId: sheetId,
        payload: list
      }, notify);
      if (!response) return false;

      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Tanggapan Formulir ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_form_responses', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Tanggapan Formulir: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Form responses sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Tanggapan Formulir: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Paket Layanan / Rate Cards ke Google Sheets
   */
  async syncRateCards(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Apps Script URL belum diatur.', 'error');
        return false;
      }
      const packages = (await storage.getItem('porto_rate_cards', [])) || [];
      const addons = (await storage.getItem('porto_rate_card_addons', [])) || [];
      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_rate_cards',
        sheetId: sheetId,
        payload: { packages, addons }
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Paket Layanan (Rate Cards) ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_ratecards', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Rate Cards: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Rate cards sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Rate Cards: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Ulasan & Testimoni Klien ke Google Sheets
   */
  async syncClientReviews(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Apps Script URL belum diatur.', 'error');
        return false;
      }
      const reviews = (await storage.getItem('porto_client_reviews', [])) || [];
      const feedbacks = (await storage.getItem('porto_client_feedbacks', [])) || [];
      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_reviews',
        sheetId: sheetId,
        payload: { reviews, feedbacks }
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Ulasan & Testimoni Klien ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_reviews', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Ulasan Klien: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Client reviews sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Ulasan Klien: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Flash Sale & Kampanye Promo ke Google Sheets
   */
  async syncFlashSales(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Apps Script URL belum diatur.', 'error');
        return false;
      }
      const shopSettings = (await storage.getItem('porto_shop_settings', {})) || {};
      const flashSales = (await storage.getItem('porto_flash_sales', [])) || [];
      const combined = [...flashSales];
      if (shopSettings.flashSale && shopSettings.flashSale.isActive) {
        combined.unshift(shopSettings.flashSale);
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_flash_sales',
        sheetId: sheetId,
        payload: combined
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Flash Sale & Promo ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_flash_sales', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Flash Sale: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Flash sale sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Flash Sale: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Kemitraan, Reseller & Komisi Afiliasi ke Google Sheets
   */
  async syncPartnerships(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Apps Script URL belum diatur.', 'error');
        return false;
      }
      const withdrawals = (await storage.getItem('porto_affiliate_withdrawals', [])) || [];
      const partners = (await storage.getItem('porto_partnerships', [])) || [];
      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_partnerships',
        sheetId: sheetId,
        payload: partners.length > 0 ? partners : withdrawals
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Kemitraan & Afiliasi ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_partnerships', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Kemitraan: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Partnership sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Kemitraan: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Sinkronisasi Kontrak & SPK Kerja Sama ke Google Sheets
   */
  async syncContracts(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Apps Script URL belum diatur.', 'error');
        return false;
      }
      const contracts = (await storage.getItem('porto_contracts_spk', [])) || [];
      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_contracts',
        sheetId: sheetId,
        payload: contracts
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Sinkronisasi Kontrak & SPK ke Google Sheets Berhasil!');
        await storage.setItem('porto_last_sync_contracts', Date.now());
        return true;
      }
      if (notify) notify('❌ Gagal sinkronisasi Kontrak SPK: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Contract SPK sync failed:', err);
      if (notify && !err.message?.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi Kontrak SPK: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Membangun & Memperbarui Tab #1 "📊 Dashboard Studio" di Google Sheets
   * Menghasilkan Executive Command Center dengan palet Obsidian & Terracotta, KPI finansial, 
   * dan formula akurat real-time.
   */
  async buildDashboard(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur di Pengaturan Global.', 'error');
        return false;
      }
      if (notify) notify('📊 Membangun Executive Dashboard Studio di Google Sheets...');
      const response = await safeFetchGAS(scriptUrl, {
        action: 'build_dashboard',
        sheetId: sheetId
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✅ Dashboard Studio Google Sheets berhasil dibangun & diperbarui!', 'success');
        return true;
      }
      if (notify) notify('❌ Gagal membangun Dashboard: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Build dashboard failed:', err);
      if (notify) notify('❌ Gagal membangun Dashboard: ' + err.message, 'error');
      return false;
    }
  },

  /**
   * Menjalankan Diagnostik Kesehatan Spreadsheet & Cloud Engine
   */
  async diagnoseSystem(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'diagnose_system',
        sheetId: sheetId
      }, notify);
      if (!response) return null;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`✅ Diagnostik Selesai: ${result.totalSheets} Tab Terdeteksi, Health: ${result.health}`);
        return result;
      }
      if (notify) notify('❌ Diagnostik Gagal: ' + (result.message || 'Error'), 'error');
      return null;
    } catch (err) {
      console.error('Diagnose system failed:', err);
      if (notify) notify('❌ Diagnostik Gagal: ' + err.message, 'error');
      return null;
    }
  },

  /**
   * Pembuatan Otomatis Google Drive Client Vault per Pesanan
   */
  async createClientVault(payload, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'create_client_vault',
        payload: payload || {}
      }, notify);
      if (!response) return null;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('📁 Client Vault Google Drive berhasil dibuat!', 'success');
        return result;
      }
      if (notify) notify('❌ Gagal membuat Client Vault: ' + (result.message || 'Error'), 'error');
      return null;
    } catch (err) {
      console.error('Create client vault failed:', err);
      if (notify) notify('❌ Gagal membuat Client Vault: ' + err.message, 'error');
      return null;
    }
  },

  /**
   * Pengiriman Email Notifikasi Resmi Studio via Gmail API Engine
   */
  async sendEmailNotification(payload, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return false;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'send_email_notification',
        payload: payload || {}
      }, notify);
      if (!response) return false;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('✉️ Email notifikasi berhasil dikirimkan!', 'success');
        return true;
      }
      if (notify) notify('❌ Gagal kirim email: ' + (result.message || 'Error'), 'error');
      return false;
    } catch (err) {
      console.error('Send email failed:', err);
      if (notify) notify('❌ Gagal kirim email: ' + err.message, 'error');
      return false;
    }
  },

  /**
   * Penjadwalan Konsultasi & Briefing di Google Calendar
   */
  async scheduleConsultation(payload, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'schedule_consultation',
        payload: payload || {}
      }, notify);
      if (!response) return null;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('📅 Sesi konsultasi berhasil dijadwalkan di Google Calendar!', 'success');
        return result;
      }
      if (notify) notify('❌ Gagal menjadwalkan konsultasi: ' + (result.message || 'Error'), 'error');
      return null;
    } catch (err) {
      console.error('Schedule consultation failed:', err);
      if (notify) notify('❌ Gagal menjadwalkan konsultasi: ' + err.message, 'error');
      return null;
    }
  },

  /**
   * Penarikan Rangkuman Finansial & Operasional Harian C-Level
   */
  async fetchDailyExecutiveDigest(payload, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'daily_executive_digest',
        sheetId: sheetId,
        payload: payload || {}
      }, notify);
      if (!response) return null;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('📊 Rangkuman eksekutif studio berhasil dikompilasi!', 'success');
        return result;
      }
      if (notify) notify('❌ Gagal memuat rangkuman eksekutif: ' + (result.message || 'Error'), 'error');
      return null;
    } catch (err) {
      console.error('Executive digest failed:', err);
      if (notify) notify('❌ Gagal memuat rangkuman eksekutif: ' + err.message, 'error');
      return null;
    }
  },

  /**
   * Pembuatan Dokumen Invoice Digital & Penyimpanan di Google Drive
   */
  async generateDriveInvoice(payload, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'generate_invoice_document',
        payload: payload || {}
      }, notify);
      if (!response) return null;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify('🧾 Dokumen invoice berhasil dibuat & disimpan di Google Drive!', 'success');
        return result;
      }
      if (notify) notify('❌ Gagal membuat invoice: ' + (result.message || 'Error'), 'error');
      return null;
    } catch (err) {
      console.error('Generate invoice failed:', err);
      if (notify) notify('❌ Gagal membuat invoice: ' + err.message, 'error');
      return null;
    }
  },

  /**
   * Smart Storage Optimizer (Pembersihan Otomatis Backup Lama & Audit Kuota Drive)
   */
  async optimizeStorage(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }
      const response = await safeFetchGAS(scriptUrl, {
        action: 'smart_storage_optimizer'
      }, notify);
      if (!response) return null;
      const result = await response.json();
      if (result.status === 'success') {
        if (notify) notify(`🚀 Storage Dioptimasi: ${result.backupsCleaned} backup diarsipkan, sisa pemakaian: ${result.usedMb} MB (${result.healthStatus})`, 'success');
        return result;
      }
      if (notify) notify('❌ Optimasi Storage Gagal: ' + (result.message || 'Error'), 'error');
      return null;
    } catch (err) {
      console.error('Optimize storage failed:', err);
      if (notify) notify('❌ Optimasi Storage Gagal: ' + err.message, 'error');
      return null;
    }
  },

  /**
   * Sinkronisasi Data Modul Halaman Aktif
   */
  async syncCurrentPage(pageKey, notify, setProjects) {
    const key = (pageKey || '').toLowerCase();
    let result = false;

    if (key === 'ratecard' || key === 'ratecards' || key === 'pricing' || key === 'rates') {
      result = await this.syncRateCards(notify);
      return result;
    }

    if (key === 'reviews' || key === 'client-voice' || key === 'testimonials' || key === 'testimoni') {
      result = await this.syncClientReviews(notify);
      return result;
    }

    if (key === 'flashsale' || key === 'flash-sale' || key === 'promo' || key === 'campaign') {
      result = await this.syncFlashSales(notify);
      return result;
    }

    if (key === 'partnership' || key === 'partnerships' || key === 'affiliate' || key === 'reseller') {
      result = await this.syncPartnerships(notify);
      return result;
    }

    if (key === 'contracts' || key === 'contract' || key === 'spk') {
      result = await this.syncContracts(notify);
      return result;
    }

    if (key === 'projects' || key === 'proyek') {
      const projects = await storage.getItem('porto_projects', []);
      result = await this.syncProjectsWithSheets(projects, setProjects || (() => {}), notify);
      if (result) await storage.setItem('porto_last_sync_projects', Date.now());
      return result;
    }

    if (key === 'social_updates' || key === 'updates' || key === 'feed' || key === 'utas') {
      result = await this.syncSocialUpdates(null, notify);
      return result;
    }

    if (key === 'forms' || key === 'form' || key === 'formulir' || key === 'survei') {
      result = await this.syncForms(null, notify);
      return result;
    }

    if (key === 'form_responses' || key === 'tanggapan' || key === 'responses') {
      result = await this.syncFormResponses(null, notify);
      return result;
    }

    if (key === 'notes' || key === 'memo' || key === 'memos') {
      const notes = await storage.getItem('porto_memo_notes', []);
      const folders = await storage.getItem('porto_memo_folders', []);
      result = await this.syncNotes(notes, folders, notify);
      if (result) await storage.setItem('porto_last_sync_notes', Date.now());
      return result;
    }

    if (key === 'website' || key === 'blog' || key === 'builder' || key === 'pages') {
      result = await this.syncWebsite(notify);
      return result;
    }

    if (key === 'whiteboard') {
      const canvases = await storage.getItem('porto_whiteboard_canvases', []);
      result = await this.syncWhiteboard(canvases, notify);
      if (result) await storage.setItem('porto_last_sync_whiteboard', Date.now());
      return result;
    }

    if (key === 'shop' || key === 'katalog' || key === 'catalog' || key === 'products') {
      const products = (await storage.getItem('porto_catalog_products', [])) || (await storage.getItem('porto_shop_products', [])) || [];
      result = await this.syncShop(products, notify);
      if (result) await storage.setItem('porto_last_sync_shop', Date.now());
      return result;
    }

    if (key === 'transactions' || key === 'transaksi' || key === 'keuangan' || key === 'invoices') {
      const transactions = (await storage.getItem('porto_transactions', [])) || [];
      result = await this.syncTransactions(transactions, notify);
      if (result) await storage.setItem('porto_last_sync_transactions', Date.now());
      return result;
    }

    if (key === 'business' || key === 'contacts' || key === 'bisnis' || key === 'profile') {
      result = await this.syncBusinessProfile(null, notify);
      return result;
    }

    // Default fallback: Global Sync if page doesn't have an isolated sheet
    if (notify) notify(`ℹ️ Halaman "${pageKey}" menggunakan sinkronisasi database penuh.`);
    return await this.syncAllData(notify);
  },

  /**
   * Sinkronisasi Seluruh Data Sekaligus (Projects, Notes, Website, Shop, Contacts, Drive Backup)
   */
  async syncAllData(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);

      if (!scriptUrl || !sheetId) {
        if (notify) notify('⚠️ Google Sheet ID atau Apps Script URL belum diatur di Pengaturan Global.', 'error');
        return false;
      }

      if (notify) notify('⏳ Memulai sinkronisasi seluruh database Google Sheets...');

      let successCount = 0;
      let totalTasks = 0;

      // 1. Projects
      try {
        const projects = await storage.getItem('porto_projects', []);
        totalTasks++;
        const resProj = await safeFetchGAS(scriptUrl, { action: 'sync_sheets', sheetId, payload: projects });
        if (resProj.ok) {
          successCount++;
          await storage.setItem('porto_last_sync_projects', Date.now());
        }
      } catch (e) {
        console.warn('Projects sync error:', e);
      }

      // 2. Notes & Canvas
      try {
        const notes = await storage.getItem('porto_memo_notes', []);
        const folders = await storage.getItem('porto_memo_folders', []);
        totalTasks++;
        const resNotes = await safeFetchGAS(scriptUrl, { action: 'sync_notes', sheetId, payload: { notes, folders } });
        if (resNotes.ok) {
          successCount++;
          await storage.setItem('porto_last_sync_notes', Date.now());
        }
      } catch (e) {
        console.warn('Notes sync error:', e);
      }

      // 3. Website & Blog
      try {
        const posts = await storage.getItem('porto_blog_posts', []);
        const pages = await storage.getItem('porto_pages', {});
        totalTasks++;
        const resWeb = await safeFetchGAS(scriptUrl, { action: 'sync_website', sheetId, payload: { posts, pages, settings } });
        if (resWeb.ok) {
          successCount++;
          await storage.setItem('porto_last_sync_website', Date.now());
        }
      } catch (e) {
        console.warn('Website sync error:', e);
      }

      // 4. Shop / Catalog Products
      try {
        const products = (await storage.getItem('porto_catalog_products', [])) || (await storage.getItem('porto_shop_products', [])) || [];
        totalTasks++;
        const resShop = await safeFetchGAS(scriptUrl, { action: 'sync_shop', sheetId, payload: products });
        if (resShop.ok) {
          successCount++;
          await storage.setItem('porto_last_sync_shop', Date.now());
        }
      } catch (e) {
        console.warn('Shop sync error:', e);
      }

      // 4b. Transactions & Invoices
      try {
        const transactions = (await storage.getItem('porto_transactions', [])) || [];
        if (transactions.length > 0) {
          totalTasks++;
          const resTrx = await safeFetchGAS(scriptUrl, { action: 'sync_transactions', sheetId, payload: transactions });
          if (resTrx.ok) {
            successCount++;
            await storage.setItem('porto_last_sync_transactions', Date.now());
          }
        }
      } catch (e) {
        console.warn('Transactions sync error:', e);
      }

      // 4c. Business Profile & Bank Accounts
      try {
        const businessProfile = await storage.getItem('porto_business_profile', null);
        if (businessProfile) {
          totalTasks++;
          const resBiz = await safeFetchGAS(scriptUrl, { action: 'sync_business_profile', sheetId, payload: businessProfile });
          if (resBiz.ok) {
            successCount++;
          }
        }
      } catch (e) {
        console.warn('Business profile sync error:', e);
      }

      // 5. Customers & Clients
      try {
        const customers = (await storage.getItem('porto_trx_customers', [])) || (await storage.getItem('porto_clients', [])) || [];
        totalTasks++;
        const resCus = await safeFetchGAS(scriptUrl, { action: 'sync_customers', sheetId, payload: customers });
        if (resCus.ok) successCount++;
      } catch (e) {
        console.warn('Customers sync error:', e);
      }

      // 6. Discounts
      try {
        const discounts = await storage.getItem('porto_trx_discounts', []) || [];
        totalTasks++;
        const resDis = await safeFetchGAS(scriptUrl, { action: 'sync_discounts', sheetId, payload: discounts });
        if (resDis.ok) successCount++;
      } catch (e) {
        console.warn('Discounts sync error:', e);
      }

      // 7. Chats & Comments
      try {
        const chats = await storage.getItem('porto_chat_messages', []) || [];
        if (chats.length > 0) {
          totalTasks++;
          const resChat = await safeFetchGAS(scriptUrl, { action: 'sync_chats', sheetId, payload: chats });
          if (resChat.ok) successCount++;
        }
      } catch (e) {
        console.warn('Chats sync error:', e);
      }

      // 8. Users & Team
      try {
        const users = await storage.getItem('porto_users', []) || [];
        if (users.length > 0) {
          totalTasks++;
          const resUsers = await safeFetchGAS(scriptUrl, { action: 'sync_users', sheetId, payload: users });
          if (resUsers.ok) successCount++;
        }
      } catch (e) {
        console.warn('Users sync error:', e);
      }

      // 9. Bookings & Appointments
      try {
        const bookings = await storage.getItem('porto_bookings', []) || [];
        if (bookings.length > 0) {
          totalTasks++;
          const resBook = await safeFetchGAS(scriptUrl, { action: 'sync_bookings', sheetId, payload: bookings });
          if (resBook.ok) successCount++;
        }
      } catch (e) {
        console.warn('Bookings sync error:', e);
      }

      // 9b. Social Updates & Utas Feed
      try {
        const socialUpdates = await storage.getItem('porto_social_updates', []) || [];
        if (socialUpdates.length > 0) {
          totalTasks++;
          const resSocial = await safeFetchGAS(scriptUrl, { action: 'sync_social_updates', sheetId, payload: socialUpdates });
          if (resSocial.ok) successCount++;
        }
      } catch (e) {
        console.warn('Social updates sync error:', e);
      }

      // 9c. Forms & Surveys Schema
      try {
        const forms = await storage.getItem('porto_forms', []) || [];
        if (forms.length > 0) {
          totalTasks++;
          const resForms = await safeFetchGAS(scriptUrl, { action: 'sync_forms', sheetId, payload: forms });
          if (resForms.ok) successCount++;
        }
      } catch (e) {
        console.warn('Forms sync error:', e);
      }

      // 9d. Form Responses
      try {
        const formResponses = await storage.getItem('porto_form_responses', {}) || {};
        totalTasks++;
        const resResponses = await safeFetchGAS(scriptUrl, { action: 'sync_form_responses', sheetId, payload: formResponses });
        if (resResponses.ok) successCount++;
      } catch (e) {
        console.warn('Form responses sync error:', e);
      }

      // 9e. Rate Cards & Paket Layanan
      try {
        const rateCards = (await storage.getItem('porto_rate_cards', [])) || [];
        const addons = (await storage.getItem('porto_rate_card_addons', [])) || [];
        if (rateCards.length > 0 || addons.length > 0) {
          totalTasks++;
          const resRate = await safeFetchGAS(scriptUrl, { action: 'sync_rate_cards', sheetId, payload: { packages: rateCards, addons } });
          if (resRate.ok) successCount++;
        }
      } catch (e) {
        console.warn('Rate cards sync error:', e);
      }

      // 9f. Client Reviews & Testimonials
      try {
        const reviews = (await storage.getItem('porto_client_reviews', [])) || [];
        const feedbacks = (await storage.getItem('porto_client_feedbacks', [])) || [];
        if (reviews.length > 0 || feedbacks.length > 0) {
          totalTasks++;
          const resRev = await safeFetchGAS(scriptUrl, { action: 'sync_reviews', sheetId, payload: { reviews, feedbacks } });
          if (resRev && resRev.ok) successCount++;
        }
      } catch (e) {
        console.warn('Reviews sync error:', e);
      }

      // 9g. Flash Sale & Kampanye Promo
      try {
        const flashSales = (await storage.getItem('porto_flash_sales', [])) || [];
        const shopSettings = (await storage.getItem('porto_shop_settings', {})) || {};
        const combinedFs = [...flashSales];
        if (shopSettings.flashSale && shopSettings.flashSale.isActive) {
          combinedFs.unshift(shopSettings.flashSale);
        }
        if (combinedFs.length > 0) {
          totalTasks++;
          const resFs = await safeFetchGAS(scriptUrl, { action: 'sync_flash_sales', sheetId, payload: combinedFs });
          if (resFs && resFs.ok) successCount++;
        }
      } catch (e) {
        console.warn('Flash sales sync error:', e);
      }

      // 9h. Kemitraan & Afiliasi
      try {
        const partnerships = (await storage.getItem('porto_partnerships', [])) || [];
        const withdrawals = (await storage.getItem('porto_affiliate_withdrawals', [])) || [];
        const combinedParts = partnerships.length > 0 ? partnerships : withdrawals;
        if (combinedParts.length > 0) {
          totalTasks++;
          const resParts = await safeFetchGAS(scriptUrl, { action: 'sync_partnerships', sheetId, payload: combinedParts });
          if (resParts && resParts.ok) successCount++;
        }
      } catch (e) {
        console.warn('Partnerships sync error:', e);
      }

      // 9i. Kontrak & SPK Kerja Sama
      try {
        const contracts = (await storage.getItem('porto_contracts_spk', [])) || [];
        if (contracts.length > 0) {
          totalTasks++;
          const resContracts = await safeFetchGAS(scriptUrl, { action: 'sync_contracts', sheetId, payload: contracts });
          if (resContracts && resContracts.ok) successCount++;
        }
      } catch (e) {
        console.warn('Contracts sync error:', e);
      }

      // 10. Content Plans & Social Media Schedule
      try {
        const contentPlans = await storage.getItem('porto_content_plans', []) || [];
        if (contentPlans.length > 0) {
          await this.syncPartitionToDrive('content_plans', contentPlans);
        }
      } catch (e) {
        console.warn('Content plans sync error:', e);
      }

      // 11. Drive Backup snapshot & Partitions
      try {
        await this.backupToDrive();
      } catch (backupErr) {
        console.warn('[GoogleSync] Drive backup skipped or failed:', backupErr);
      }

      const now = Date.now();
      await storage.setItem('porto_last_sync_all', now);
      window.dispatchEvent(new Event('porto_saved'));
      window.dispatchEvent(new CustomEvent('porto_sync_completed', { detail: { timestamp: now, successCount, totalTasks } }));

      if (notify) notify(`✅ Seluruh database Google Sheets & Drive berhasil disinkronkan (${successCount}/${totalTasks} modul)!`);
      return true;
    } catch (err) {
      console.error('Sync all failed:', err);
      if (notify && !err.message.includes('⚠️')) {
        notify('❌ Gagal sinkronisasi semua data: ' + err.message, 'error');
      }
      return false;
    }
  },

  /**
   * Ping Google Apps Script Bridge to verify connectivity & latency
   */
  async pingAppsScript(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diisi.', 'error');
        return { ok: false, message: 'URL belum diatur' };
      }

      const startTime = performance.now();
      const response = await safeFetchGAS(scriptUrl, { action: 'ping' }, notify);
      const latencyMs = Math.round(performance.now() - startTime);
      const data = await response.json();

      if (data.status === 'success') {
        if (notify) notify(`⚡ Terhubung ke Google Apps Script! Latensi: ${latencyMs}ms`, 'success');
        return { ok: true, latencyMs, data };
      }

      // Jika script di Google Apps Script masih versi lama (belum di-deploy ulang), tapi tetap merespons (artinya URL valid & online!)
      if (data && (data.message?.includes('Unknown action') || data.status === 'error')) {
        if (notify) notify(`⚡ Terhubung ke Google Apps Script! Latensi: ${latencyMs}ms (Disarankan: Salin kode terbaru dari google_apps_script.js dan deploy versi baru di script.google.com).`, 'success');
        return { ok: true, latencyMs, legacy: true, data };
      }

      if (notify) notify(`❌ Respon tidak valid: ${data.message || 'Error'}`, 'error');
      return { ok: false, message: data.message };
    } catch (err) {
      console.warn('[GoogleSync] Ping failed:', err);
      if (notify) notify(`❌ Gagal terhubung ke Google Apps Script: ${err.message}`, 'error');
      return { ok: false, error: err.message };
    }
  },

  /**
   * Sync a dedicated database partition directly to Google Drive
   */
  async syncPartitionToDrive(partition, data, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) return false;

      const currentUser = storage.getCurrentUser ? storage.getCurrentUser() : { uid: null, scope: 'global' };
      const folderCategory = (currentUser.scope === 'private' && currentUser.uid) ? `Users/${currentUser.uid}` : 'Admin';

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_partition',
        partition,
        payload: data,
        folderCategory
      }, notify);

      const result = await response.json();
      return result.status === 'success';
    } catch (err) {
      console.warn(`[GoogleSync] syncPartitionToDrive (${partition}) error:`, err);
      return false;
    }
  },

  /**
   * Fetch a dedicated database partition directly from Google Drive
   */
  async fetchPartitionFromDrive(partition, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) return null;

      const currentUser = storage.getCurrentUser ? storage.getCurrentUser() : { uid: null, scope: 'global' };
      const folderCategory = (currentUser.scope === 'private' && currentUser.uid) ? `Users/${currentUser.uid}` : 'Admin';

      const response = await safeFetchGAS(scriptUrl, {
        action: 'get_partition',
        partition,
        folderCategory
      }, notify);

      const result = await response.json();
      if (result.status === 'success' && result.data !== undefined) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.warn(`[GoogleSync] fetchPartitionFromDrive (${partition}) error:`, err);
      return null;
    }
  },

  /**
   * Fetch complete Master Database JSON from Google Drive
   */
  async fetchMasterDatabaseFromDrive(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      if (!scriptUrl) {
        if (notify) notify('⚠️ URL Google Apps Script belum diatur.', 'error');
        return null;
      }

      if (notify) notify('⏳ Mengambil Master Database terbaru dari Google Drive...');

      const currentUser = storage.getCurrentUser ? storage.getCurrentUser() : { uid: null, scope: 'global' };
      const isPrivateUser = currentUser.scope === 'private' && currentUser.uid;
      const folderCategory = isPrivateUser ? `Users/${currentUser.uid}` : 'Admin';
      const fileName = isPrivateUser ? `user_database_${currentUser.uid}.json` : 'sumrday_master_backup_LATEST.json';

      const response = await safeFetchGAS(scriptUrl, {
        action: 'get_master_database',
        folderCategory,
        fileName
      }, notify);
      if (!response) return null;

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        if (notify) notify('✅ Master Database berhasil diambil dari Google Drive!', 'success');
        const rawPayload = result.data.payload || result.data;
        const normalized = rawPayload.collections ? { ...rawPayload, ...rawPayload.collections } : rawPayload;
        if (result.updatedAt && !normalized.exportedAt) {
          normalized.exportedAt = result.updatedAt;
        }
        return normalized;
      }
      if (notify) notify(`⚠️ ${result.message || 'Master Database tidak ditemukan di Google Drive.'}`, 'error');
      return null;
    } catch (err) {
      console.error('[GoogleSync] fetchMasterDatabaseFromDrive error:', err);
      if (notify) notify(`❌ Gagal mengambil database dari Drive: ${err.message}`, 'error');
      return null;
    }
  },

  /**
   * Sync User Accounts to Google Sheets and Drive
   */
  async syncUsersToGoogle(users, notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) return false;

      const response = await safeFetchGAS(scriptUrl, {
        action: 'sync_users',
        sheetId,
        payload: users
      }, notify);

      const res = await response.json();
      if (res.status === 'success') {
        if (notify) notify(`✅ ${res.message || 'Data pengguna berhasil disinkronkan!'}`, 'success');
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[GoogleSync] syncUsersToGoogle error:', err);
      if (notify) notify(`❌ Gagal sinkronisasi user: ${err.message}`, 'error');
      return false;
    }
  },

  /**
   * Fetch User Accounts from Google Sheets / Drive
   */
  async fetchUsersFromGoogle(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) return null;

      const response = await safeFetchGAS(scriptUrl, {
        action: 'get_users',
        sheetId
      }, notify);

      const res = await response.json();
      if (res.status === 'success' && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('[GoogleSync] fetchUsersFromGoogle error:', err);
      return null;
    }
  },

  /**
   * Fetch Chat Messages from Google Sheets / Drive
   */
  async fetchChatsFromGoogle(notify) {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) return null;

      const response = await safeFetchGAS(scriptUrl, {
        action: 'get_chats',
        sheetId
      }, notify);

      const res = await response.json();
      if (res.status === 'success' && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('[GoogleSync] fetchChatsFromGoogle error:', err);
      return null;
    }
  },

  /**
   * Super 1-Click Migration: Export all data to Google Drive & Cloudinary & update mode
   */
  async migrateAllDataToDriveAndCloudinary(notify) {
    try {
      if (notify) notify('🚀 Memulai Super Migrasi Database ke Google Drive & Cloudinary...');
      
      // 1. Sync All to Sheets & Drive
      const syncSuccess = await this.syncAllData(notify);
      if (!syncSuccess) {
        if (notify) notify('⚠️ Migrasi Google Sheets/Drive mengalami kendala, melanjutkan backup partisi...', 'warning');
      }

      // 2. Set default storage engine to drive_first
      const settings = await storage.getItem('porto_settings', {});
      settings.storageEngine = 'drive_first';
      settings.syncMode = 'auto';
      await storage.setItem('porto_settings', settings);

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('porto_storage_engine', 'drive_first');
      }

      if (notify) notify('🎉 Super Migrasi Selesai! sumr.day OS kini beroperasi dalam mode "Google Drive & Cloudinary First" (Zero Firebase Quota Active).', 'success');
      return true;
    } catch (err) {
      console.error('[GoogleSync] Migration error:', err);
      if (notify) notify(`❌ Migrasi gagal: ${err.message}`, 'error');
      return false;
    }
  }
};

// ── REALTIME DEBOUNCED AUTO-SYNC TO GOOGLE DRIVE & SHEETS ──
let _autoSyncTimer = null;
let _driveSyncTimer = null;
const _pendingKeys = new Set();

export function scheduleAutoSyncToSheets(key) {
  if (!key) return;
  if (key === 'porto_settings') {
    _failed404Url = null;
    _isGas404OfflineLogged = false;
  }
  _pendingKeys.add(key);

  if (_autoSyncTimer) clearTimeout(_autoSyncTimer);

  _autoSyncTimer = setTimeout(async () => {
    try {
      const settings = await storage.getItem('porto_settings', {});
      const syncMode = settings.syncMode || (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_sync_mode') : 'auto') || 'auto';
      if (syncMode === 'offline') {
        return; // Skip auto sync when in offline mode
      }

      const scriptUrl = sanitizeScriptUrl(settings.googleAppsScriptUrl);
      const sheetId = extractSheetId(settings.googleSheetId);
      if (!scriptUrl) return;

      if (_failed404Url && scriptUrl === _failed404Url) {
        return; // Pause auto-sync if this exact GAS URL returned 404
      }

      const keysToSync = Array.from(_pendingKeys);
      _pendingKeys.clear();

      // 1. Sync specific Sheets tabs if Sheet ID is set
      if (sheetId && keysToSync.length > 0) {
        const syncTasks = [];
        for (const k of keysToSync) {
          if (k === 'porto_projects') {
            syncTasks.push((async () => {
              const projects = await storage.getItem('porto_projects', []);
              await googleSync.syncProjectsWithSheets(projects, null, null);
              await storage.setItem('porto_last_sync_projects', Date.now(), false);
            })());
          } else if (k === 'porto_memo_notes' || k === 'porto_memo_folders') {
            syncTasks.push((async () => {
              const notes = await storage.getItem('porto_memo_notes', []);
              const folders = await storage.getItem('porto_memo_folders', []);
              await googleSync.syncNotes(notes, folders, null);
              await storage.setItem('porto_last_sync_notes', Date.now(), false);
            })());
          } else if (k === 'porto_blog_posts') {
            syncTasks.push((async () => {
              await googleSync.syncWebsite(null);
              await storage.setItem('porto_last_sync_website', Date.now(), false);
            })());
          } else if (k === 'porto_shop_products') {
            syncTasks.push((async () => {
              const products = await storage.getItem('porto_shop_products', []);
              await googleSync.syncShop(products, null);
              await storage.setItem('porto_last_sync_shop', Date.now(), false);
            })());
          } else if (k === 'porto_transactions') {
            syncTasks.push((async () => {
              const transactions = await storage.getItem('porto_transactions', []);
              await googleSync.syncTransactions(transactions, null);
              await storage.setItem('porto_last_sync_transactions', Date.now(), false);
            })());
          } else if (k === 'porto_social_updates') {
            syncTasks.push((async () => {
              await googleSync.syncSocialUpdates(null, null);
              await storage.setItem('porto_last_sync_social_updates', Date.now(), false);
            })());
          } else if (k === 'porto_forms') {
            syncTasks.push((async () => {
              const forms = await storage.getItem('porto_forms', []);
              await googleSync.syncForms(forms, null);
              await storage.setItem('porto_last_sync_forms', Date.now(), false);
            })());
          } else if (k === 'porto_form_responses') {
            syncTasks.push((async () => {
              const formResponses = await storage.getItem('porto_form_responses', {});
              await googleSync.syncFormResponses(formResponses, null);
              await storage.setItem('porto_last_sync_form_responses', Date.now(), false);
            })());
          } else if (k === 'porto_rate_cards' || k === 'porto_rate_card_addons') {
            syncTasks.push((async () => {
              await googleSync.syncRateCards(null);
              await storage.setItem('porto_last_sync_ratecards', Date.now(), false);
            })());
          } else if (k === 'porto_client_reviews' || k === 'porto_client_feedbacks') {
            syncTasks.push((async () => {
              await googleSync.syncClientReviews(null);
              await storage.setItem('porto_last_sync_reviews', Date.now(), false);
            })());
          } else if (k === 'porto_flash_sales') {
            syncTasks.push((async () => {
              await googleSync.syncFlashSales(null);
              await storage.setItem('porto_last_sync_flash_sales', Date.now(), false);
            })());
          } else if (k === 'porto_partnerships' || k === 'porto_affiliate_withdrawals') {
            syncTasks.push((async () => {
              await googleSync.syncPartnerships(null);
              await storage.setItem('porto_last_sync_partnerships', Date.now(), false);
            })());
          } else if (k === 'porto_contracts_spk') {
            syncTasks.push((async () => {
              await googleSync.syncContracts(null);
              await storage.setItem('porto_last_sync_contracts', Date.now(), false);
            })());
          }
        }
        if (syncTasks.length > 0) {
          await Promise.allSettled(syncTasks);
        }
      }

      // 2. Auto-save Master Database snapshot to Google Drive in the background
      if (_driveSyncTimer) clearTimeout(_driveSyncTimer);
      _driveSyncTimer = setTimeout(async () => {
        try {
          await googleSync.backupToDrive(null);
        } catch (driveErr) {
          console.warn('[AutoSync] Background Drive sync error:', driveErr);
        }
      }, 1500);

      await storage.setItem('porto_last_sync_all', Date.now(), false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_sync_completed', { detail: { timestamp: Date.now() } }));
      }
    } catch (e) {
      console.warn('[AutoSync] Background Google sync failed:', e);
    }
  }, 2500);
}

// ── EVENT-DRIVEN SYNC LISTENER (DECOUPLED FROM STORAGE.TS - ADMIN ONLY) ──
if (typeof window !== 'undefined') {
  window.addEventListener('porto_storage_dirty', (e) => {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) return;
    if (e && e.detail && e.detail.key) {
      scheduleAutoSyncToSheets(e.detail.key);
    }
  });

  window.addEventListener('porto_request_drive_sync', () => {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) return;
    googleSync.fetchMasterDatabaseFromDrive(null).then(async (masterData) => {
      if (masterData && typeof masterData === 'object') {
        const driveExportedMs = masterData.exportedAt ? new Date(masterData.exportedAt).getTime() : 0;
        const lastLocalWriteMs = Number(localStorage.getItem('porto_last_local_write_ts') || 0);
        const isDriveNewer = driveExportedMs > 0 && driveExportedMs > lastLocalWriteMs;

        for (const [k, v] of Object.entries(masterData)) {
          if (k.startsWith('porto_') && v !== undefined && v !== null) {
            try {
              const existingLocal = await storage.getItem(k, null);
              const isLocalEmpty = existingLocal === null || existingLocal === undefined ||
                (Array.isArray(existingLocal) && existingLocal.length === 0) ||
                (typeof existingLocal === 'object' && !Array.isArray(existingLocal) && Object.keys(existingLocal).length === 0);
              const isDriveNonEmpty = !Array.isArray(v) || v.length > 0;

              // Only hydrate from Drive if local is empty OR Drive snapshot is strictly newer than local edits
              if (isDriveNonEmpty && (isLocalEmpty || isDriveNewer)) {
                await storage.setItem(k, v, false);
              }
            } catch (err) {
              console.warn('[GoogleSync] Skip local hydration key:', k, err);
            }
          }
        }
        window.dispatchEvent(new CustomEvent('porto_drive_master_hydrated'));
      }
    }).catch(() => {});
  });
}


