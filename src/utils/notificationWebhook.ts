/**
 * Enterprise Telegram & Custom Webhook Alert Dispatcher
 */
import { storage } from './storage';

export interface AlertPayload {
  type: 'booking' | 'contact' | 'order' | 'subscriber' | 'project_deadline';
  title: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  details: string;
  scheduledAt?: string;
  linkUrl?: string;
}

/**
 * Send an instant alert to Telegram Bot and/or configured Webhooks
 */
export const dispatchNotificationAlert = async (payload: AlertPayload): Promise<boolean> => {
  try {
    const settings = (await storage.getItem('porto_settings', {})) || {};
    const bookingSettings = (await storage.getItem('porto_booking_settings', {})) || {};

    const telegramBotToken = settings.telegramBotToken || bookingSettings.telegramBotToken;
    const telegramChatId = settings.telegramChatId || bookingSettings.telegramChatId;
    const webhookUrl = settings.webhookUrl || bookingSettings.webhookUrl;

    let success = false;

    // 1. Telegram Dispatch
    if (telegramBotToken && telegramChatId) {
      const typeIcons: Record<string, string> = {
        booking: '📅 *JADWAL KONSULTASI BARU!*',
        contact: '📩 *PESAN KONTAK BARU!*',
        order: '🛍️ *PESANAN TOKO BARU!*',
        subscriber: '💌 *SUBSCRIBER BARU!*',
        project_deadline: '🎯 *DEADLINE PROYEK DEKAT!*'
      };

      const header = typeIcons[payload.type] || '🔔 *NOTIFIKASI BARU*';
      let message = `${header}\n\n`;
      message += `👤 *Nama:* ${payload.senderName}\n`;
      if (payload.senderPhone) message += `📱 *WhatsApp:* ${payload.senderPhone}\n`;
      if (payload.senderEmail) message += `✉️ *Email:* ${payload.senderEmail}\n`;
      if (payload.scheduledAt) message += `⏰ *Jadwal:* ${payload.scheduledAt}\n`;
      message += `📝 *Topik/Pesan:*\n${payload.details}\n`;
      if (payload.linkUrl) message += `\n🔗 [Buka Tautan / Kalender](${payload.linkUrl})`;

      try {
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          })
        });
        success = true;
      } catch (tgErr) {
        console.warn('[Webhook] Telegram dispatch failed:', tgErr);
      }
    }

    // 2. Custom Webhook (Make.com, Zapier, Discord, etc.)
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: payload.type,
            timestamp: new Date().toISOString(),
            ...payload
          })
        });
        success = true;
      } catch (whErr) {
        console.warn('[Webhook] Webhook dispatch failed:', whErr);
      }
    }

    return success;
  } catch (err) {
    console.error('[Webhook] General notification error:', err);
    return false;
  }
};
