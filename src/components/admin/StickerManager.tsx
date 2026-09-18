import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, Upload, Eye, EyeOff, ImageIcon, X, RotateCcw, Layers, Palette, ChevronUp, ChevronDown, Box, Video, Play, Image, Target } from 'lucide-react';
import GlassSelect from './GlassSelect';
import GlassColorPicker from './GlassColorPicker';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useDialog } from './DialogProvider';
import { getOptimizedUrl, hexToRgba, buildStickerFilter } from '../renderer/utils';
import { safeSvg } from '../../utils/security';
import MediaGalleryModal from './MediaGalleryModal';

const ANIMATIONS = [
  { key: 'none', label: 'Tidak Ada' },
  { key: 'float',  label: 'Mengambang' },
  { key: 'bounce', label: 'Meloncat' },
  { key: 'swing',  label: 'Mengayun' },
  { key: 'pop',    label: 'Pop' },
  { key: 'spin',   label: 'Berputar' },
  { key: 'pulse',  label: 'Denyut' },
  { key: 'shake',  label: 'Goyang' },
  { key: 'wobble', label: 'Wobble' },
];
const ENTER_ANIMS = [
  { key: 'none', label: 'Tidak Ada' },
  { key: 'fadeIn',    label: 'Fade In' },
  { key: 'slideUp',   label: 'Slide Up' },
  { key: 'slideDown', label: 'Slide Down' },
  { key: 'zoomIn',    label: 'Zoom In' },
  { key: 'flipIn',    label: 'Flip In' },
  { key: 'bounceIn',  label: 'Bounce In' },
];
const EXIT_ANIMS = [
  { key: 'none', label: 'Tidak Ada' },
  { key: 'fadeOut',   label: 'Fade Out' },
  { key: 'slideUp',   label: 'Slide Up' },
  { key: 'slideDown', label: 'Slide Down' },
  { key: 'zoomOut',   label: 'Zoom Out' },
  { key: 'flipOut',   label: 'Flip Out' },
];
const SHADOWS = [
  { key: 'none',  label: 'Tidak Ada' },
  { key: 'outer', label: 'Bayangan Luar' },
  { key: 'inner', label: 'Bayangan Dalam' },
  { key: 'glow',  label: 'Glow / Cahaya' },
];
const MASKS = [
  { key:'none',     label:'Bentuk Asli' },
  { key:'circle',   label:'Lingkaran' },
  { key:'squircle', label:'Squircle' },
  { key:'rounded',  label:'Rounded' },
  { key:'heart',    label:'Hati' },
  { key:'star',     label:'Bintang' },
  { key:'badge',    label:'Emblem / Badge' },
  { key:'shield',   label:'Perisai / Shield' },
  { key:'triangle', label:'Segitiga' },
  { key:'hexagon',  label:'Hexagon' },
];
const FRAME_W = 312;
const FRAME_H = 632;
const newId = () => `stk-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;



/* ── Draggable sticker inside the preview frame ── */
const StickerHandle = React.memo(({ sticker, isSelected, onSelect, onUpdate, frameRef, index, total }) => {
  const drag = useRef(null);
  const resize = useRef(null);
  const rotate = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const w   = sticker.width    ?? 80;
  const rot = sticker.rotation ?? 0;
  const px  = ((sticker.x ?? 10) / 100) * FRAME_W;
  const py  = ((sticker.y ?? 10) / 100) * FRAME_H;
  const idleClass = !isSelected && sticker.animation && sticker.animation !== 'none'
    ? `stk-anim-${sticker.animation}` : '';

  useEffect(() => {
    if (!isInteracting) return;

    const move = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      if (drag.current) {
        const r = frameRef.current?.getBoundingClientRect();
        if (!r) return;
        const sx = FRAME_W / r.width; const sy = FRAME_H / r.height;
        const nx = drag.current.ox + ((cx - drag.current.sx) * sx / FRAME_W) * 100;
        const ny = drag.current.oy + ((cy - drag.current.sy) * sy / FRAME_H) * 100;
        onUpdate({ x: Math.max(0,Math.min(95,nx)), y: Math.max(0,Math.min(95,ny)) });
      }
      if (resize.current) {
        const r = frameRef.current?.getBoundingClientRect();
        if (!r) return;
        const sc = FRAME_W / r.width;
        const nw = Math.max(20, Math.min(FRAME_W * 0.9, resize.current.ow + (cx - resize.current.sx) * sc));
        onUpdate({ width: nw });
      }
      if (rotate.current) {
        const r = frameRef.current?.getBoundingClientRect();
        if (!r) return;
        const sc = FRAME_W / r.width;
        const mx = (cx - r.left) * sc;
        const my = (cy - r.top)  * (FRAME_H / r.height);
        const angle = Math.atan2(my - rotate.current.cy, mx - rotate.current.cx) * (180/Math.PI) + 90;
        onUpdate({ rotation: Math.round(angle) });
      }
    };
    const up = () => { 
      drag.current = null; resize.current = null; rotate.current = null; 
      setIsInteracting(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [isInteracting, onUpdate, frameRef]);

  const onBodyDown = (e) => {
    e.stopPropagation();
    if (!isSelected) { onSelect(); return; }
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    drag.current = { sx: cx, sy: cy, ox: sticker.x??10, oy: sticker.y??10 };
    setIsInteracting(true);
  };
  const onResizeDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    resize.current = { sx: cx, ow: w };
    setIsInteracting(true);
  };
  const onRotateDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    rotate.current = { cx: px + w/2, cy: py + w*0.5 };
    setIsInteracting(true);
  };

  const maskRad = sticker.maskRadius ?? 2;
  const dynamicMaskStyle = sticker.mask === 'rounded' 
    ? { clipPath: `inset(0 round ${maskRad}rem)` }
    : sticker.mask === 'squircle'
    ? { clipPath: `inset(0 round ${maskRad * 1.8}rem)`, aspectRatio: '1/1', objectFit: 'cover' }
    : {};

  const innerShadow = sticker.shadow === 'inner' 
    ? `inset ${sticker.shadowX ?? 0}px ${sticker.shadowY ?? 5}px ${sticker.shadowBlur ?? 10}px ${sticker.shadowColor || 'rgba(0,0,0,0.35)'}`
    : undefined;

  const maskClass = sticker.mask && sticker.mask !== 'none' ? `stk-mask-${sticker.mask}` : '';
  const filter = buildStickerFilter(sticker);

  return (
    <div
      className={idleClass}
      style={{
        position:'absolute', left: px, top: py, width: w,
        transform:`rotate(${rot}deg)`, transformOrigin:'center center',
        opacity: sticker.opacity??1, filter,
        cursor: isSelected ? 'move' : 'pointer',
        zIndex: isSelected ? 999 : (total - index) * 10,
        userSelect:'none',
        containerType: 'inline-size'
      }}
      onMouseDown={onBodyDown} onTouchStart={onBodyDown}
    >
      <div style={{ width: '100%', height: 'auto' }}>
        {(sticker.type || 'image') === 'image' ? (
          (sticker.isSvg || (typeof sticker.imageData === 'string' && sticker.imageData.trim().startsWith('<svg')))
            ? <div 
                className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''} 
                style={{ width:'100%', height: '100%', pointerEvents:'none', boxShadow: innerShadow, ...dynamicMaskStyle }} 
                dangerouslySetInnerHTML={{ __html: safeSvg(sticker.imageData) }}
              />
            : <img 
                className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''} 
                src={getOptimizedUrl(sticker.imageData, 400)} 
                alt="" 
                draggable={false} 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (sticker.imageData && e.currentTarget.src !== sticker.imageData) {
                    e.currentTarget.src = sticker.imageData;
                  }
                }}
                style={{ 
                  width:'100%', 
                  height: (sticker.mask && sticker.mask !== 'none' && sticker.mask !== 'rounded') ? '100%' : 'auto', 
                  display: 'block', 
                  pointerEvents: 'none', 
                  boxShadow: innerShadow,
                  objectFit: (sticker.mask && sticker.mask !== 'none' && sticker.mask !== 'rounded') ? 'cover' : 'contain',
                  ...dynamicMaskStyle
                }}
              />
          ) : sticker.type === 'button' ? (
            <div 
              style={{ 
                width:'100%', 
                padding: '0.8em 1.2em',
                background: sticker.btnBgType === 'image' 
                  ? (sticker.imageData ? `url(${getOptimizedUrl(sticker.imageData, 200)}) center/cover` : 'rgba(0,0,0,0.1)')
                  : hexToRgba(sticker.btnColor || 'var(--cms-accent, #7c3aed)', sticker.btnFillOpacity ?? 1),
                aspectRatio: sticker.btnShape === 'circle' ? '1/1' : 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: sticker.textColor || '#fff',
                fontSize: '14cqw',
                fontWeight: 800,
                lineHeight: 1,
                border: `${sticker.btnBorderWidth ?? 1.5}px solid ${sticker.btnBorderColor || 'rgba(255,255,255,0.2)'}`,
                backdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
                WebkitBackdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
                boxShadow: innerShadow || '0 8px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                textAlign: 'center'
              }}
            >
              {sticker.btnText || 'KLIK DISINI'}
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              <div style={{ width: 30, height: 30, background: '#ccc', borderRadius: '50%' }} />
            </div>
          )
        }
      </div>

      {isSelected && (
        <>
          <div className="stk-selection-ring"/>
          <div className="stk-handle-resize" onMouseDown={onResizeDown} onTouchStart={onResizeDown}/>
          <div className="stk-handle-rotate"  onMouseDown={onRotateDown}  onTouchStart={onRotateDown}/>
        </>
      )}
    </div>
  );
});

/* ── Edit panel right ── */
const S = {
  label:{ fontSize:9, fontWeight:800, color:'var(--cms-text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5, display:'block' },
  input:{ width:'100%', padding:'9px 12px', background:'var(--cms-input-bg)', border:'1px solid var(--glass-border)', borderRadius:10, fontSize:12, fontFamily:'inherit', color:'var(--cms-text)', outline:'none', boxSizing:'border-box' },
  sel:{ width:'100%', padding:'8px 10px', background:'var(--cms-card-bg)', border:'1px solid var(--glass-border)', borderRadius:10, fontSize:12, fontFamily:'inherit', color:'var(--cms-text)', outline:'none' },
  field:{ marginBottom:14 },
};

const EditPanel = ({ sticker, onUpdate, onRemove }) => {
  const { showConfirm } = useDialog();
  if (!sticker) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#ccc',fontSize:12,textAlign:'center',padding:20}}>
      Pilih stiker untuk mengedit setelan
    </div>
  );
  const u = (k,v) => onUpdate(sticker.id, { [k]: v });
  return (
    <div style={{flex:1,overflowY:'auto',padding:'8px 20px 24px', animation: 'cmsFadeIn 0.3s ease'}}>
      <div style={S.field}>
        <label className="cms-label">Jenis Stiker</label>
        <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg)', borderRadius: 100, padding: 4, border: '1px solid var(--glass-border)' }}>
          {[
            { key: 'image', icon: <Image size={14} />, label: 'Gambar' },
            { key: 'youtube', icon: <Play size={14} />, label: 'YouTube' },
            { key: 'button', icon: <Box size={14} />, label: 'Tombol' }
          ].map(m => (
            <button key={m.key} 
              onClick={() => u('type', m.key)}
              title={m.label}
              style={{ 
                flex: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', borderRadius: 100, cursor: 'pointer',
                background: (sticker.type || 'image') === m.key ? 'var(--cms-switcher-item-bg)' : 'transparent',
                color: (sticker.type || 'image') === m.key ? (m.key === 'youtube' ? '#ef4444' : 'var(--cms-accent, #7c3aed)') : 'var(--cms-text-muted)',
                boxShadow: (sticker.type || 'image') === m.key ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.3s ease'
              }}>
              {m.icon}
            </button>
          ))}
        </div>
      </div>

      {sticker.type === 'button' && (
        <div className="cms-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(var(--cms-accent-rgb),0.03)', marginBottom: 16, border: '1px solid rgba(var(--cms-accent-rgb),0.1)' }}>
          <div>
            <label className="cms-label">Teks Tombol</label>
            <input className="cms-input" type="text" value={sticker.btnText || ''} onChange={e => u('btnText', e.target.value)} placeholder="Teks..." />
          </div>
          <div>
            <label className="cms-label">Bentuk</label>
            <GlassSelect 
              value={sticker.btnShape || 'rounded'} 
              onChange={e => u('btnShape', e.target.value)}
              options={[
                { key: 'rounded', label: 'Rounded' },
                { key: 'pill', label: 'Pill' },
                { key: 'circle', label: 'Circle' },
                { key: 'rectangle', label: 'Rectangle' }
              ]}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <GlassColorPicker 
              label="Warna Tombol"
              value={sticker.btnColor || 'var(--cms-accent, #7c3aed)'}
              onChange={val => u('btnColor', val)}
            />
            <GlassColorPicker 
              label="Warna Teks"
              value={sticker.textColor || '#ffffff'}
              onChange={val => u('textColor', val)}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0' }}>
            <span style={{ fontSize:10, fontWeight:800 }}>Glass Effect</span>
            <button onClick={()=>u('useGlass', !(sticker.useGlass !== false))}
              style={{ padding:'4px 12px', borderRadius:100, border:'none', background: sticker.useGlass !== false ? 'var(--cms-accent, #7c3aed)' : '#ccc', color:'#fff', fontSize:9, fontWeight:800 }}>
              {sticker.useGlass !== false ? 'AKTIF' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {sticker.type === 'youtube' && (
        <div style={S.field}>
          <label className="cms-label">YouTube ID</label>
          <input className="cms-input" type="text" value={sticker.youtubeId || ''} onChange={e => u('youtubeId', e.target.value)} placeholder="ID Video (e.g. dQw4w9WgXcQ)" />
        </div>
      )}

      <div style={S.field}>
        <label className="cms-label">Link URL</label>
        <input className="cms-input" type="url" placeholder="https://..." value={sticker.linkUrl||''} onChange={e=>u('linkUrl',e.target.value)}/>
      </div>
      <div style={S.field}>
        <label className="cms-label">Animasi Idle</label>
        <GlassSelect 
          value={sticker.animation||'none'} 
          onChange={e=>u('animation',e.target.value)}
          options={ANIMATIONS}
        />
      </div>
      <div style={S.field}>
        <label className="cms-label">Animasi Masuk</label>
        <GlassSelect 
          value={sticker.enterAnim||'none'} 
          onChange={e=>u('enterAnim',e.target.value)}
          options={ENTER_ANIMS}
        />
      </div>
      <div style={S.field}>
        <label className="cms-label">Animasi Keluar</label>
        <GlassSelect 
          value={sticker.exitAnim||'none'} 
          onChange={e=>u('exitAnim',e.target.value)}
          options={EXIT_ANIMS}
        />
      </div>
      <div style={S.field}>
        <label className="cms-label">Bayangan</label>
        <GlassSelect 
          value={sticker.shadow||'none'} 
          onChange={e=>u('shadow',e.target.value)}
          options={SHADOWS}
        />
      </div>
      {sticker.shadow && sticker.shadow !== 'none' && (
        <div 
          className="cms-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'rgba(0,0,0,0.02)', marginBottom: 16, borderRadius: 24 }}
        >
          <div style={{ display:'flex', gap:8 }}>
            <div style={{flex:1}}>
              <label className="cms-label">Warna</label>
              <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg)', padding: '4px 10px', borderRadius: 100, border: '1px solid var(--glass-border)' }}>
                <input type="color" value={sticker.shadowColor||'#000000'} onChange={e=>u('shadowColor',e.target.value)}
                  style={{ width: 24, height: 24, border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'transparent' }}/>
                <input type="text" className="cms-input" value={sticker.shadowColor||'#000000'} onChange={e=>u('shadowColor',e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', height: 24, padding: 0, fontSize: 10, fontWeight: 700 }} />
              </div>
            </div>
            <div style={{flex:1}}>
              <label className="cms-label">Blur: {sticker.shadowBlur??10}px</label>
              <input type="range" min={2} max={40} value={sticker.shadowBlur??10} onChange={e=>u('shadowBlur',+e.target.value)}
                style={{width:'100%',marginTop:8}}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{flex:1}}>
              <label className="cms-label">X: {sticker.shadowX ?? 0}px</label>
              <input type="range" min={-20} max={20} value={sticker.shadowX ?? 0} onChange={e=>u('shadowX',+e.target.value)} style={{ width:'100%' }}/>
            </div>
            <div style={{flex:1}}>
              <label className="cms-label">Y: {sticker.shadowY ?? 5}px</label>
              <input type="range" min={-20} max={20} value={sticker.shadowY ?? 5} onChange={e=>u('shadowY',+e.target.value)} style={{ width:'100%' }}/>
            </div>
          </div>
        </div>
      )}

      {sticker.type !== 'button' && (
        <div style={S.field}>
          <label className="cms-label">Masking Bentuk</label>
          <GlassSelect 
            value={sticker.mask||'none'} 
            onChange={e=>u('mask',e.target.value)}
            options={MASKS}
          />
        </div>
      )}

      {sticker.type !== 'button' && sticker.mask && sticker.mask !== 'none' && (
        <div style={S.field}>
          <label className="cms-label">Rounded Radius: {sticker.maskRadius ?? 2}rem</label>
          <input type="range" min={0} max={8} step={0.1} value={sticker.maskRadius ?? 2} onChange={e=>u('maskRadius',+e.target.value)} style={{ width:'100%' }}/>
        </div>
      )}
      <div style={S.field}>
        <label className="cms-label">Opacity ({Math.round((sticker.opacity??1)*100)}%)</label>
        <input type="range" min={0} max={1} step={0.05} value={sticker.opacity??1} onChange={e=>u('opacity',+e.target.value)}
          style={{width:'100%'}}/>
      </div>
      
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--cms-switcher-bg)',borderRadius:100, marginBottom: 16}}>
        <span style={{fontSize:11,fontWeight:800, color: 'var(--cms-text)'}}>Tampilkan Stiker</span>
        <button 
          type="button"
          role="switch"
          aria-checked={sticker.visible ?? true}
          className="cms-switch"
          onClick={()=>u('visible',!(sticker.visible??true))}
        >
          <div className="cms-switch-knob" />
        </button>
      </div>

      <div style={{display:'flex', gap:8}}>
        <button className="cms-btn cms-btn-ghost" style={{ flex: 1, height: 44 }} onClick={()=>u('rotation',0)}>
          <RotateCcw size={14}/> Reset
        </button>
        <button className="cms-btn cms-btn-ghost" style={{ flex: 1, height: 44, color: '#ef4444' }} onClick={async ()=>{
          const confirmed = await showConfirm('Hapus stiker ini?');
          if(confirmed) onRemove(sticker.id);
        }}>
          <Trash2 size={14}/> Hapus
        </button>
      </div>
    </div>
  );
};

/* ── Main StickerManager ── */
const StickerManager = ({ allPagesData }) => {
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  // Build page list dynamically from allPagesData keys
  const availablePages = Object.keys(allPagesData || {}).filter(k => k !== 'settings') || ['home','portofolio','biodata'];
  const PAGE_LABELS = { home:'Home', portofolio:'Portofolio', biodata:'Biodata' };

  const [activePage, setActivePage] = useState(availablePages[0] || 'home');
  const [stickersDB, setStickersDB] = useState({});
  const [selectedId, setSelectedId]= useState(null);
  const fileRef   = useRef(null);
  const frameRef  = useRef(null);

  const stickers = stickersDB[activePage] || [];
  const selected = stickers.find(s => s.id === selectedId) || null;

  const load = useCallback(async () => {
    const data = await storage.getItem('porto_stickers', {});
    setStickersDB(data || {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (updated) => {
    setStickersDB(updated);
    await storage.setItem('porto_stickers', updated);
    window.dispatchEvent(new Event('porto_stickers_updated'));
  };

  const addSticker = async () => {
    const ns = {
      id: newId(), 
      type: 'image',
      imageData: null, 
      isSvg: false,
      x: 10, y: 10, width: 80, rotation: 0,
      animation: 'float', enterAnim: 'fadeIn', exitAnim: 'fadeOut',
      shadow: 'none', shadowColor: '#000000', shadowBlur: 10,
      opacity: 1, visible: true, linkUrl: '',
    };
    const updated = { ...stickersDB, [activePage]: [...stickers, ns] };
    await save(updated);
    setSelectedId(ns.id);
  };

  const updateSticker = useCallback((id, props) => {
    setStickersDB(prev => {
      const list = (prev[activePage]||[]).map(s => s.id===id ? {...s,...props} : s);
      const updated = {...prev, [activePage]: list};
      storage.setItem('porto_stickers', updated);
      window.dispatchEvent(new Event('porto_stickers_updated'));
      return updated;
    });
  }, [activePage]);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format tidak didukung. Gunakan PNG, JPG, GIF, WEBP, atau SVG.');
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const isSvg = file.type === 'image/svg+xml';

      if (isSvg) {
        // SVG: baca sebagai teks untuk dirender sebagai inline HTML
        const reader = new FileReader();
        reader.onload = (evt) => {
          updateSticker(selectedId, { imageData: evt.target.result, isSvg: true, type: 'image' });
          setIsUploading(false);
        };
        reader.onerror = () => {
          setUploadError('Gagal membaca file SVG.');
          setIsUploading(false);
        };
        reader.readAsText(file);
      } else {
        // Gambar biasa: upload ke Cloudinary, simpan URL-nya
        const result = await uploadToCloudinary(file, 'image');
        updateSticker(selectedId, { imageData: result.url, isSvg: false, type: 'image' });
        setIsUploading(false);
      }
    } catch (err) {
      setUploadError('Upload gagal: ' + (err.message || 'Coba lagi'));
      setIsUploading(false);
    }

    e.target.value = '';
  }, [selectedId, updateSticker]);

  const removeSticker = async (id) => {
    const list = stickers.filter(s => s.id !== id);
    const updated = { ...stickersDB, [activePage]: list };
    await save(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const moveSticker = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= stickers.length) return;
    const list = [...stickers];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    const updated = { ...stickersDB, [activePage]: list };
    await save(updated);
  };

  // Blocks for the selected page (for background preview)
  const pageBlocks = allPagesData?.[activePage] || [];

  return (
    <div style={{display:'flex',width:'100%',height:'100%',gap:10}}>
      {/* ── LEFT: Sticker list ── */}
      <div className="cms-floating-sidebar" style={{width:240}}>
        <div className="sidebar-pill-header">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,var(--cms-accent, #7c3aed),#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(var(--cms-accent-rgb),0.25)'}}>
              <Layers size={14} color="#fff"/>
            </div>
            <span className="sidebar-title">Stiker</span>
          </div>
          <span className="sidebar-count">{stickers.length}</span>
        </div>

        {/* Page selector */}
        <div style={{padding:'0 16px 12px'}}>
          <div style={{display:'flex',gap:3,background:'rgba(0,0,0,0.04)',borderRadius:100,padding:3,overflowX:'auto',scrollbarWidth:'none'}}>
            {availablePages.map(p=>(
              <button key={p} className={`stk-page-tab${activePage===p?' active':''}`}
                onClick={()=>{setActivePage(p);setSelectedId(null);}}
                style={{whiteSpace:'nowrap',flexShrink:0}}>
                {PAGE_LABELS[p] || p}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-pill-scroll">
          {stickers.map((s,i) => (
            <div key={s.id} className={`stk-list-item${selectedId===s.id?' active':''}`}
              onClick={()=>setSelectedId(selectedId===s.id?null:s.id)}
              style={{ paddingRight: 8 }}
            >
              <div className="stk-thumb">
                {(s.type || 'image') === 'image' ? (
                  s.imageData ? (
                    (s.isSvg || (typeof s.imageData === 'string' && s.imageData.trim().startsWith('<svg')))
                      ? <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}} dangerouslySetInnerHTML={{__html: safeSvg(s.imageData) }}/>
                      : <img src={getOptimizedUrl(s.imageData, 100)} alt="" referrerPolicy="no-referrer" onError={(e) => { if (s.imageData && e.currentTarget.src !== s.imageData) e.currentTarget.src = s.imageData; }} />
                  ) : <ImageIcon size={14} color="#ccc" />
                ) : (
                  s.youtubeId 
                    ? <img src={`https://img.youtube.com/vi/${s.youtubeId}/mqdefault.jpg`} alt="" onError={(e) => { if (!e.currentTarget.src.includes('hqdefault')) e.currentTarget.src = `https://img.youtube.com/vi/${s.youtubeId}/hqdefault.jpg`; }}/>
                    : <div style={{ color:'#ff4d4d' }}><Plus size={14}/></div>
                )}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--cms-text)'}}>Stiker {i+1}</div>
                <div style={{fontSize:9,color:'var(--cms-text-muted)'}}>Layer {stickers.length - i}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <button onClick={(e)=>{e.stopPropagation(); moveSticker(i, i-1);}}
                  disabled={i===0}
                  style={{width:20,height:20,border:'none',background:'transparent',cursor:i===0?'default':'pointer',opacity:i===0?0.2:1,color:'#666'}}
                  title="Pindah ke Atas (Layer Depan)">
                  <ChevronUp size={14}/>
                </button>
                <button onClick={(e)=>{e.stopPropagation(); moveSticker(i, i+1);}}
                  disabled={i===stickers.length-1}
                  style={{width:20,height:20,border:'none',background:'transparent',cursor:i===stickers.length-1?'default':'pointer',opacity:i===stickers.length-1?0.2:1,color:'#666'}}
                  title="Pindah ke Bawah (Layer Belakang)">
                  <ChevronDown size={14}/>
                </button>
              </div>
              <button onClick={(e)=>{e.stopPropagation(); updateSticker(s.id,{visible:!(s.visible??true)});}}
                style={{width:24,height:24,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:s.visible===false?'#ccc':'var(--cms-accent, #7c3aed)'}}>
                {s.visible===false ? <EyeOff size={13}/> : <Eye size={13}/>}
              </button>
            </div>
          ))}
          <button onClick={addSticker}
            style={{width:'100%',padding:'10px',borderRadius:100,border:'2px dashed #eee',background:'transparent',color:'#bbb',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'inherit',marginTop:4}}>
            <Plus size={14}/> Tambah Stiker
          </button>
        </div>
      </div>

      {/* ── CENTER: Preview frame ── */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="stk-manager-frame">
          <div ref={frameRef} className="stk-manager-scroll"
            style={{position:'relative'}}
            onClick={()=>setSelectedId(null)}>
            {/* Page content preview */}
            {pageBlocks.length === 0
              ? <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#ddd',gap:8}}>
                  <ImageIcon size={28}/><div style={{fontSize:11}}>Belum ada konten</div>
                </div>
              : pageBlocks.map(b => b.url ? (
                  <img key={b.id} src={getOptimizedUrl(b.url, 800)} alt="" style={{display:'block',width:'100%',height:'auto',pointerEvents:'none'}} referrerPolicy="no-referrer" />
                ) : null)
            }
            {/* Sticker overlay with handles */}
            <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
              {stickers.filter(s=>s.visible!==false).map((s, i)=>(
                <StickerHandle
                  key={s.id}
                  sticker={s}
                  isSelected={selectedId===s.id}
                  onSelect={()=>setSelectedId(s.id)}
                  onUpdate={(props)=>updateSticker(s.id,props)}
                  frameRef={frameRef}
                  index={i}
                  total={stickers.length}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Edit panel ── */}
      <div className="cms-floating-sidebar" style={{width:280}}>
        <div className="sidebar-pill-header">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:'rgba(0,0,0,0.06)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Palette size={14} color="rgba(0,0,0,0.4)"/>
            </div>
            <span className="sidebar-title">Edit Stiker</span>
          </div>
        </div>

        {/* Upload area — hanya tampil jika stiker dipilih dan tipe image */}
        {selected && (selected.type === 'image' || !selected.type) && (
          <div style={{ padding: '0 16px 12px' }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {/* Preview gambar yang sudah diupload */}
            {selected.imageData && (
              <div style={{
                position: 'relative', marginBottom: 10,
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 80
              }}>
                {(selected.isSvg || (typeof selected.imageData === 'string' && selected.imageData.trim().startsWith('<svg')))
                  ? <div
                      style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      dangerouslySetInnerHTML={{ __html: safeSvg(selected.imageData) }}
                    />
                  : <img
                      src={selected.imageData}
                      alt="preview"
                      style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain', display: 'block' }}
                    />
                }
                <button
                  onClick={() => updateSticker(selected.id, { imageData: null, isSvg: false })}
                  title="Hapus gambar"
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 22, height: 22, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.5)',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={12}/>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="cms-btn cms-btn-primary"
                style={{ flex: 1, height: 40, gap: 6, fontSize: 12 }}
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading
                  ? <><div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> Mengupload...</>
                  : <><Upload size={14}/> {selected.imageData ? 'Ganti File' : 'Upload File'}</>
                }
              </button>
              <button
                type="button"
                className="cms-btn"
                style={{ flex: 1, height: 40, gap: 6, fontSize: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)', fontWeight: 750 }}
                onClick={() => setIsGalleryOpen(true)}
              >
                <ImageIcon size={14}/> Dari Galeri
              </button>
            </div>

            {uploadError && (
              <div style={{
                marginTop: 8, padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, color: '#ef4444',
                fontSize: 10, fontWeight: 700
              }}>
                {uploadError}
              </div>
            )}
          </div>
        )}

        <EditPanel sticker={selected} onUpdate={updateSticker} onRemove={removeSticker}/>
      </div>

      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          if (selected) {
            updateSticker(selected.id, { imageData: url, isSvg: false });
          }
          setIsGalleryOpen(false);
        }}
      />
    </div>
  );
};

export default StickerManager;
