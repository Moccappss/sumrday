import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, FolderKanban, Download, Copy, Check, Lock, Unlock, 
  ExternalLink, Sparkles, Layers, Type, ShieldCheck, Eye, 
  FileText, MessageCircle, AlertCircle, RefreshCw, Box
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import { openWhatsApp, cleanPhoneForWa } from '../../utils/whatsappTemplates';
import Model3DViewer from '../common/Model3DViewer';

export interface BrandColor {
  name: string;
  hex: string;
  cmyk?: string;
  role?: 'Primary' | 'Secondary' | 'Accent' | 'Neutral' | 'Background';
}

export interface BrandVaultData {
  id: string; // prjId or clientId
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  brandName: string;
  tagline?: string;
  industry?: string;
  primaryLogoUrl?: string;
  secondaryLogoUrl?: string;
  markLogoUrl?: string;
  guidelinePdfUrl?: string;
  model3dUrl?: string;
  colors: BrandColor[];
  typography: {
    primaryFont: string;
    secondaryFont?: string;
    notes?: string;
  };
  masterDriveUrl?: string;
  isUnlocked: boolean;
  paymentStatus?: 'dp' | 'lunas';
  updatedAt: string;
}

interface ClientBrandVaultProps {
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  isDark?: boolean;
  accentColor?: string;
}

