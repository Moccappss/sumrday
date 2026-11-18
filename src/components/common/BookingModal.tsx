import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, CheckCircle2, ChevronRight, ChevronLeft,
  X, User, Mail, Phone, MessageSquare, ExternalLink, Download,
  Sparkles, Video, ShieldCheck, ArrowRight, Check
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { createGoogleCalendarUrl, downloadIcsFile, createIcsFileContent } from '../../utils/calendarUtils';
import { dispatchNotificationAlert } from '../../utils/notificationWebhook';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

const DEFAULT_SERVICES = [
  { id: 'consultation', name: 'Konsultasi Desain & Branding', duration: '30 Menit', desc: 'Diskusi visual brand identity, UI/UX, dan positioning produk.' },
  { id: 'web_dev', name: 'Proyek Web & App Development', duration: '45 Menit', desc: 'Rancang arsitektur website, fitur CMS, dan integrasi custom.' },
  { id: 'marketing', name: 'Strategi Digital Marketing & Ads', duration: '30 Menit', desc: 'Evaluasi funnel penjualan, campaign media sosial, & SEO.' },
  { id: 'general', name: 'Discovery & Intro Call', duration: '20 Menit', desc: 'Perkenalan singkat dan penjajakan kerjasama proyek.' },
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '19:00', '20:00'
];

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, defaultService }) => {
  const { isDark } = useWebsiteTheme();
  const accentColor = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || '#7c3aed';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState(defaultService || DEFAULT_SERVICES[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('10:00');

  // Client Info Form
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    platform: 'Google Meet'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Settings
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [bookingConfig, setBookingConfig] = useState({
    platform: 'WhatsApp',
    modalTitle: 'Jadwalkan Konsultasi',
    modalSubtitle: 'Tersambung langsung via WhatsApp / Online Call',
    adminWhatsApp: '',
    customPlatformName: '',
    customServices: DEFAULT_SERVICES
  });

  useEffect(() => {
    if (isOpen) {
      storage.getItem('porto_booking_settings', {}).then(settings => {
        if (settings) {
          const cfg = {
            platform: settings.platform || 'WhatsApp',
            modalTitle: settings.modalTitle || 'Jadwalkan Konsultasi',
            modalSubtitle: settings.modalSubtitle || (settings.platform === 'WhatsApp' ? 'Tersambung langsung via WhatsApp / Online Call' : 'Tersinkronisasi langsung dengan Google Calendar'),
            adminWhatsApp: settings.adminWhatsApp || '',
            customPlatformName: settings.customPlatformName || '',
            customServices: (settings.customServices && settings.customServices.length > 0) ? settings.customServices : DEFAULT_SERVICES
          };
          setBookingConfig(cfg);
          if (cfg.customServices.length > 0) {
            setServices(cfg.customServices);
            if (!defaultService || !cfg.customServices.some(s => s.id === defaultService)) {
              setSelectedService(cfg.customServices[0].id);
            }
          }
          setClientInfo(prev => ({ ...prev, platform: cfg.platform }));
        }
      });
    }
  }, [isOpen, defaultService]);

  if (!isOpen) return null;

  const currentServiceObj = services.find(s => s.id === selectedService) || services[0] || DEFAULT_SERVICES[0];

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as any);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInfo.name.trim() || !clientInfo.phone.trim()) {
      alert('Mohon lengkapi Nama dan No. WhatsApp Anda');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = `book_${Date.now()}`;

      const calendarUrl = createGoogleCalendarUrl({
        title: `Konsultasi: ${currentServiceObj.name} - ${clientInfo.name}`,
        description: `Sesi Konsultasi Layanan: ${currentServiceObj.name}\nKlien: ${clientInfo.name} (${clientInfo.phone})\nCatatan: ${clientInfo.notes || '-'}\nPlatform: ${clientInfo.platform}`,
        dateStr: selectedDate,
        timeStr: selectedTime,
        durationMinutes: parseInt(currentServiceObj.duration) || 30
      });

      const icsData = createIcsFileContent({
        title: `Konsultasi ${currentServiceObj.name} - ${clientInfo.name}`,
        description: `Konsultasi bersama sumr.day crew via ${clientInfo.platform}.\nKlien: ${clientInfo.name}`,
        dateStr: selectedDate,
        timeStr: selectedTime,
        durationMinutes: parseInt(currentServiceObj.duration) || 30
      });

      const newBooking = {
        id: bookingId,
        serviceId: selectedService,
        serviceName: currentServiceObj.name,
        date: selectedDate,
        time: selectedTime,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        clientNotes: clientInfo.notes,
        platform: clientInfo.platform,
        status: 'pending',
        createdAt: new Date().toISOString(),
        googleCalendarUrl: calendarUrl,
        icsContent: icsData
      };

      // Save to local storage
      const existing = await storage.getItem('porto_bookings', []);
      const updated = [newBooking, ...(Array.isArray(existing) ? existing : [])];
      await storage.setItem('porto_bookings', updated);

      // Dispatch Webhook Notification
      dispatchNotificationAlert({
        type: 'booking',
        title: `Jadwal Konsultasi Baru: ${clientInfo.name}`,
        message: `${clientInfo.name} menjadwalkan "${currentServiceObj.name}" pada ${selectedDate} pukul ${selectedTime} WIB.`,
        data: newBooking
      });

      setCreatedBooking(newBooking);
      setStep(4);
    } catch (err) {
      console.error('Booking submission error:', err);
      alert('Terjadi kesalahan saat menyimpan jadwal. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsAppConfirmation = () => {
    if (!createdBooking) return;
    const targetPhone = bookingConfig.adminWhatsApp || '6281234567890';
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const msg = `Halo sumr.day crew! Saya sudah menjadwalkan konsultasi *${createdBooking.serviceName}* pada tanggal *${createdBooking.date}* jam *${createdBooking.time} WIB* (via ${createdBooking.platform}).\n\nNama: ${createdBooking.clientName}\nNo. HP: ${createdBooking.clientPhone}${createdBooking.clientNotes ? '\nCatatan: ' + createdBooking.clientNotes : ''}\n\nMohon konfirmasinya ya. Terima kasih!`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Theme-reactive tokens
  const cardBg = isDark ? '#151824' : '#ffffff';
  const headerBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const panelBg = isDark ? 'rgba(255, 255, 255, 0.02)' : '#f1f5f9';
  const itemBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc';
  const inputBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc';
  const border = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardShadow = isDark
    ? '0 25px 60px rgba(0, 0, 0, 0.8)'
    : '0 25px 60px rgba(15, 23, 42, 0.14)';

  return (
    <div
      className="sumr-modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 99999,
        background: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      <div
        className="sumr-modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          background: cardBg,
          color: textColor,
          width: '100%', maxWidth: 680, maxHeight: '90vh',
          borderRadius: 24,
          border: `1px solid ${border}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: cardShadow,
          boxSizing: 'border-box'
        }}
      >
        {/* Mobile Drag/Sheet Handle */}
        <div className="sumr-sheet-handle" />
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: headerBg
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg, ${accentColor}, #3b82f6)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${accentColor}40`
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                {bookingConfig.modalTitle || 'Jadwalkan Konsultasi'}
              </div>
              <div style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>
                {bookingConfig.modalSubtitle || (bookingConfig.platform === 'WhatsApp' ? 'Tersambung langsung via WhatsApp / Online Call' : 'Tersinkronisasi langsung dengan Google Calendar')}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Tutup"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: `1px solid ${border}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: textColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper Progress */}
        {step < 4 && (
          <div style={{ display: 'flex', padding: '12px 24px', gap: 8, background: panelBg, borderBottom: `1px solid ${border}` }}>
            {[
              { num: 1, label: 'Layanan' },
              { num: 2, label: 'Waktu' },
              { num: 3, label: 'Data Diri' }
            ].map(s => (
              <div key={s.num} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: step >= s.num ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                  color: step >= s.num ? '#fff' : textMuted,
                  fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {step > s.num ? <Check size={12} strokeWidth={3} /> : s.num}
                </div>
                <span style={{ fontSize: 12, fontWeight: 750, color: step >= s.num ? textColor : textMuted }}>
                  {s.label}
                </span>
                {s.num < 3 && <div style={{ flex: 1, height: 2, background: step > s.num ? accentColor : border }} />}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pilih Topik atau Jenis Layanan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {services.map(srv => {
                  const isSelected = selectedService === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv.id)}
                      style={{
                        padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                        background: isSelected ? `${accentColor}15` : itemBg,
                        border: isSelected ? `2px solid ${accentColor}` : `1.5px solid ${border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 4px 16px ${accentColor}25` : 'none'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 850, color: isSelected ? accentColor : textColor, marginBottom: 3 }}>
                          {srv.name}
                        </div>
                        <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.4 }}>
                          {srv.desc}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 10px', borderRadius: 10,
                        background: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                        color: isSelected ? '#fff' : textMuted,
                        fontSize: 11, fontWeight: 850, flexShrink: 0
                      }}>
                        {srv.duration}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATE & TIME */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Pilih Tanggal</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%', height: 48, fontSize: 14, fontWeight: 700, borderRadius: 14,
                    background: inputBg, color: textColor, border: `1px solid ${border}`, padding: '0 14px',
                    boxSizing: 'border-box', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Pilih Slot Waktu (WIB)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                  {TIME_SLOTS.map(t => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        style={{
                          padding: '12px 0', borderRadius: 12,
                          border: isSelected ? `2px solid ${accentColor}` : `1px solid ${border}`,
                          background: isSelected ? accentColor : itemBg,
                          color: isSelected ? '#fff' : textColor,
                          fontSize: 13, fontWeight: 850, cursor: 'pointer',
                          boxShadow: isSelected ? `0 4px 12px ${accentColor}40` : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{
                padding: '14px 18px', borderRadius: 16,
                background: bookingConfig.platform === 'WhatsApp' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: bookingConfig.platform === 'WhatsApp' ? '1px solid rgba(37, 211, 102, 0.25)' : '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                {bookingConfig.platform === 'WhatsApp' ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.74 14.07c-.24.67-1.39 1.28-1.92 1.36-.5.08-1.14.12-3.32-.78-2.64-1.09-4.32-3.77-4.45-3.95-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.18.24-.26.53-.32.71-.32.18 0 .36.002.51.01.17.01.39-.06.61.47.23.55.78 1.9.85 2.04.07.14.12.31.02.5-.1.19-.15.31-.3.48-.15.18-.32.4-.46.54-.15.15-.31.31-.13.62.18.31.8 1.31 1.71 2.12 1.17 1.04 2.16 1.36 2.47 1.51.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.84.87 2.15 1.03.31.16.52.24.6.37.08.13.08.76-.16 1.43z" />
                  </svg>
                ) : bookingConfig.platform === 'Google Meet' ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect width="14" height="14" x="2" y="5" rx="3" fill="#00832d" /><path fill="#00ac47" d="M16 14.5l5 3.5V6l-5 3.5v5z" /><circle cx="9" cy="12" r="2.5" fill="#fff" /></svg>
                ) : bookingConfig.platform === 'Zoom' ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#2D8CFF"><path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h7a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 14 19H7a2.5 2.5 0 0 1-2.5-2.5v-9zM18 9.25l3.5-2.19a.75.75 0 0 1 1.14.64v8.6a.75.75 0 0 1-1.14.64L18 14.75V9.25z" /></svg>
                ) : (
                  <Video size={18} color="#3b82f6" />
                )}
                <div style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>
                  {bookingConfig.platform === 'WhatsApp' ? (
                    <span>Konsultasi akan berlangsung langsung via <strong>WhatsApp Call / Chat</strong> dengan tim kami.</span>
                  ) : bookingConfig.platform === 'Kustom' ? (
                    <span>Konsultasi akan dilangsungkan melalui <strong>{bookingConfig.customPlatformName || 'Saluran Online Kustom'}</strong>.</span>
                  ) : (
                    <span>Konsultasi akan dilangsungkan secara online melalui <strong>{bookingConfig.platform || 'Google Meet'}</strong>.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CLIENT INFO FORM */}
          {step === 3 && (
            <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Nama Lengkap *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    style={{
                      width: '100%', height: 44, borderRadius: 12, paddingLeft: 38,
                      background: inputBg, color: textColor, border: `1px solid ${border}`,
                      boxSizing: 'border-box', outline: 'none', fontSize: 13.5
                    }}
                  />
                  <User size={16} color={textMuted} style={{ position: 'absolute', left: 12, top: 14 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>No. WhatsApp *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      required
                      placeholder="08123456789"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      style={{
                        width: '100%', height: 44, borderRadius: 12, paddingLeft: 38,
                        background: inputBg, color: textColor, border: `1px solid ${border}`,
                        boxSizing: 'border-box', outline: 'none', fontSize: 13.5
                      }}
                    />
                    <Phone size={16} color={textMuted} style={{ position: 'absolute', left: 12, top: 14 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="budi@example.com"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      style={{
                        width: '100%', height: 44, borderRadius: 12, paddingLeft: 38,
                        background: inputBg, color: textColor, border: `1px solid ${border}`,
                        boxSizing: 'border-box', outline: 'none', fontSize: 13.5
                      }}
                    />
                    <Mail size={16} color={textMuted} style={{ position: 'absolute', left: 12, top: 14 }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: textMuted, marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>Catatan / Kebutuhan Singkat</label>
                <textarea
                  placeholder="Ceritakan secara singkat ide, pertanyaan, atau proyek yang ingin Anda diskusikan..."
                  value={clientInfo.notes}
                  onChange={(e) => setClientInfo({ ...clientInfo, notes: e.target.value })}
                  style={{
                    width: '100%', minHeight: 70, borderRadius: 12, resize: 'none', padding: 12,
                    background: inputBg, color: textColor, border: `1px solid ${border}`,
                    boxSizing: 'border-box', outline: 'none', fontSize: 13
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%', height: 48, borderRadius: 14, fontSize: 14, fontWeight: 900, marginTop: 8,
                  background: accentColor, color: '#ffffff', border: 'none', cursor: 'pointer',
                  boxShadow: `0 4px 16px ${accentColor}40`, transition: 'all 0.15s ease'
                }}
              >
                {isSubmitting ? 'Menjadwalkan...' : 'Konfirmasi & Jadwalkan Sekarang'}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION & ACTIONS */}
          {step === 4 && createdBooking && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: textColor, margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>Janji Temu Berhasil Dibuat!</h3>
                <p style={{ color: textMuted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  Terima kasih, <strong>{createdBooking.clientName}</strong>. Jadwal Anda pada <strong>{createdBooking.date} ({createdBooking.time} WIB)</strong> via <strong>{createdBooking.platform}</strong> sudah tersimpan.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400, marginTop: 10 }}>
                {/* Primary WhatsApp Action */}
                <button
                  type="button"
                  onClick={handleOpenWhatsAppConfirmation}
                  style={{
                    height: 48, borderRadius: 14, background: '#10b981', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 850, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)', border: 'none'
                  }}
                >
                  <Phone size={17} />
                  <span>Konfirmasi & Chat via WhatsApp</span>
                  <ExternalLink size={14} />
                </button>

                {/* Secondary Google Calendar */}
                <a
                  href={createdBooking.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    height: 42, borderRadius: 12, background: itemBg, color: textColor,
                    border: `1px solid ${border}`,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 800, fontSize: 12
                  }}
                >
                  <Calendar size={15} color="#3b82f6" />
                  <span>Simpan ke Google Calendar</span>
                </a>

                {/* Download .ics */}
                {createdBooking.icsContent && (
                  <button
                    type="button"
                    onClick={() => downloadIcsFile(`konsultasi-${createdBooking.date}.ics`, createdBooking.icsContent)}
                    style={{
                      height: 40, borderRadius: 12, background: itemBg, color: textMuted,
                      border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontWeight: 750, fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    <Download size={14} />
                    <span>Unduh Berkas iCal (.ics)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 3 && (
          <div style={{
            padding: '16px 24px', borderTop: `1px solid ${border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: headerBg
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  padding: '8px 18px', borderRadius: 100, fontWeight: 750,
                  background: itemBg, border: `1px solid ${border}`, color: textColor,
                  cursor: 'pointer'
                }}
              >
                Kembali
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '8px 24px', borderRadius: 100, fontWeight: 850,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: accentColor, color: '#ffffff', border: 'none',
                boxShadow: `0 4px 14px ${accentColor}40`
              }}
            >
              <span>Lanjut</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
