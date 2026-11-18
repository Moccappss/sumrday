import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, X, CheckCircle2, Printer, Download, PenTool, 
  ShieldCheck, Send, Edit3, Eye, RefreshCw, Stamp, Sparkles
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { openWhatsApp } from '../../utils/whatsappTemplates';

interface ContractSpkModalProps {
  initialData?: {
    orderId?: string;
    clientName?: string;
    clientCompany?: string;
    clientPhone?: string;
    clientEmail?: string;
    projectName?: string;
    projectScope?: string;
    totalAmount?: number;
    dpAmount?: number;
    completionDays?: number;
    maxRevisions?: number;
  };
  onClose: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ContractSpkModal: React.FC<ContractSpkModalProps> = ({
  initialData,
  onClose,
  notify
}) => {
  const [orderId, setOrderId] = useState(initialData?.orderId || `PRJ-${Date.now().toString().slice(-6)}`);
  const [spkNumber, setSpkNumber] = useState(`SPK/SUMR/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`);
  const [spkDate, setSpkDate] = useState(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  
  // Client details
  const [clientName, setClientName] = useState(initialData?.clientName || 'Klien Terhormat');
  const [clientCompany, setClientCompany] = useState(initialData?.clientCompany || 'Perorangan / Brand');
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '');
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '');
  
  // Project details
  const [projectName, setProjectName] = useState(initialData?.projectName || 'Layanan Desain Kreatif & Visual Studio');
  const [projectScope, setProjectScope] = useState(initialData?.projectScope || 'Pembuatan identitas visual, aset desain high-resolution, source file master (AI, PSD, PDF), dan panduan brand.');
  const [completionDays, setCompletionDays] = useState(initialData?.completionDays || 7);
  const [maxRevisions, setMaxRevisions] = useState(initialData?.maxRevisions || 3);
  