export const ClientBrandVault: React.FC<ClientBrandVaultProps> = ({
  clientId,
  clientEmail,
  clientPhone,
  isDark = true,
  accentColor = 'var(--cms-accent, #7c3aed)'
}) => {
  const [vaults, setVaults] = useState<BrandVaultData[]>([]);
  const [activeVaultIdx, setActiveVaultIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [showCheckerboard, setShowCheckerboard] = useState(true);
  const [studioPhone, setStudioPhone] = useState('081234567890');

  useEffect(() => {
    storage.getItem<any>('porto_business_profile', null).then(prof => {
      if (prof?.whatsapp) setStudioPhone(prof.whatsapp.replace(/\D/g, ''));
    }).catch(() => {});
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allVaults, projects, orders] = await Promise.all([
        storage.getItem<BrandVaultData[]>('porto_brand_vaults', []),
        storage.getItem<any[]>('porto_projects', []),
        storage.getItem<any[]>('porto_client_orders', [])
      ]);

      const cEmail = (clientEmail || '').toLowerCase().trim();
      const cPhone = (clientPhone || '').replace(/\D/g, '');

      // 1. Existing explicitly configured vaults
      const matched = (Array.isArray(allVaults) ? allVaults : []).filter(v => {
        if (!v) return false;
        if (clientId && v.clientId === clientId) return true;
        if (cEmail && v.clientEmail && v.clientEmail.toLowerCase().trim() === cEmail) return true;
        if (cPhone && v.clientPhone && v.clientPhone.replace(/\D/g, '') === cPhone) return true;
        return false;
      });

      // 2. Synthesize vaults from completed/active projects or orders if not yet configured
      if (matched.length === 0) {
        const myProjects = (Array.isArray(projects) ? projects : []).filter(p => {
          if (!p) return false;
          const pEmail = (p.clientEmail || '').toLowerCase().trim();
          const pPhone = (p.clientPhone || '').replace(/\D/g, '');
          return (clientId && p.clientId === clientId) || (cEmail && pEmail === cEmail) || (cPhone && pPhone === cPhone);
        });

        const myOrders = (Array.isArray(orders) ? orders : []).filter(o => {
          if (!o) return false;
          return clientId && o.clientId === clientId;
        });

        if (myProjects.length > 0 || myOrders.length > 0) {
          const primaryProject = myProjects[0] || {};
          const isPaid = primaryProject.status === 'Selesai' || primaryProject.paymentStatus === 'lunas' ||
                         myOrders.some(o => o.status === 'Selesai' || o.paymentStatus === 'lunas');

          matched.push({
            id: primaryProject.id || 'VAULT-DEFAULT',
            clientId: clientId,
            clientEmail: clientEmail,
            clientPhone: clientPhone,
            brandName: primaryProject.clientCompany || primaryProject.client || 'Brand Anda',
            tagline: 'Identitas Visual Resmi Karya sumr.day Studio',
            industry: primaryProject.category || 'Creative & Digital',
            primaryLogoUrl: primaryProject.coverImage || primaryProject.previewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
            secondaryLogoUrl: primaryProject.thumbnail || '',
            masterDriveUrl: primaryProject.clientDriveUrl || primaryProject.driveUrl || '',
            isUnlocked: isPaid,
            paymentStatus: isPaid ? 'lunas' : 'dp',
            colors: [
              { name: 'Core Brand Primary', hex: accentColor, cmyk: 'C:75 M:80 Y:0 K:0', role: 'Primary' },
              { name: 'Skena Warm Accent', hex: '#D95629', cmyk: 'C:10 M:80 Y:95 K:2', role: 'Accent' },
              { name: 'Dark Void Charcoal', hex: '#0f172a', cmyk: 'C:80 M:70 Y:60 K:80', role: 'Background' },
              { name: 'Pure White Crisp', hex: '#ffffff', cmyk: 'C:0 M:0 Y:0 K:0', role: 'Neutral' }
            ],
            typography: {
              primaryFont: 'Outfit (Modern Geometry Display)',
              secondaryFont: 'Inter (High Readability Body)',
              notes: 'Gunakan Outfit untuk headline dan judul promosi. Gunakan Inter untuk body text & dokumen.'
            },
            updatedAt: new Date().toISOString()
          });
        }
      }

      setVaults(matched);
    } catch (err) {
      console.error('Failed to load Brand Vault:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = storage.listenItem('porto_brand_vaults', () => loadData());
    return () => unsub?.();
  }, [clientId, clientEmail, clientPhone]);

  const activeVault = vaults[activeVaultIdx] || null;

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    haptic.light();
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleInquirePelunasan = () => {
    const text = `Halo Admin Studio sumr.day! Saya ingin melakukan pelunasan sisa tagihan untuk meng-unlock master file & Google Drive Brand Vault (${activeVault?.brandName || 'Proyek Saya'}). Mohon info rekening & instruksinya ya. Terima kasih!`;
    openWhatsApp(studioPhone, text);
  };

  const cardBg = isDark ? 'rgba(30, 41, 59, 0.55)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: subTextColor }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <div>Memuat Brand Asset Vault Anda...</div>
      </div>
    );
  }

  if (!activeVault) {
    return (
      <div style={{
        padding: '60px 24px',
        borderRadius: 24,
        background: cardBg,
        border: `1.5px dashed ${cardBorder}`,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14
      }}>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: `${accentColor}18`,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Palette size={28} />
        </div>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 900, color: textColor, margin: 0 }}>
          Brand Vault Belum Diaktifkan
        </h3>
        <p style={{ fontSize: 13.5, color: subTextColor, maxWidth: 460, margin: 0, lineHeight: 1.6 }}>
          Aset resmi brand (Logo vector, palet warna, tipografi, dan direktori master Drive) akan muncul otomatis di sini begitu proyek identitas visual Anda diproses oleh tim sumr.day Studio.
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('porto_open_inquiry_modal'))}
          style={{
            marginTop: 8,
            padding: '10px 22px',
            borderRadius: 100,
            border: 'none',
            background: accentColor,
            color: '#ffffff',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Sparkles size={14} />
          <span>Mulai Proyek Brand Baru</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* ── 1. HEADER BANNER ── */}
      <div style={{
        padding: '28px 24px',
        borderRadius: 24,
        background: isDark 
          ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(217, 86, 41, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(217, 86, 41, 0.05) 100%)',
        border: `1.5px solid ${cardBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 850,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: accentColor,
            marginBottom: 6
          }}>
            <Palette size={14} />
            <span>Official Client Brand Vault</span>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 24,
            fontWeight: 900,
            color: textColor,
            margin: '0 0 6px'
          }}>
            {activeVault.brandName}
          </h2>
          <div style={{ fontSize: 13, color: subTextColor }}>
            {activeVault.tagline || 'Panduan Identitas Visual & Direktori Master File Resmi'}
          </div>
        </div>

        {/* Lock / Unlock Status Badge */}
        <div>
          {activeVault.isUnlocked ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 100,
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#10b981',
              fontSize: 12.5,
              fontWeight: 800
            }}>
              <Unlock size={14} />
              <span>Akses Penuh Master File (Lunas)</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 100,
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.35)',
              color: '#f59e0b',
              fontSize: 12.5,
              fontWeight: 800
            }}>
              <Lock size={14} />
              <span>DP 50% (Master Terkunci Hingga Pelunasan)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. LOGO ASSET SHOWCASE ── */}
      <div style={{
        padding: '24px',
        borderRadius: 24,
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 900, color: textColor, margin: 0 }}>
              Koleksi Logo Resmi
            </h3>
            <span style={{ fontSize: 12, color: subTextColor }}>Format resolusi tinggi siap pakai untuk kebutuhan digital & cetak</span>
          </div>

          <button
            type="button"
            onClick={() => setShowCheckerboard(!showCheckerboard)}
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              color: subTextColor,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Eye size={13} />
            <span>{showCheckerboard ? 'Background Transparan' : 'Background Solid'}</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}>
          {/* Logo Primer */}
          <div style={{
            borderRadius: 18,
            border: `1px solid ${cardBorder}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: showCheckerboard 
                ? (isDark 
                  ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px'
                  : 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px')
                : (isDark ? '#08080f' : '#ffffff'),
              position: 'relative'
            }}>
              {activeVault.primaryLogoUrl ? (
                <img
                  src={activeVault.primaryLogoUrl}
                  alt="Logo Primer"
                  style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: subTextColor, fontSize: 12 }}>Logo Primer Dalam Pengerjaan</div>
              )}
            </div>
            <div style={{
              padding: '12px 16px',
              background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              borderTop: `1px solid ${cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>Logo Primer</div>
                <div style={{ fontSize: 11, color: subTextColor }}>Format Transparan PNG / SVG</div>
              </div>
              {activeVault.primaryLogoUrl && (
                <a
                  href={activeVault.primaryLogoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: `${accentColor}18`,
                    color: accentColor,
                    fontSize: 11.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Download size={12} /> Unduh
                </a>
              )}
            </div>
          </div>

          {/* Logo Sekunder / Mark Icon */}
          <div style={{
            borderRadius: 18,
            border: `1px solid ${cardBorder}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: showCheckerboard 
                ? (isDark 
                  ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px'
                  : 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px')
                : (isDark ? '#08080f' : '#ffffff'),
              position: 'relative'
            }}>
              {activeVault.secondaryLogoUrl ? (
                <img
                  src={activeVault.secondaryLogoUrl}
                  alt="Logo Sekunder"
                  style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ color: subTextColor, fontSize: 12 }}>Logo Sekunder / Mark</div>
              )}
            </div>
            <div style={{
              padding: '12px 16px',
              background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              borderTop: `1px solid ${cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>Logo Sekunder / Favicon Mark</div>
                <div style={{ fontSize: 11, color: subTextColor }}>Format Avatar / App Icon</div>
              </div>
              {activeVault.secondaryLogoUrl && (
                <a
                  href={activeVault.secondaryLogoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: `${accentColor}18`,
                    color: accentColor,
                    fontSize: 11.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Download size={12} /> Unduh
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2B. 3D BRAND ASSET / MOCKUP VIEWER ── */}
      {activeVault.model3dUrl && (
        <div style={{
          padding: '24px',
          borderRadius: 24,
          background: cardBg,
          border: `1.5px solid ${cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 800,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4
              }}>
                <Box size={14} />
                <span>Model 3D Interaktif</span>
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor, margin: 0 }}>
                Visualisasi 3D Produk & Kemasan
              </h3>
            </div>
            {activeVault.isUnlocked && (
              <a
                href={activeVault.model3dUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  borderRadius: 100,
                  background: `${accentColor}18`,
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Download size={13} /> Unduh File .GLB
              </a>
            )}
          </div>

          <div style={{ width: '100%', height: 420, borderRadius: 18, overflow: 'hidden' }}>
            <Model3DViewer
              src={activeVault.model3dUrl}
              title={`${activeVault.brandName} 3D Model`}
              height="100%"
              isDark={isDark}
              accentColor={accentColor}
              allowLocalUpload={false}
            />
          </div>
        </div>
      )}

      {/* ── 3. BRAND COLOR PALETTE & TYPOGRAPHY ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20
      }}>
        {/* Color Palette */}
        <div style={{
          padding: '24px',
          borderRadius: 24,
          background: cardBg,
          border: `1.5px solid ${cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 900, color: textColor, margin: '0 0 4px' }}>
              Palet Warna Resmi
            </h3>
            <span style={{ fontSize: 12, color: subTextColor }}>Klik kode HEX untuk menyalin langsung ke clipboard</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeVault.colors.map((c, i) => (
              <div
                key={i}
                onClick={() => handleCopyHex(c.hex)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  border: `1px solid ${cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: c.hex,
                  border: '1px solid rgba(0,0,0,0.15)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: subTextColor }}>
                    {c.cmyk ? `${c.cmyk} • ` : ''}{c.role || 'Brand Color'}
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'monospace',
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: copiedHex === c.hex ? '#10b981' : textColor
                }}>
                  <span>{c.hex}</span>
                  {copiedHex === c.hex ? <Check size={14} color="#10b981" /> : <Copy size={13} color={subTextColor} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography Guide */}
        <div style={{
          padding: '24px',
          borderRadius: 24,
          background: cardBg,
          border: `1.5px solid ${cardBorder}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 17, fontWeight: 900, color: textColor, margin: '0 0 4px' }}>
              Panduan Tipografi & Font
            </h3>
            <span style={{ fontSize: 12, color: subTextColor }}>Kombinasi font kurasi studio untuk menjaga konsistensi visual</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              border: `1px solid ${cardBorder}`
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor, marginBottom: 4 }}>
                Primary Heading Font
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor }}>
                {activeVault.typography.primaryFont}
              </div>
            </div>

            {activeVault.typography.secondaryFont && (
              <div style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: `1px solid ${cardBorder}`
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: subTextColor, marginBottom: 4 }}>
                  Secondary Body Text Font
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                  {activeVault.typography.secondaryFont}
                </div>
              </div>
            )}

            {activeVault.typography.notes && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: `${accentColor}10`,
                border: `1px solid ${accentColor}25`,
                fontSize: 12,
                color: isDark ? '#e2e8f0' : '#334155',
                lineHeight: 1.5
              }}>
                💡 {activeVault.typography.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. MASTER FILE DRIVE DELIVERY (GATEKEEPER) ── */}
      <div style={{
        padding: '24px 28px',
        borderRadius: 24,
        background: activeVault.isUnlocked
          ? (isDark ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(14,165,233,0.08))' : 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(14,165,233,0.04))')
          : (isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)'),
        border: `1.5px solid ${activeVault.isUnlocked ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ maxWidth: 540 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 850,
            color: activeVault.isUnlocked ? '#10b981' : '#f59e0b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6
          }}>
            <FolderKanban size={14} />
            <span>Google Drive Master Delivery Vault (.AI, .EPS, .SVG, Brand Book)</span>
          </div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: textColor, margin: '0 0 6px' }}>
            {activeVault.isUnlocked
              ? 'Seluruh Master File Siap Diunduh Selamanya'
              : 'Master File Terkunci — Selesaikan Pelunasan untuk Akses'}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: subTextColor, lineHeight: 1.5 }}>
            {activeVault.isUnlocked
              ? 'Aset tersimpan aman di cloud studio sumr.day. Anda dapat mengunduh file vektor asli kapan saja tanpa khawatir berkas hilang di perangkat lokal.'
              : 'Anda telah membayar DP 50% untuk tahap eksplorasi & review. Selesaikan sisa pelunasan untuk membuka link Google Drive berisi seluruh file vektor .AI, .EPS, dan Brand Guidelines Book resmi.'}
          </p>
        </div>

        <div>
          {activeVault.isUnlocked ? (
            activeVault.masterDriveUrl ? (
              <a
                href={activeVault.masterDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px 24px',
                  borderRadius: 100,
                  background: '#10b981',
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 850,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(16,185,129,0.35)'
                }}
              >
                <FolderKanban size={16} />
                <span>Buka Google Drive Master</span>
              </a>
            ) : (
              <span style={{ fontSize: 13, color: subTextColor, fontStyle: 'italic' }}>
                Tautan Drive sedang disiapkan tim studio
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={handleInquirePelunasan}
              style={{
                padding: '12px 24px',
                borderRadius: 100,
                border: 'none',
                background: '#25d366',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 850,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(37,211,102,0.35)'
              }}
            >
              <MessageCircle size={16} />
              <span>Pelunasan via WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientBrandVault;