  // Financial
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount || 2500000);
  const [dpAmount, setDpAmount] = useState(initialData?.dpAmount || Math.round((initialData?.totalAmount || 2500000) * 0.5));
  
  // Custom clauses / notes
  const [extraClauses, setExtraClauses] = useState('Seluruh komunikasi revisi dan persetujuan karya dilakukan melalui portal resmi sumr.day Studio.');

  // UI state
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasStudioStamp, setHasStudioStamp] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Signature Pad Studio
  const studioCanvasRef = useRef<HTMLCanvasElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [hasStudioSig, setHasStudioSig] = useState(false);
  const [isStudioDrawing, setIsStudioDrawing] = useState(false);

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

  // Keep DP synchronized if totalAmount changes and dp was half
  useEffect(() => {
    if (!initialData?.dpAmount && totalAmount) {
      setDpAmount(Math.round(totalAmount * 0.5));
    }
  }, [totalAmount, initialData?.dpAmount]);

  // Signature Coordinate Helper (Accurately maps cursor position to internal canvas pixels)
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, scale: 1 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Scale accurately from CSS display box (rect) to internal canvas resolution
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      scale: scaleX
    };
  };

  // Drawing helpers for Signature Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsStudioDrawing(true);
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isStudioDrawing) return;
    const canvas = studioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, scale } = getCanvasPoint(e);
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Crisp executive ink blue
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStudioSig(true);
  };

  const stopDrawing = () => {
    setIsStudioDrawing(false);
  };

  const clearSignature = () => {
    const canvas = studioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStudioSig(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const el = paperRef.current;
    if (!el) return;
    setIsGeneratingPdf(true);
    notify?.('Menyiapkan berkas SPK Kontrak PDF (dokumen resmi putih bersih)...', 'info');

    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const dataUrl = await htmlToImage.toJpeg(el, {
        quality: 0.92,
        backgroundColor: '#ffffff',
        pixelRatio: 2.0,
        filter: (node: any) => {
          if (node?.classList && (node.classList.contains('no-print') || node.classList.contains('cms-no-pdf'))) {
            return false;
          }
          return true;
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfW = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfH = pdf.internal.pageSize.getHeight(); // 297mm
      const imgAspect = el.offsetHeight / el.offsetWidth;
      const rawHeightMm = pdfW * imgAspect;

      if (rawHeightMm <= pdfH) {
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfW, rawHeightMm, undefined, 'FAST');
      } else {
        let remainingHeight = rawHeightMm;
        let pageOffset = 0;
        while (remainingHeight > 0) {
          pdf.addImage(dataUrl, 'JPEG', 0, -pageOffset, pdfW, rawHeightMm, undefined, 'FAST');
          remainingHeight -= pdfH;
          pageOffset += pdfH;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      const safeClient = (clientName || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeSpk = spkNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`SPK_${safeSpk}_${safeClient}.pdf`);
      notify?.(`SPK Kontrak PDF berhasil diunduh!`, 'success');
    } catch (err: any) {
      console.error('PDF error', err);
      notify?.('Gagal membuat PDF: ' + (err?.message || 'Error tidak diketahui'), 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveSpk = async () => {
    const spkRecord = {
      spkNumber,
      orderId,
      spkDate,
      clientName,
      clientCompany,
      clientPhone,
      clientEmail,
      projectName,
      projectScope,
      completionDays,
      maxRevisions,
      totalAmount,
      dpAmount,
      extraClauses,
      hasStudioStamp,
      createdAt: new Date().toISOString(),
      studioSignature: studioCanvasRef.current ? studioCanvasRef.current.toDataURL('image/png') : null
    };

    // Save to both keys so Google Sheets Sync & local readers are 100% in sync
    const savedSumr = await storage.getItem<any[]>('sumr_contracts_spk', []);
    await storage.setItem('sumr_contracts_spk', [spkRecord, ...(Array.isArray(savedSumr) ? savedSumr : [])]);

    const savedPorto = await storage.getItem<any[]>('porto_contracts_spk', []);
    await storage.setItem('porto_contracts_spk', [spkRecord, ...(Array.isArray(savedPorto) ? savedPorto : [])]);

    // Also add record to media vault folder "Dokumen & Kontrak"
    const existingVault = await storage.getItem<any[]>('porto_media_vault', []);
    const vaultItem = {
      id: `mv-spk-${Date.now()}`,
      name: `[SPK Kontrak #${orderId}] ${clientName} - ${projectName}`,
      url: window.location.href,
      type: 'document',
      source: 'local',
      folder: 'Dokumen & Kontrak',
      createdAt: new Date().toISOString()
    };
    await storage.setItem('porto_media_vault', [vaultItem, ...(Array.isArray(existingVault) ? existingVault : [])]);

    notify?.(`SPK Kontrak #${spkNumber} berhasil diterbitkan dan disimpan ke arsip resmi!`, 'success');
  };

  const handleSendWa = () => {
    const text = `*SURAT PERJANJIAN KERJA (SPK) RESMI*
No. SPK: *${spkNumber}*
Tanggal: *${spkDate}*
Proyek: *${projectName}* (#${orderId})
Klien: *${clientName}* (${clientCompany})

*Ringkasan Kesepakatan Resmi:*
• Nilai Kontrak: *${formatRp(totalAmount)}* (DP 50%: ${formatRp(dpAmount)})
• Estimasi Pengerjaan: *${completionDays} Hari Kerja*
• Batas Revisi Mayor: *Maksimal ${maxRevisions}x Revisi*
• Serah Terima: Master file diserahkan penuh setelah pelunasan.

Dokumen SPK ini sah dan mengikat kedua belah pihak. Terima kasih atas kepercayaan Anda bersama *sumr.day Studio*.`;

    openWhatsApp(clientPhone, text);
  };

  return (
    <div 
      className="cms-official-doc-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(9, 10, 16, 0.9)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 16
      }}
    >
      <div 
        className="cms-official-doc-modal" 
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 24,
          maxWidth: isEditMode ? 1200 : 920,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          transition: 'max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Control Bar (Non-Printable, Sleek Dark Titanium Bar with Icon-Only Actions) */}
        <div 
          className="no-print" 
          style={{
            background: '#090a10',
            color: '#f8fafc',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
            gap: 8,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Title & Badge (Compact for Mobile) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <FileText size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                SPK Kontrak
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                #{orderId}
              </div>
            </div>
          </div>

          {/* Action Toolbar: Pure Icon-Only Buttons for 100% Mobile Resilience */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            
            {/* Toggle Edit Form */}
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isEditMode ? '#7c3aed' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: isEditMode ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title={isEditMode ? 'Lihat Lembar SPK' : 'Edit Isi Data SPK'}
              aria-label="Edit SPK"
            >
              {isEditMode ? <Eye size={16} /> : <Edit3 size={16} />}
            </button>

            {/* Toggle Stempel Resmi */}
            <button
              type="button"
              onClick={() => setHasStudioStamp(!hasStudioStamp)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: hasStudioStamp ? 'rgba(220, 38, 38, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                color: hasStudioStamp ? '#f87171' : '#94a3b8',
                border: hasStudioStamp ? '1px solid rgba(220, 38, 38, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title={hasStudioStamp ? 'Cap Stempel Resmi: Aktif (Klik untuk nonaktifkan)' : 'Cap Stempel Resmi: Nonaktif (Klik untuk aktifkan)'}
              aria-label="Toggle Stempel"
            >
              <Stamp size={16} />
            </button>

            {/* Kirim WA */}
            <button
              type="button"
              onClick={handleSendWa}
              title="Kirim Ringkasan SPK via WhatsApp"
              aria-label="Kirim WA"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.18)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0
              }}
            >
              <Send size={15} />
            </button>

            {/* Unduh PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Unduh Berkas PDF Resmi"
              aria-label="Unduh PDF"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(2, 132, 199, 0.22)',
                color: '#38bdf8',
                border: '1px solid rgba(2, 132, 199, 0.45)',
                cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                opacity: isGeneratingPdf ? 0.7 : 1
              }}
            >
              {isGeneratingPdf ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
            </button>

            {/* Cetak PDF / Print */}
            <button
              type="button"
              onClick={handlePrint}
              title="Cetak Dokumen SPK (A4)"
              aria-label="Cetak SPK"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#38bdf8',
                color: '#090a10',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.35)'
              }}
            >
              <Printer size={15} />
            </button>

            {/* Simpan & Terbitkan */}
            <button
              type="button"
              onClick={handleSaveSpk}
              title="Simpan & Terbitkan SPK ke Arsip / Cloud"
              aria-label="Simpan SPK"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)'
              }}
            >
              <CheckCircle2 size={16} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{ 
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8', 
                cursor: 'pointer', 
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Tutup Dokumen SPK"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Content (Split view if edit mode is active) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Edit Form Panel (Sidebar when Edit Mode is active) */}
          {isEditMode && (
            <div 
              className="no-print" 
              style={{
                width: 360,
                background: '#f8fafc',
                borderRight: '1px solid #e2e8f0',
                padding: '20px 22px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                <Edit3 size={15} color="#7c3aed" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Formulir Penyesuaian SPK</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Nomor Dokumen SPK</label>
                <input 
                  type="text" 
                  value={spkNumber} 
                  onChange={e => setSpkNumber(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff', fontFamily: 'monospace' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Tanggal SPK</label>
                <input 
                  type="text" 
                  value={spkDate} 
                  onChange={e => setSpkDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Nama Klien (Pihak Kedua)</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff', fontWeight: 600 }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Perusahaan / Instansi</label>
                <input 
                  type="text" 
                  value={clientCompany} 
                  onChange={e => setClientCompany(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>No. HP / WA</label>
                  <input 
                    type="text" 
                    value={clientPhone} 
                    onChange={e => setClientPhone(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Email Klien</label>
                  <input 
                    type="text" 
                    value={clientEmail} 
                    onChange={e => setClientEmail(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Nama Proyek (Pasal 1)</label>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff', fontWeight: 600 }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Ruang Lingkup (Scope of Work)</label>
                <textarea 
                  rows={3}
                  value={projectScope} 
                  onChange={e => setProjectScope(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Waktu Kerja (Hari)</label>
                  <input 
                    type="number" 
                    value={completionDays} 
                    onChange={e => setCompletionDays(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Batas Revisi</label>
                  <input 
                    type="number" 
                    value={maxRevisions} 
                    onChange={e => setMaxRevisions(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Total Nilai (Rp)</label>
                  <input 
                    type="number" 
                    value={totalAmount} 
                    onChange={e => setTotalAmount(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff', fontWeight: 700 }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>DP 50% (Rp)</label>
                  <input 
                    type="number" 
                    value={dpAmount} 
                    onChange={e => setDpAmount(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, color: '#0f172a', background: '#ffffff' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Klausul Tambahan</label>
                <textarea 
                  rows={2}
                  value={extraClauses} 
                  onChange={e => setExtraClauses(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11.5, color: '#0f172a', background: '#ffffff' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  title="Selesai Edit & Perbarui Lembar SPK"
                  aria-label="Selesai Edit"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: '0 3px 10px rgba(124, 58, 237, 0.35)'
                  }}
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}

          {/* SPK Document Body (Pure White Printable Paper Style, 100% immune to dark mode) */}
          <div 
            ref={paperRef}
            id="spk-print-paper"
            className="cms-official-doc-paper official-doc-paper"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '38px 46px',
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: 13,
              lineHeight: 1.6,
              background: '#ffffff',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              colorScheme: 'light',
              boxSizing: 'border-box'
            }}
          >
            {/* Header Kop Surat Resmi */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2.5px solid #0f172a',
              paddingBottom: 16,
              marginBottom: 20
            }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 25, fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: -0.5, color: '#7c3aed' }}>
                  sumr.day studio
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: "'Inter', sans-serif", color: '#475569', fontWeight: 600 }}>
                  Creative Digital Design, Web Development & Branding Agency
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 10, fontFamily: "'Inter', sans-serif", color: '#64748b' }}>
                  Website: sumr.day • Email: studio@sumr.day • WA: +62 812-3456-7890
                </p>
              </div>
              <div style={{ textAlign: 'right', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>SURAT PERJANJIAN KERJA (SPK)</div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', fontWeight: 700 }}>No: {spkNumber}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Tanggal: {spkDate}</div>
              </div>
            </div>

            <h2 style={{ 
              textAlign: 'center', 
              fontSize: 15, 
              fontWeight: 800, 
              textDecoration: 'underline', 
              margin: '0 0 16px', 
              letterSpacing: 0.5,
              color: '#0f172a'
            }}>
              SURAT PERJANJIAN KERJASAMA PENGADAAN JASA KREATIF
            </h2>

            <p style={{ textAlign: 'justify', margin: '0 0 12px', color: '#0f172a' }}>
              Pada hari ini, tanggal <strong>{spkDate}</strong>, telah dibuat dan disepakati perjanjian kerja sama pengadaan layanan desain kreatif antara pihak-pihak di bawah ini:
            </p>

            {/* Data Para Pihak (Tabel Terstruktur) */}
            <table style={{ width: '100%', marginBottom: 18, borderCollapse: 'collapse', fontSize: 12.5, color: '#0f172a' }}>
              <tbody>
                <tr>
                  <td style={{ width: 145, fontWeight: 'bold', color: '#0f172a', padding: '3px 0' }}>1. Pihak Pertama (Studio)</td>
                  <td style={{ width: 15, color: '#0f172a' }}>:</td>
                  <td style={{ color: '#0f172a' }}><strong>sumr.day Creative Studio</strong> (Selaku Penyedia Jasa Kreatif)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', color: '#0f172a', padding: '3px 0' }}>2. Pihak Kedua (Klien)</td>
                  <td style={{ color: '#0f172a' }}>:</td>
                  <td style={{ color: '#0f172a' }}><strong>{clientName}</strong> ({clientCompany})</td>
                </tr>
                <tr>
                  <td style={{ color: '#475569', padding: '3px 0' }}>Kontak / Email</td>
                  <td style={{ color: '#0f172a' }}>:</td>
                  <td style={{ color: '#0f172a' }}>{clientPhone || '-'} / {clientEmail || '-'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#475569', padding: '3px 0' }}>Nomor Referensi Order</td>
                  <td style={{ color: '#0f172a' }}>:</td>
                  <td style={{ color: '#0f172a', fontFamily: 'monospace', fontWeight: 'bold' }}>#{orderId}</td>
                </tr>
              </tbody>
            </table>

            {/* Klausul & Pasal-Pasal Kontrak */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, color: '#0f172a' }}>
              <div>
                <strong style={{ color: '#0f172a', display: 'block', fontSize: 12.5 }}>PASAL 1 — RUANG LINGKUP PEKERJAAN (SCOPE OF WORK)</strong>
                <p style={{ margin: '4px 0 0', textAlign: 'justify', color: '#0f172a' }}>
                  Pihak Pertama berkewajiban menyelesaikan karya untuk proyek <strong>"{projectName}"</strong>, yang mencakup rincian spesifikasi: {projectScope}.
                </p>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', fontSize: 12.5 }}>PASAL 2 — JANGKA WAKTU & KETENTUAN REVISI</strong>
                <p style={{ margin: '4px 0 0', textAlign: 'justify', color: '#0f172a' }}>
                  1. Pekerjaan ditargetkan selesai dalam kurun waktu <strong>{completionDays} ({completionDays}) hari kerja</strong> terhitung sejak brief materi diterima lengkap oleh Pihak Pertama.<br />
                  2. Pihak Kedua berhak mengajukan revisi minor/mayor sebanyak maksimal <strong>{maxRevisions} ({maxRevisions}) kali</strong> selama proses peninjauan desain pada portal proofing resmi studio.
                </p>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', fontSize: 12.5 }}>PASAL 3 — NILAI KONTRAK & SKEMA PEMBAYARAN</strong>
                <p style={{ margin: '4px 0 0', textAlign: 'justify', color: '#0f172a' }}>
                  Total nilai kesepakatan adalah sebesar <strong>{formatRp(totalAmount)}</strong>, dengan skema pembayaran:<br />
                  • Uang Muka (DP 50%): <strong>{formatRp(dpAmount)}</strong> (dibayarkan saat penandatanganan SPK ini untuk kick-off proyek).<br />
                  • Pelunasan (50%): <strong>{formatRp(totalAmount - dpAmount)}</strong> (dibayarkan setelah pratinjau karya di-ACC sebelum penyerahan master file).
                </p>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', fontSize: 12.5 }}>PASAL 4 — HAK CIPTA & KEPEMILIKAN FILE MASTER</strong>
                <p style={{ margin: '4px 0 0', textAlign: 'justify', color: '#0f172a' }}>
                  Seluruh hak cipta, hak guna komersial, dan kepemilikan berkas resolusi tinggi (master file: AI, PSD, PDF Print-Ready) akan diserahkan penuh kepada Pihak Kedua setelah seluruh kewajiban pembayaran telah lunas.
                </p>
              </div>

              {extraClauses && (
                <div>
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: 12.5 }}>PASAL 5 — KETENTUAN TAMBAHAN</strong>
                  <p style={{ margin: '4px 0 0', textAlign: 'justify', color: '#0f172a' }}>
                    {extraClauses}
                  </p>
                </div>
              )}
            </div>

            {/* Tanda Tangan Para Pihak (Signature Section) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, marginTop: 32, pageBreakInside: 'avoid' }}>
              
              {/* Kolom Klien */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#0f172a', fontSize: 12 }}>PIHAK KEDUA (KLIEN)</div>
                <div style={{ 
                  height: 90, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderBottom: '1px dashed #94a3b8',
                  background: '#fafafa'
                }}>
                  <ShieldCheck size={24} color="#10b981" style={{ marginBottom: 4 }} />
                  <span style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>
                    Disetujui Digital via Client Portal / BAST
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', marginTop: 8, color: '#0f172a', fontSize: 13 }}>{clientName}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{clientCompany}</div>
              </div>

              {/* Kolom Studio dengan Pad TTD & Stempel */}
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#0f172a', fontSize: 12 }}>PIHAK PERTAMA (STUDIO)</div>
                
                <div style={{
                  height: 90,
                  border: '1px dashed #0284c7',
                  borderRadius: 8,
                  position: 'relative',
                  background: '#f8fafc',
                  overflow: 'hidden'
                }}>
                  <canvas
                    ref={studioCanvasRef}
                    width={600}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e);
                    }}
                    onTouchEnd={stopDrawing}
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      height: '100%', 
                      cursor: 'crosshair', 
                      position: 'relative', 
                      zIndex: 3,
                      touchAction: 'none'
                    }}
                  />

                  {!hasStudioSig && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)', 
                      fontSize: 11, 
                      color: '#94a3b8', 
                      pointerEvents: 'none',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <PenTool size={12} /> Tanda tangan studio di sini
                    </span>
                  )}

                  {/* Stempel Digital Resmi Studio */}
                  {hasStudioStamp && (
                    <div style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%) rotate(-6deg)',
                      width: 74,
                      height: 74,
                      borderRadius: '50%',
                      border: '2px solid #dc2626',
                      color: '#dc2626',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: 2,
                      background: 'rgba(255, 255, 255, 0.85)',
                      opacity: 0.9,
                      pointerEvents: 'none',
                      zIndex: 2,
                      boxShadow: '0 0 6px rgba(220, 38, 38, 0.2)'
                    }}>
                      <div style={{ fontSize: 5.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        SUMR.DAY STUDIO
                      </div>
                      <div style={{ 
                        fontSize: 8, 
                        fontWeight: 950, 
                        margin: '1px 0', 
                        borderTop: '1px solid #dc2626', 
                        borderBottom: '1px solid #dc2626', 
                        padding: '0 4px',
                        letterSpacing: 1
                      }}>
                        SAH / RESMI
                      </div>
                      <div style={{ fontSize: 5, fontWeight: 800 }}>
                        TERVERIFIKASI
                      </div>
                    </div>
                  )}
                </div>

                <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4 }}>
                  {hasStudioSig && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      title="Ulangi / Hapus Tanda Tangan"
                      aria-label="Ulangi Tanda Tangan"
                      style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: 8, 
                        background: '#f1f5f9', 
                        border: '1px solid #cbd5e1', 
                        color: '#64748b', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                </div>

                <div style={{ fontWeight: 'bold', marginTop: 4, color: '#0f172a', fontSize: 13 }}>Pimpinan sumr.day Studio</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Creative Director & Founder</div>
              </div>
            </div>

            {/* Footer Legal Note */}
            <div style={{ 
              marginTop: 30, 
              paddingTop: 12, 
              borderTop: '1px solid #e2e8f0', 
              fontSize: 10, 
              color: '#64748b', 
              textAlign: 'center',
              fontFamily: "'Inter', sans-serif"
            }}>
              Dokumen ini diterbitkan secara sah oleh sumr.day Creative OS dan diarsipkan ke Media Vault & Google Drive resmi.
            </div>

          </div>
        </div>

        {/* Footer Actions (Non-Printable, Pure Icon-Only for Mobile Resilience) */}
        <div 
          className="no-print" 
          style={{
            padding: '10px 16px',
            background: '#090a10',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ 
              display: 'inline-block', 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#22c55e', 
              boxShadow: '0 0 8px #22c55e',
              flexShrink: 0
            }} />
            <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              SPK Dokumen Sah
            </span>
          </div>

          {/* Icon-Only Buttons without any text labels */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              title="Tutup Dokumen SPK"
              aria-label="Tutup"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={handleSaveSpk}
              title="Simpan & Terbitkan SPK"
              aria-label="Simpan & Terbitkan SPK"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
              }}
            >
              <CheckCircle2 size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContractSpkModal;
