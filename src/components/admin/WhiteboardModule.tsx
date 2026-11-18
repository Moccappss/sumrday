import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  StickyNote, Plus, Trash2, RotateCw, Image as ImageIcon, 
  Download, Maximize2, Minimize2, Move, Type, 
  Palette, Grid3X3, Circle, Square, MousePointer2,
  Save, RotateCcw, X, Loader2, Upload, GripHorizontal, Layout,
  Layers, ChevronRight, ChevronLeft, MoreVertical, Edit3, Check,
  ZoomIn, ZoomOut, Target, Hand, AlertCircle, CheckCircle2, ListTodo, Copy, Minus, FileText,
  Lock, Unlock, ArrowUpToLine, ArrowDownToLine, Link as LinkIcon, ExternalLink, ArrowRight
} from 'lucide-react';
// html-to-image and jspdf are dynamically imported to reduce initial bundle size
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import PremiumPreloader from './PremiumPreloader';
import { googleSync } from '../../utils/googleSync';
import { useDialog } from './DialogProvider';
import { useContextMenu } from './ContextMenuProvider';
import MediaGalleryModal from './MediaGalleryModal';

interface WhiteboardProps {
  notify?: (msg: string, type?: string) => void;
  embedded?: boolean;
  readOnly?: boolean;
  canvasNotes?: any[];
  canvasLines?: any[];
  canvasBg?: string;
  onUpdateNotes?: (notes: any[]) => void;
  onUpdateLines?: (lines: any[]) => void;
  onUpdateBg?: (bg: string) => void;
  onUpdateCanvas?: (updates: any) => void;
}

const WhiteboardModule: React.FC<WhiteboardProps> = ({ 
  notify = (msg) => console.log(msg),
  embedded = false,
  readOnly = false,
  canvasNotes = [],
  canvasLines = [],
  canvasBg = 'grid',
  onUpdateNotes,
  onUpdateLines,
  onUpdateBg,
  onUpdateCanvas
}) => {
  const { showPrompt, showConfirm } = useDialog();
  const { bindContextMenu } = useContextMenu();
  const [canvases, setCanvases] = useState<any[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!embedded);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [activeTool, setActiveTool] = useState(readOnly ? 'pan' : 'select');
  const [dragMode, setDragMode] = useState<string | null>(null); 
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, width: 0, rotation: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | false>(false);
  const [showLineColors, setShowLineColors] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState<string | null>(null);

  // Line features
  const [activeLine, setActiveLine] = useState<any>(null);
  const [drawingLine, setDrawingLine] = useState<any>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  
  // Transformation State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasesRef = useRef<any[]>([]);

  // Sync ref with state
  useEffect(() => {
    canvasesRef.current = canvases;
  }, [canvases]);

  const colors = [
    { name: 'Yellow', bg: '#fef08a', text: '#713f12', border: '#fde047' },
    { name: 'Pink', bg: '#fbcfe8', text: '#9d174d', border: '#f9a8d4' },
    { name: 'Blue', bg: '#bfdbfe', text: '#1e40af', border: '#93c5fd' },
    { name: 'Green', bg: '#bbf7d0', text: '#166534', border: '#86efac' },
    { name: 'Purple', bg: '#ddd6fe', text: '#5b21b6', border: '#c4b5fd' },
    { name: 'White', bg: '#ffffff', text: '#1f2937', border: '#e5e7eb' },
    
    { name: 'Orange', bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
    { name: 'Red', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    { name: 'Teal', bg: '#ccfbf1', text: '#065f5a', border: '#5eead4' },
    { name: 'Mint', bg: '#d1fae5', text: '#035a41', border: '#6ee7b7' },
    { name: 'Lavender', bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
    
    { name: 'Slate', bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
    { name: 'Dark Gray', bg: '#334155', text: '#f8fafc', border: '#475569' },
    { name: 'Midnight', bg: '#1e3a8a', text: '#eff6ff', border: '#1e40af' },
    { name: 'Forest', bg: '#14532d', text: '#f0fdf4', border: '#166534' }
  ];

  // Load Canvases (only if standalone)
  useEffect(() => {
    if (embedded) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        const saved = await storage.getItem('porto_whiteboard_canvases', []);
        if (saved && saved.length > 0) {
          setCanvases(saved);
          setActiveCanvasId(saved[0].id);
        } else {
          const defaultCanvas = { id: `canvas_${Date.now()}`, title: 'Strategic Roadmap', notes: [], bg: 'grid' };
          setCanvases([defaultCanvas]);
          setActiveCanvasId(defaultCanvas.id);
        }
      } catch (err) {
        console.error("Whiteboard load failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [embedded]);

  const activeCanvas = useMemo(() => {
    if (embedded) {
      return {
        id: 'embedded',
        title: 'Kanvas Catatan',
        notes: canvasNotes || [],
        lines: canvasLines || [],
        bg: canvasBg || 'grid'
      };
    }
    return canvases.find(c => c.id === activeCanvasId) || null;
  }, [embedded, canvasNotes, canvasLines, canvasBg, canvases, activeCanvasId]);

  // CRITICAL: Data Robustness & Migration Layer
  useEffect(() => {
    if (activeCanvas && activeCanvas.notes) {
      const needsFix = activeCanvas.notes.some(n => 
        (n.type === 'todo' && !n.tasks) || 
        (n.type === 'image' && typeof n.content === 'object') ||
        (!n.zIndex)
      );

      if (needsFix) {
        const fixedNotes = activeCanvas.notes.map(n => {
          let fixed = { ...n };
          if (n.type === 'todo' && !n.tasks) fixed.tasks = [{ text: 'New Task', completed: false }];
          if (n.type === 'image' && typeof n.content === 'object' && n.content.url) fixed.content = n.content.url;
          if (!n.zIndex) fixed.zIndex = 10;
          return fixed;
        });

        updateActiveCanvas({ notes: fixedNotes });
      }
    }
  }, [activeCanvasId, embedded]);

  const saveCanvases = async (updated: any[]) => {
    setCanvases(updated);
  };

  const updateActiveCanvas = (props: any) => {
    if (readOnly) return;
    if (embedded) {
      if (onUpdateCanvas) {
         const updates: any = {};
         if (props.notes !== undefined) updates.canvasNotes = props.notes;
         if (props.lines !== undefined) updates.canvasLines = props.lines;
         if (props.bg !== undefined) updates.canvasBg = props.bg;
         if (Object.keys(updates).length > 0) onUpdateCanvas(updates);
      } else {
        if (props.notes !== undefined && onUpdateNotes) onUpdateNotes(props.notes);
        if (props.lines !== undefined && onUpdateLines) onUpdateLines(props.lines);
        if (props.bg !== undefined && onUpdateBg) onUpdateBg(props.bg);
      }
      return;
    }
    setCanvases(prev => prev.map(c => c.id === activeCanvasId ? { ...c, ...props } : c));
  };

  // ROBUST PERSISTENCE EFFECT (only if not embedded)
  useEffect(() => {
    if (embedded || isLoading || canvases.length === 0) return;
    storage.debouncedSetItem('porto_whiteboard_canvases', canvases, 1500);
  }, [canvases, isLoading, embedded]);

  const addCanvas = () => {
    const newCanvas = { id: `canvas_${Date.now()}`, title: `Strategy ${canvases.length + 1}`, notes: [], bg: 'grid' };
    const updated = [...canvases, newCanvas];
    saveCanvases(updated);
    setActiveCanvasId(newCanvas.id);
    setIsSidebarOpen(false);
    notify('✨ New Strategy Board Ready');
  };

  const handleDeleteCanvas = async (e, id) => {
    e.stopPropagation();
    const confirmed = await showConfirm("Hapus papan Whiteboard ini beserta seluruh isinya?");
    if (!confirmed) return;
    
    setCanvases(prev => prev.filter(c => c.id !== id));
    if (activeCanvasId === id) {
      const remaining = canvases.filter(c => c.id !== id);
      setActiveCanvasId(remaining[0].id);
    }
    notify('🗑️ Board Archived');
  };

  const startEditing = (canvas) => {
    setEditingCanvasId(canvas.id);
    setEditingTitle(canvas.title);
  };

  const finishEditing = () => {
    const updated = canvases.map(c => c.id === editingCanvasId ? { ...c, title: editingTitle } : c);
    saveCanvases(updated);
    setEditingCanvasId(null);
  };

  const addNote = (type = 'text', content = '') => {
    if (!activeCanvas) return;
    
    // Spawn at center of current view
    const spawnX = (window.innerWidth / 2 - pan.x) / zoom - 100;
    const spawnY = (window.innerHeight / 2 - pan.y) / zoom - 100;

    const newNote = {
      id: `note_${Date.now()}`,
      type,
      content: content || (type === 'text' ? '' : ''),
      tasks: type === 'todo' ? [{ id: Date.now(), text: '', completed: false }] : [],
      x: spawnX,
      y: spawnY,
      rotation: (Math.random() - 0.5) * 4,
      width: type === 'image' ? 260 : (type === 'todo' ? 260 : 190),
      zIndex: (activeCanvas.notes || []).length + 1,
      color: colors[Math.floor(Math.random() * 11)] // Only pick from first 11 pastel colors
    };
    updateActiveCanvas({ notes: [...(activeCanvas.notes || []), newNote] });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      if (result && result.url) {
        addNote('image', result.url);
        notify('🖼️ Asset Integrated');
      }

    } catch (err) {
      notify('Integration failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const getExportOptions = () => {
    if (!activeCanvas?.notes || activeCanvas.notes.length === 0) {
      return { x: 0, y: 0, width: 1920, height: 1080 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    activeCanvas.notes.forEach(note => {
      let w = note.width;
      let h = note.type === 'image' ? 300 : (note.type === 'todo' ? 300 : 250); 
      
      if (canvasRef.current) {
        const el = canvasRef.current.querySelector(`[data-note-id="${note.id}"]`);
        if (el) {
          h = el.offsetHeight || h;
          w = el.offsetWidth || w;
        }
      }
      
      if (note.x < minX) minX = note.x;
      if (note.y < minY) minY = note.y;
      if (note.x + w > maxX) maxX = note.x + w;
      if (note.y + h > maxY) maxY = note.y + h;
    });
    
    // Add margin and space for title
    const margin = 100;
    const titleSpace = 120;
    const x = minX - margin;
    const y = minY - margin - titleSpace;
    const width = (maxX - minX) + margin * 2;
    const height = (maxY - minY) + margin * 2 + titleSpace;
    
    return { x, y, width, height };
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    notify('🔄 Menyimpan PNG (HD)...');
    try {
      const { toPng } = await import('html-to-image');
      const box = getExportOptions();
      canvasRef.current.classList.add('export-mode');
      
      const titleEl = canvasRef.current.querySelector('.export-only-title');
      if (titleEl) {
        titleEl.style.transform = `translate(${box.x + box.width / 2}px, ${box.y + 40}px) translateX(-50%)`;
        titleEl.style.textAlign = 'center';
      }

      const bgColor = getComputedStyle(document.body).getPropertyValue('--cms-bg').trim() || '#ffffff';

      const dataUrl = await toPng(canvasRef.current, { 
        cacheBust: true, 
        backgroundColor: bgColor,
        width: box.width,
        height: box.height,
        pixelRatio: 2, // 2x resolution for HD
        style: {
          transform: `translate(${-box.x}px, ${-box.y}px) scale(1)`,
        },
        filter: (node) => !node.classList?.contains('wb-note-toolbar')
      });
      canvasRef.current.classList.remove('export-mode');
      
      const link = document.createElement('a');
      link.download = `${activeCanvas?.title || 'whiteboard'}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      notify('✅ Berhasil download PNG');
    } catch (err) {
      console.error(err);
      canvasRef.current?.classList.remove('export-mode');
      notify('❌ Gagal export PNG', 'error');
    }
  };

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    notify('🔄 Menyiapkan Print Preview...');
    try {
      const { toPng } = await import('html-to-image');
      const box = getExportOptions();
      canvasRef.current.classList.add('export-mode');

      const titleEl = canvasRef.current.querySelector('.export-only-title') as HTMLElement;
      if (titleEl) {
        titleEl.style.transform = `translate(${box.x + box.width / 2}px, ${box.y + 40}px) translateX(-50%)`;
        titleEl.style.textAlign = 'center';
      }

      const bgColor = getComputedStyle(document.body).getPropertyValue('--cms-bg').trim() || '#ffffff';

      const dataUrl = await toPng(canvasRef.current, { 
        cacheBust: true, 
        backgroundColor: bgColor,
        width: box.width,
        height: box.height,
        pixelRatio: 2,
        style: {
          transform: `translate(${-box.x}px, ${-box.y}px) scale(1)`,
        },
        filter: (node) => !node.classList?.contains('wb-note-toolbar')
      });
      canvasRef.current.classList.remove('export-mode');
      
      const printRoot = document.getElementById('memo-print-root');
      if (printRoot) {
        printRoot.innerHTML = '';
        
        // Inject dynamic page size to match canvas exact bounds
        const style = document.createElement('style');
        style.innerHTML = `@media print { @page { size: ${box.width}px ${box.height}px; margin: 0; } }`;
        printRoot.appendChild(style);

        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        printRoot.appendChild(img);

        setTimeout(() => {
          window.print();
          // cleanup
          setTimeout(() => { printRoot.innerHTML = ''; }, 1000);
        }, 150);
      } else {
        // Fallback to jsPDF download if print root missing
        const { jsPDF } = await import('jspdf');
        const orientation = box.width > box.height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({ orientation, unit: 'px', format: [box.width, box.height] });
        pdf.addImage(dataUrl, 'PNG', 0, 0, box.width, box.height);
        pdf.save(`${activeCanvas?.title || 'whiteboard'}-${Date.now()}.pdf`);
      }
    } catch (err) {
      console.error(err);
      canvasRef.current?.classList.remove('export-mode');
      notify('🚨 Gagal menyiapkan print', 'error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleExportPdf();
      }
    };
    const handleCustomPrint = () => {
      handleExportPdf();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('print-whiteboard', handleCustomPrint);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('print-whiteboard', handleCustomPrint);
    };
  }, [activeCanvas]);

  const handleMouseDown = (e, note, mode = 'translate') => {
    if (readOnly || activeTool === 'pan' || note.locked) return;
    e.stopPropagation();
    setActiveNote(note);
    setDragMode(mode);
    
    // Bring to front
    const maxZ = Math.max(0, ...(activeCanvas.notes || []).map(n => n.zIndex || 0));
    const updatedNotes = (activeCanvas.notes || []).map(n => n.id === note.id ? { ...n, zIndex: maxZ + 1 } : n);
    updateActiveCanvas({ notes: updatedNotes });

    if (mode === 'translate') {
      setDragOffset({ x: e.clientX / zoom - note.x, y: e.clientY / zoom - note.y });
    } else if (mode === 'resize') {
      setDragOffset({ x: e.clientX / zoom, width: note.width });
    } else if (mode === 'rotate') {
      const centerX = note.x + note.width / 2;
      const centerY = note.y + 80;
      const angle = Math.atan2(e.clientY / zoom - centerY, e.clientX / zoom - centerX) * (180 / Math.PI);
      setDragOffset({ rotation: angle - note.rotation });
    }
  };

  const startDrawingLine = (e, note, side) => {
    if (readOnly) return;
    e.stopPropagation();
    const rect = boardRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const x = (rawX - pan.x) / zoom;
    const y = (rawY - pan.y) / zoom;
    setDrawingLine({ fromId: note.id, side, startX: x, startY: y, endX: x, endY: y });
  };

  const handleBoardMouseDown = (e) => {
    if (readOnly || activeTool === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      setActiveNote(null);
    }
  };

  const activeNotePosRef = useRef(null);

  const handleGlobalMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (drawingLine) {
      const rect = boardRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      const x = (rawX - pan.x) / zoom;
      const y = (rawY - pan.y) / zoom;
      
      setDrawingLine(prev => ({ ...prev, endX: x, endY: y }));
      return;
    }

    if (!activeNote || !activeCanvas) return;

    // [PHASE 5] PERFORMANCE FIX: Direct DOM manipulation during drag instead of React state thrashing
    const noteEl = document.querySelector(`[data-note-id="${activeNote.id}"]`);
    if (!noteEl) return;

    if (dragMode === 'translate') {
      const newX = e.clientX / zoom - dragOffset.x;
      const newY = e.clientY / zoom - dragOffset.y;
      noteEl.style.left = `${newX}px`;
      noteEl.style.top = `${newY}px`;
      activeNotePosRef.current = { x: newX, y: newY };
    } else if (dragMode === 'resize') {
      const newWidth = Math.max(120, dragOffset.width + (e.clientX / zoom - dragOffset.x));
      noteEl.style.width = `${newWidth}px`;
      activeNotePosRef.current = { width: newWidth };
    } else if (dragMode === 'rotate') {
      const centerX = activeNote.x + activeNote.width / 2;
      const centerY = activeNote.y + 80;
      const angle = Math.atan2(e.clientY / zoom - centerY, e.clientX / zoom - centerX) * (180 / Math.PI);
      const newRot = angle - dragOffset.rotation;
      noteEl.style.transform = `rotate(${newRot}deg)`;
      activeNotePosRef.current = { rotation: newRot };
    }
  };

  const handleGlobalMouseUp = () => {
    if (drawingLine) {
      if (hoveredNoteId && hoveredNoteId !== drawingLine.fromId) {
        // connect to existing note
        const newLine = {
          id: `line_${Date.now()}`,
          fromId: drawingLine.fromId,
          toId: hoveredNoteId,
          text: '',
          color: '#cbd5e1',
          thickness: 2,
          dashed: false,
          arrow: true
        };
        updateActiveCanvas({ lines: [...(activeCanvas.lines || []), newLine] });
      } else if (!hoveredNoteId || hoveredNoteId === drawingLine.fromId) {
        // Create new note at drop position and connect
        const newNoteId = `note_${Date.now()}`;
        const newNote = {
          id: newNoteId,
          type: 'text',
          content: '',
          x: drawingLine.endX - 95,
          y: drawingLine.endY - 50,
          rotation: 0,
          width: 190,
          zIndex: (activeCanvas.notes || []).length + 1,
          color: colors[Math.floor(Math.random() * 11)]
        };
        const newLine = {
          id: `line_${Date.now()}`,
          fromId: drawingLine.fromId,
          toId: newNoteId,
          text: '',
          color: '#cbd5e1',
          thickness: 2,
          dashed: false,
          arrow: true
        };
        updateActiveCanvas({ 
          notes: [...(activeCanvas.notes || []), newNote],
          lines: [...(activeCanvas.lines || []), newLine]
        });
      }
      setDrawingLine(null);
    }

    if (activeNote && activeNotePosRef.current) {
       // [PHASE 5] Persist state ONCE when dragging finishes to trigger Auto-Save safely
       const updatedNotes = (activeCanvas.notes || []).map(n => 
         n.id === activeNote.id ? { ...n, ...activeNotePosRef.current } : n
       );
       updateActiveCanvas({ notes: updatedNotes });
       activeNotePosRef.current = null;
    }
    setDragMode(null);
    setIsPanning(false);
  };

  // TOUCH SUPPORT
  const handleTouchStart = (e, note, mode = 'translate') => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, stopPropagation: () => {} }, note, mode);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      if (dragOffset?.dist) {
        const delta = currentDist / dragOffset.dist;
        const newZoom = Math.min(3, Math.max(0.15, zoom * delta));
        
        // Adjust pan to zoom into the pinch center
        const rect = boardRef.current.getBoundingClientRect();
        const focalX = centerX - rect.left;
        const focalY = centerY - rect.top;

        const newPanX = focalX - (focalX - pan.x) * (newZoom / zoom);
        const newPanY = focalY - (focalY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
      setDragOffset({ dist: currentDist });
      return;
    }
    
    const touch = e.touches[0];
    handleGlobalMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleBoardTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      setDragOffset({ dist });
    } else {
      setActiveLine(null);
      const touch = e.touches[0];
      handleBoardMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 1 });
    }
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleZoom = (factor) => {
    const newZoom = Math.min(3, Math.max(0.15, zoom * factor));
    const rect = boardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newPanX = centerX - (centerX - pan.x) * (newZoom / zoom);
    const newPanY = centerY - (centerY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(3, Math.max(0.15, zoom * delta));
      
      const rect = boardRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      // Infinite panning via trackpad or mouse wheel
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const bgStyles = {
    grid: { backgroundImage: 'radial-gradient(circle, var(--glass-border, rgba(0,0,0,0.1)) 1px, transparent 1px)', backgroundSize: '32px 32px' },
    dots: { backgroundImage: 'radial-gradient(var(--glass-border, rgba(0,0,0,0.1)) 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' },
    plain: { background: 'var(--cms-bg)' },
    dark: { background: '#080808', backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }
  };

  if (isLoading) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
      <Loader2 size={32} className="cms-spin" style={{ color: 'var(--cms-text-muted)', opacity: 0.5 }} />
    </div>
  );

  return (
    <div 
      className="whiteboard-module" 
      style={{ width: '100%', height: '100%', background: 'var(--cms-bg)', position: 'relative', overflow: 'hidden', display: 'flex', touchAction: 'none' }}
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleGlobalMouseUp}
      onWheel={handleWheel}
    >
      
      {/* ── Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 1999,
            background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
            transition: '0.3s'
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div className="wb-sidebar" style={{ 
        width: 280, background: 'var(--cms-panel-bg)', height: '100%', 
        display: 'flex', flexDirection: 'column', 
        zIndex: 2000, position: 'absolute', left: 0, top: 0,
        boxShadow: isSidebarOpen ? '10px 0 40px rgba(0,0,0,0.1)' : 'none',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        visibility: isSidebarOpen ? 'visible' : 'hidden',
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.4s, box-shadow 0.4s',
        overflow: 'hidden'
      }}>
         <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>Daftar Kanvas</span>
            <button onClick={addCanvas} style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} className="high-contrast-btn"><Plus size={16} /></button>
         </div>
         <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {canvases.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setActiveCanvasId(c.id); }}
                {...bindContextMenu(() => ({
                  title: c.title || 'Kanvas Kreatif',
                  subtitle: `${c.notes?.length || 0} Catatan / Elemen`,
                  headerBadge: 'KANVAS',
                  items: [
                    {
                      label: 'Buka Kanvas',
                      icon: <Layers size={15} color="var(--cms-accent)" />,
                      action: () => setActiveCanvasId(c.id)
                    },
                    {
                      label: 'Ubah Nama Kanvas',
                      icon: <Edit3 size={15} />,
                      action: () => startEditing(c)
                    },
                    {
                      label: 'Duplikasi Kanvas',
                      icon: <Copy size={15} />,
                      action: () => {
                        const newC = { ...c, id: `canvas-${Date.now()}`, title: `${c.title} (Salinan)` };
                        const updated = [...canvases, newC];
                        setCanvases(updated);
                        storage.setItem('porto_whiteboard_canvases', updated);
                        notify('Kanvas diduplikasi', 'success');
                      }
                    },
                    { separator: true },
                    {
                      label: 'Hapus Kanvas',
                      icon: <Trash2 size={15} />,
                      danger: true,
                      action: () => handleDeleteCanvas({ stopPropagation: () => {} } as any, c.id)
                    }
                  ]
                }))}
                style={{ padding: '12px 16px', borderRadius: 12, background: activeCanvasId === c.id ? 'var(--cms-accent)' : 'transparent', border: activeCanvasId === c.id ? 'none' : '1px solid var(--glass-border)', color: activeCanvasId === c.id ? '#fff' : 'var(--cms-text)', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 14 }} 
                className="sidebar-pill"
              >
                 {editingCanvasId === c.id ? (
                    <input autoFocus value={editingTitle} onChange={e => setEditingTitle(e.target.value)} onBlur={finishEditing} onKeyDown={e => e.key === 'Enter' && finishEditing()} style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', outline: 'none', width: '100%' }} />
                 ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onDoubleClick={() => startEditing(c)}>
                       <Layers size={16} opacity={0.8} /> {c.title}
                    </div>
                 )}
                 <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); startEditing(c); }} style={{ background: 'transparent', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer', padding: 4 }}><Edit3 size={14} /></button>
                    <button onClick={(e) => handleDeleteCanvas(e, c.id)} style={{ background: 'transparent', border: 'none', color: activeCanvasId === c.id ? '#fff' : '#ef4444', opacity: 0.8, cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* ── Canvas Space ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Toggle Sidebar moved to Toolbar */}

        {/* Toolbar - BACK TO TOP RESPONSIVE */}
        <div className="wb-toolbar-container" style={{ 
          position: 'absolute', bottom: '16px', left: '50%', right: 'auto',
          transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 240px)',
          background: 'var(--cms-bg-card)', border: '1px solid var(--cms-border)', 
          borderRadius: '24px', padding: '12px 16px', display: 'flex', flexDirection: 'row', gap: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1000, alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          <style>{`.wb-toolbar-container::-webkit-scrollbar { display: none; }`}</style>
          <div className="wb-toolbar-inner" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', flexShrink: 0, alignItems: 'center' }}>
            
            {readOnly ? (
              <>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                  <button onClick={() => setActiveTool(activeTool === 'pan' ? 'select' : 'pan')} style={{ background: activeTool === 'pan' ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: activeTool === 'pan' ? 'var(--cms-accent)' : 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Geser Kanvas (Hand Tool)">
                    <Hand size={20} />
                  </button>
                  <button onClick={resetView} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Pusatkan Tampilan (Reset View)">
                    <Target size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => handleZoom(1.2)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Zoom In"><ZoomIn size={20} /></button>
                  <button onClick={() => handleZoom(0.8)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Zoom Out"><ZoomOut size={20} /></button>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text-muted)', padding: '0 6px', userSelect: 'none' }}>{Math.round(zoom * 100)}%</span>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                  {Object.keys(bgStyles).map(key => (
                    <button key={key} onClick={() => updateActiveCanvas({ bg: key })} style={{ background: activeCanvas?.bg === key ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: activeCanvas?.bg === key ? 'var(--cms-accent)' : 'var(--cms-text-muted)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title={`Latar: ${key}`}>
                      {key === 'grid' ? <Grid3X3 size={20} /> : key === 'dots' ? <Circle size={6} fill="currentColor" /> : key === 'plain' ? <Square size={20} /> : <Layout size={20} />}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                  <button onClick={handleExportPng} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Unduh Gambar PNG">
                    <Download size={20} />
                  </button>
                  <button onClick={handleExportPdf} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Unduh / Cetak PDF">
                    <FileText size={20} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {!embedded && (
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: isSidebarOpen ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: isSidebarOpen ? 'var(--cms-accent)' : 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Daftar Kanvas" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => { if(!isSidebarOpen) e.currentTarget.style.background = 'transparent'; }}>
                       {isSidebarOpen ? <ChevronLeft size={20} /> : <Layers size={20} />}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                  <button onClick={() => addNote('text')} style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Tambah Note" onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                     <Plus size={20} strokeWidth={3} />
                  </button>
                  <button onClick={() => addNote('todo')} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Tambah Todo" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                     <ListTodo size={20} />
                  </button>
                  <button onClick={() => addNote('link')} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Tambah Tautan" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                     <LinkIcon size={20} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowImageMenu(!showImageMenu)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Tambah Gambar" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                       {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                    </button>
                    {showImageMenu && (
                        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, background: 'var(--cms-card-bg)', borderRadius: 12, padding: 8, border: '1px solid var(--cms-border)', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100 }}>
                          <label style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', cursor: 'pointer', borderRadius: 8, whiteSpace: 'nowrap', color: 'var(--cms-text)' }} className="cms-menu-item">
                             <Upload size={16} /> <span>Upload PC</span>
                             <input type="file" style={{ display: 'none' }} onChange={(e) => { setShowImageMenu(false); handleImageUpload(e); }} disabled={isUploading} />
                          </label>
                          <button onClick={() => { setShowImageMenu(false); setShowGalleryModal(true); }} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', cursor: 'pointer', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', whiteSpace: 'nowrap', textAlign: 'left', width: '100%' }} className="cms-menu-item">
                             <ImageIcon size={16} /> <span>Galeri Media</span>
                          </button>
                       </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                   {Object.keys(bgStyles).map(key => (
                     <button key={key} onClick={() => updateActiveCanvas({ bg: key })} style={{ background: activeCanvas?.bg === key ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: activeCanvas?.bg === key ? 'var(--cms-accent)' : 'var(--cms-text-muted)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title={`Ganti Background: ${key}`} onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => { if(activeCanvas?.bg !== key) e.currentTarget.style.background = 'transparent'; }}>
                       {key === 'grid' ? <Grid3X3 size={20} /> : key === 'dots' ? <Circle size={6} fill="currentColor" /> : key === 'plain' ? <Square size={20} /> : <Layout size={20} />}
                     </button>
                   ))}
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                  <button onClick={() => setActiveTool(activeTool === 'pan' ? 'select' : 'pan')} style={{ background: activeTool === 'pan' ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: activeTool === 'pan' ? 'var(--cms-accent)' : 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Geser (Hand Tool)" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => { if(activeTool !== 'pan') e.currentTarget.style.background = 'transparent'; }}>
                    <Hand size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                  <button onClick={handleExportPng} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Export ke PNG" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                     <Download size={20} />
                  </button>
                  <button onClick={handleExportPdf} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Export ke PDF" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                     <FileText size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
                   <button onClick={() => handleZoom(1.2)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Zoom In" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}><ZoomIn size={20} /></button>
                   <button onClick={() => handleZoom(0.8)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Zoom Out" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}><ZoomOut size={20} /></button>
                </div>
              </>
            )}
            
          </div>
        </div>
        
        {/* Viewport */}
        <div ref={boardRef} onMouseDown={(e) => { setActiveLine(null); handleBoardMouseDown(e); }} onTouchStart={handleBoardTouchStart} style={{ flex: 1, position: 'relative', cursor: isPanning || activeTool === 'pan' ? 'grabbing' : 'default' }}>
          <div 
            ref={canvasRef}
            className="whiteboard-canvas"
            style={{ 
              position: 'absolute', top: 0, left: 0, width: 20000, height: 20000,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              ...bgStyles[activeCanvas?.bg || 'grid'],
              backgroundRepeat: 'repeat',
              transition: isPanning || activeNote ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            {/* ── EXPORT TITLE ── */}
            <div className="export-only-title" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 'max-content', zIndex: 10 }}>
               <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cms-text)', margin: 0, paddingBottom: 4 }}>{activeCanvas?.title}</h1>
               <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--cms-text-muted)', margin: 0 }}>Diperbarui: {new Date().toLocaleDateString()}</p>
            </div>
            {/* ── CSS FOR EXPORT ── */}
            <style>{`
               .export-mode { transition: none !important; }
               .export-mode .export-only-title { opacity: 1 !important; }
               .export-mode .bg-toggle-btn, .export-mode .main-action-btn, .export-mode .secondary-action-btn { display: none !important; }
               .export-mode 
            `}</style>

            {/* ── SVG LINES LAYER ── */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
              <defs>
                {(activeCanvas?.lines || []).map(line => (
                  <marker key={`arrow_${line.id}`} id={`arrow_${line.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={line.color} />
                  </marker>
                ))}
              </defs>
              
              {(activeCanvas?.lines || []).map(line => {
                const fromNote = activeCanvas.notes?.find(n => n.id === line.fromId);
                const toNote = activeCanvas.notes?.find(n => n.id === line.toId);
                if (!fromNote || !toNote) return null;
                
                const fromCenterX = fromNote.x + fromNote.width / 2;
                const toCenterX = toNote.x + toNote.width / 2;
                const isToRight = toCenterX > fromCenterX;
                
                const fromHeight = fromNote.type === 'image' ? 100 : 80;
                const toHeight = toNote.type === 'image' ? 100 : 80;

                const fx = isToRight ? fromNote.x + fromNote.width + 5 : fromNote.x - 5;
                const fy = fromNote.y + fromHeight;
                const tx = isToRight ? toNote.x - 5 : toNote.x + toNote.width + 5;
                const ty = toNote.y + toHeight;
                
                // Curve Path
                const path = `M ${fx} ${fy} C ${fx + (tx-fx)/2} ${fy}, ${fx + (tx-fx)/2} ${ty}, ${tx} ${ty}`;
                
                return (
                  <g key={line.id} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => { e.stopPropagation(); setActiveLine(line.id); }}>
                    {/* Invisible thicker path for easier clicking */}
                    <path d={path} stroke="transparent" strokeWidth="15" fill="none" cursor="pointer" />
                    <path d={path} stroke={activeLine === line.id ? 'var(--cms-accent)' : line.color} strokeWidth={line.thickness || 2} strokeDasharray={line.dashed ? "6,6" : "none"} fill="none" markerEnd={line.arrow ? `url(#arrow_${line.id})` : "none"} />
                  </g>
                );
              })}
              
              {/* Drawing Line */}
              {drawingLine && (
                <path 
                  d={`M ${drawingLine.startX} ${drawingLine.startY} C ${drawingLine.startX + (drawingLine.endX-drawingLine.startX)/2} ${drawingLine.startY}, ${drawingLine.startX + (drawingLine.endX-drawingLine.startX)/2} ${drawingLine.endY}, ${drawingLine.endX} ${drawingLine.endY}`} 
                  stroke="var(--cms-accent)" strokeWidth="2" strokeDasharray="5,5" fill="none" 
                />
              )}
            </svg>

            {/* ── HTML LINES LAYER (Controls & Text) ── */}
            {(activeCanvas?.lines || []).map(line => {
              const fromNote = activeCanvas.notes?.find(n => n.id === line.fromId);
              const toNote = activeCanvas.notes?.find(n => n.id === line.toId);
              if (!fromNote || !toNote) return null;
              if (!line.text && activeLine !== line.id) return null;
              
              const fromCenterX = fromNote.x + fromNote.width / 2;
              const toCenterX = toNote.x + toNote.width / 2;
              const isToRight = toCenterX > fromCenterX;
              const fromHeight = fromNote.type === 'image' ? 100 : 80;
              const toHeight = toNote.type === 'image' ? 100 : 80;
              const fx = isToRight ? fromNote.x + fromNote.width + 5 : fromNote.x - 5;
              const fy = fromNote.y + fromHeight;
              const tx = isToRight ? toNote.x - 5 : toNote.x + toNote.width + 5;
              const ty = toNote.y + toHeight;

              return (
                <div 
                  key={`html_${line.id}`} 
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', left: (fx+tx)/2 - 60, top: (fy+ty)/2 - 16, width: 120, zIndex: 9999 }}
                >
                  <div style={{ background: 'var(--cms-card-bg)', border: (!readOnly && activeLine === line.id) ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)', borderRadius: 8, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {readOnly ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text)', userSelect: 'text', textAlign: 'center' }}>{line.text}</span>
                    ) : (
                      <input 
                        value={line.text || ''} 
                        onChange={(e) => updateActiveCanvas({ lines: activeCanvas.lines.map(l => l.id === line.id ? { ...l, text: e.target.value } : l) })} 
                        placeholder={activeLine === line.id ? "Label..." : ""} 
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, textAlign: 'center', outline: 'none' }} 
                      />
                    )}
                  </div>
                  {!readOnly && activeLine === line.id && (
                    <div style={{ 
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8, 
                      background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', 
                      borderRadius: 99, padding: '4px 6px', display: 'flex', gap: 4, 
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', alignItems: 'center',
                      zIndex: 100 
                    }}>
                      {/* Color Picker Wrapper */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div onMouseDown={(e) => { e.stopPropagation(); setShowLineColors(!showLineColors); }} style={{ width: 28, height: 28, borderRadius: '50%', background: line.color, border: '2px solid var(--cms-card-bg)', boxShadow: '0 0 0 1px var(--glass-border)', cursor: 'pointer' }} title="Pilih Warna Garis" />
                        
                        {showLineColors && (
                          <div style={{ position: 'absolute', bottom: '100%', left: -8, marginBottom: 12, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, boxShadow: '0 16px 40px rgba(0,0,0,0.2)', zIndex: 110 }}>
                            {colors.map(c => (
                              <button 
                                key={c.name}
                                onMouseDown={(e) => { 
                                  e.stopPropagation(); 
                                  updateActiveCanvas({ lines: activeCanvas.lines.map(l => l.id === line.id ? { ...l, color: c.text } : l) });
                                  setShowLineColors(false);
                                }}
                                style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: c.text, cursor: 'pointer', outline: line.color === c.text ? '2px solid var(--cms-accent)' : 'none', outlineOffset: 2, transition: 'transform 0.1s' }}
                                title={c.name}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ width: 1, height: 16, background: 'var(--glass-border)', margin: '0 2px' }} />

                      <button onMouseDown={(e) => { e.stopPropagation(); updateActiveCanvas({ lines: activeCanvas.lines.map(l => l.id === line.id ? { ...l, thickness: (l.thickness || 2) === 2 ? 4 : ((l.thickness || 2) === 4 ? 6 : 2) } : l) }); }} 
                        style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: 'var(--cms-text)', borderRadius: '50%', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Ketebalan" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        {line.thickness || 2}
                      </button>

                      <button onMouseDown={(e) => { e.stopPropagation(); updateActiveCanvas({ lines: activeCanvas.lines.map(l => l.id === line.id ? { ...l, arrow: !l.arrow } : l) }); }} 
                        style={{ width: 28, height: 28, border: 'none', background: line.arrow ? 'var(--cms-accent)' : 'transparent', color: line.arrow ? '#fff' : 'var(--cms-text)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Anak Panah" onMouseOver={(e) => { if (!line.arrow) e.currentTarget.style.background = 'var(--cms-card-bg-hover)' }} onMouseOut={(e) => { if (!line.arrow) e.currentTarget.style.background = 'transparent' }}>
                        <ArrowRight size={14} />
                      </button>

                      <button onMouseDown={(e) => { e.stopPropagation(); updateActiveCanvas({ lines: activeCanvas.lines.map(l => l.id === line.id ? { ...l, dashed: !l.dashed } : l) }); }} 
                        style={{ width: 28, height: 28, border: 'none', background: line.dashed ? 'var(--cms-accent)' : 'transparent', color: line.dashed ? '#fff' : 'var(--cms-text)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} title="Garis Putus" onMouseOver={(e) => { if (!line.dashed) e.currentTarget.style.background = 'var(--cms-card-bg-hover)' }} onMouseOut={(e) => { if (!line.dashed) e.currentTarget.style.background = 'transparent' }}>
                        <Minus size={14} />
                      </button>

                      <div style={{ width: 1, height: 16, background: 'var(--glass-border)', margin: '0 2px' }} />

                      <button onMouseDown={(e) => { e.stopPropagation(); updateActiveCanvas({ lines: activeCanvas.lines.filter(l => l.id !== line.id) }); setActiveLine(null); }} 
                        style={{ width: 28, height: 28, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {(activeCanvas?.notes || []).map(note => (
              <div 
                key={note.id} 
                data-note-id={note.id}
                onMouseEnter={() => !readOnly && setHoveredNoteId(note.id)}
                onMouseLeave={() => !readOnly && setHoveredNoteId(prev => prev === note.id ? null : prev)}
                style={{ 
                  position: 'absolute', 
                  left: note.x, 
                  top: note.y, 
                  transform: `rotate(${note.rotation}deg)`, 
                  width: note.width, 
                  zIndex: note.zIndex || 10, 
                  cursor: readOnly ? 'default' : (activeNote?.id === note.id ? 'grabbing' : 'grab'), 
                  userSelect: readOnly ? 'text' : 'none',
                  transition: activeNote?.id === note.id ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div 
                  onMouseDown={(e) => !readOnly && handleMouseDown(e, note, 'translate')} 
                  onTouchStart={(e) => !readOnly && handleTouchStart(e, note, 'translate')}
                  style={{ 
                    background: note.type === 'image' ? 'transparent' : note.color.bg, 
                    color: note.color.text, 
                    padding: note.type === 'image' ? 0 : 20, 
                    borderRadius: 24, 
                    border: `1px solid ${note.type === 'image' ? (activeNote?.id === note.id ? 'var(--cms-accent)' : 'transparent') : (activeNote?.id === note.id ? note.color.text : note.color.text + '33')}`, 
                    boxShadow: activeNote?.id === note.id ? '0 40px 100px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.05)', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)' 
                  }}
                >
                   {note.type === 'text' ? (
                     readOnly ? (
                       <div 
                         style={{ 
                           width: '100%', 
                           color: 'inherit', 
                           fontSize: 16, 
                           fontWeight: 800, 
                           minHeight: 60, 
                           lineHeight: 1.5, 
                           fontFamily: 'inherit', 
                           padding: 0, 
                           margin: 0, 
                           whiteSpace: 'pre-wrap', 
                           wordBreak: 'break-word',
                           userSelect: 'text' 
                         }}
                       >
                         {note.content || ''}
                       </div>
                     ) : (
                       <textarea 
                          style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'none', outline: 'none', fontSize: 16, fontWeight: 800, minHeight: 100, lineHeight: 1.5, height: 'auto', overflow: 'hidden', fontFamily: 'inherit', boxShadow: 'none', padding: 0, margin: 0, display: 'block' }} 
                         value={note.content} 
                         onChange={(e) => {
                           updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, content: e.target.value } : n) });
                           e.target.style.height = 'auto';
                           e.target.style.height = e.target.scrollHeight + 'px';
                         }} 
                         placeholder="Tulis ide kamu di sini..." 
                       />
                     )
                   ) : note.type === 'todo' ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60, color: 'inherit' }}>
                        {(Array.isArray(note.tasks) ? note.tasks : []).map((task, idx) => (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '2px 0' }}>
                             {readOnly ? (
                               <span style={{ display: 'flex', marginTop: 2, color: 'inherit', opacity: task.completed ? 0.4 : 0.8 }}>
                                  {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                               </span>
                             ) : (
                               <button onClick={(e) => { e.stopPropagation(); updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, tasks: n.tasks.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t) } : n) }) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, color: 'inherit', display: 'flex', opacity: task.completed ? 0.4 : 0.8 }}>
                                  {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                               </button>
                             )}
                             {readOnly ? (
                               <div style={{ 
                                 width: '100%', 
                                 color: 'inherit', 
                                 fontSize: 15, 
                                 fontWeight: 800, 
                                 lineHeight: 1.4, 
                                 textDecoration: task.completed ? 'line-through' : 'none', 
                                 opacity: task.completed ? 0.4 : 1,
                                 wordBreak: 'break-word',
                                 userSelect: 'text'
                               }}>
                                 {task.text || ''}
                               </div>
                             ) : (
                               <textarea 
                                  className="wb-textarea-clean"
                                  rows={1}
                                  autoFocus={task.id === lastAddedTaskId}
                                  onFocus={(e) => {
                                    if(task.id === lastAddedTaskId) setLastAddedTaskId(null);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                style={{ 
                                    width: '100%', 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'inherit', 
                                    caretColor: 'currentColor',
                                    resize: 'none', 
                                    outline: 'none', 
                                    fontSize: 15, 
                                    fontWeight: 800, 
                                    lineHeight: 1.4, 
                                    height: 'auto', 
                                    overflow: 'hidden', 
                                    padding: 0, 
                                    margin: 0, 
                                    fontFamily: 'inherit', 
                                    textDecoration: task.completed ? 'line-through' : 'none', 
                                    opacity: task.completed ? 0.4 : 1, 
                                    boxShadow: 'none',
                                    display: 'block',
                                    appearance: 'none',
                                    WebkitAppearance: 'none'
                                }} 
                                value={task.text || ''} 
                                onChange={(e) => {
                                  updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, tasks: n.tasks.map((t, i) => i === idx ? { ...t, text: e.target.value } : t) } : n) });
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const newId = Date.now();
                                    const newTasks = [...note.tasks];
                                    newTasks.splice(idx + 1, 0, { id: newId, text: '', completed: false });
                                    setLastAddedTaskId(newId);
                                    updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, tasks: newTasks } : n) });
                                  } else if (e.key === 'Backspace' && task.text === '' && note.tasks.length > 1) {
                                    e.preventDefault();
                                    const newTasks = note.tasks.filter((_, i) => i !== idx);
                                    updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, tasks: newTasks } : n) });
                                  }
                                }}
                                placeholder="Tambah tugas..."
                              />
                             )}
                          </div>
                        ))}
                     </div>
                   ) : note.type === 'link' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 80, color: 'inherit' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7, fontSize: 12, fontWeight: 800 }}><LinkIcon size={16}/> {note.content ? 'WEB LINK' : 'NEW LINK'}</div>
                        
                        {readOnly ? (
                          <div style={{ width: '100%', fontSize: 17, fontWeight: 900, lineHeight: 1.3, wordBreak: 'break-word', userSelect: 'text' }}>
                            {note.content || 'Tautan Eksternal'}
                          </div>
                        ) : (
                          <textarea 
                            value={note.content || ''} 
                            onChange={(e) => {
                              updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, content: e.target.value } : n) });
                              e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px';
                            }} 
                            placeholder="Judul / Keterangan Link..." 
                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'inherit', resize: 'none', outline: 'none', fontSize: 18, fontWeight: 900, lineHeight: 1.3, padding: 0, margin: 0, overflow: 'hidden' }}
                            onMouseDown={(e) => e.stopPropagation()}
                            rows={1}
                          />
                        )}

                        {note.linkUrl ? (
                          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            <a 
                              href={note.linkUrl.match(/^https?:\/\//i) ? note.linkUrl : `https://${note.linkUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              onMouseDown={(e) => e.stopPropagation()} 
                              style={{ flex: 1, background: 'var(--cms-text)', color: 'var(--cms-bg)', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 800, textDecoration: 'none', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            >
                              Buka Tautan <ExternalLink size={14} />
                            </a>
                            {!readOnly && activeNote?.id === note.id && (
                              <button 
                                onMouseDown={async (e) => {
                                  e.stopPropagation();
                                  const url = await showPrompt("Masukkan Tautan Web (URL):", note.linkUrl);
                                  if (url !== null) {
                                    updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, linkUrl: url } : n) });
                                  }
                                }}
                                style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 8, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'inherit' }}
                                title="Edit Tautan"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                          </div>
                        ) : (
                          !readOnly && (
                            <button 
                              onMouseDown={async (e) => {
                                e.stopPropagation();
                                const url = await showPrompt("Masukkan Tautan Web (URL):", "");
                                if (url !== null && url.trim() !== "") {
                                  updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, linkUrl: url } : n) });
                                }
                              }}
                              style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.1)', color: 'inherit', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 800, border: '1px dashed rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                            >
                              <LinkIcon size={14} /> Setel Tautan
                            </button>
                          )
                        )}
                      </div>
                   ) : (
                     <div style={{ width: '100%', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', overflow: 'hidden' }}>
                        <img src={note.content} style={{ width: '100%', display: 'block', pointerEvents: 'none', objectFit: 'contain' }} alt="Board Image" />
                     </div>
                   )}
                </div>

                {!readOnly && activeNote?.id === note.id && !drawingLine && (
                  <>
                    <div onMouseDown={(e) => startDrawingLine(e, note, 'top')} onTouchStart={(e) => startDrawingLine(e, note, 'top')} style={{position:'absolute', top: -12, left: '50%', transform:'translateX(-50%)', width: 24, height: 24, background: 'var(--cms-accent)', borderRadius:'50%', cursor:'crosshair', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', border:'2px solid var(--cms-card-bg)', zIndex:100, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}><Plus size={14}/></div>
                    <div onMouseDown={(e) => startDrawingLine(e, note, 'bottom')} onTouchStart={(e) => startDrawingLine(e, note, 'bottom')} style={{position:'absolute', bottom: -12, left: '50%', transform:'translateX(-50%)', width: 24, height: 24, background: 'var(--cms-accent)', borderRadius:'50%', cursor:'crosshair', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', border:'2px solid var(--cms-card-bg)', zIndex:100, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}><Plus size={14}/></div>
                    <div onMouseDown={(e) => startDrawingLine(e, note, 'left')} onTouchStart={(e) => startDrawingLine(e, note, 'left')} style={{position:'absolute', left: -12, top: '50%', transform:'translateY(-50%)', width: 24, height: 24, background: 'var(--cms-accent)', borderRadius:'50%', cursor:'crosshair', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', border:'2px solid var(--cms-card-bg)', zIndex:100, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}><Plus size={14}/></div>
                    <div onMouseDown={(e) => startDrawingLine(e, note, 'right')} onTouchStart={(e) => startDrawingLine(e, note, 'right')} style={{position:'absolute', right: -12, top: '50%', transform:'translateY(-50%)', width: 24, height: 24, background: 'var(--cms-accent)', borderRadius:'50%', cursor:'crosshair', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', border:'2px solid var(--cms-card-bg)', zIndex:100, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}><Plus size={14}/></div>
                  </>
                )}

                {!readOnly && activeNote?.id === note.id && (
                  <div
                    className="wb-note-toolbar"
                    onMouseDown={e => e.stopPropagation()}
                    style={{
                      position: 'absolute', bottom: -52, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(var(--cms-card-bg-rgb), 0.95)', backdropFilter: 'blur(16px)',
                      border: '1px solid var(--glass-border)', borderRadius: 14, padding: 5,
                      display: 'flex', gap: 4, boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                      zIndex: 9999, animation: 'stk-toolbar-pop 0.35s cubic-bezier(0.16,1,0.3,1)',
                      pointerEvents: 'auto', whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowColorPicker(note.id === showColorPicker ? false : note.id); }}
                        onTouchStart={(e) => { e.stopPropagation(); setShowColorPicker(note.id === showColorPicker ? false : note.id); }}
                        className="cms-circle-btn"
                        style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: '50%', background: note.color.bg, border: `2px solid ${note.color.border}`, cursor: 'pointer', flexShrink: 0, padding: 0 }}
                      />
                      {showColorPicker === note.id && (
                        <div key={`color-picker-${note.id}`} style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 12, background: 'rgba(var(--cms-card-bg-rgb), 0.95)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', zIndex: 10000 }}>
                          {colors.map((c, i) => (
                            <button key={c.name + i} onClick={(e) => { e.stopPropagation(); updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, color: c } : n) }); setShowColorPicker(false); }} onTouchStart={(e) => { e.stopPropagation(); updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, color: c } : n) }); setShowColorPicker(false); }} className="cms-circle-btn" style={{ width: 24, height: 24, minWidth: 24, minHeight: 24, aspectRatio: '1 / 1', borderRadius: '50%', background: c.bg, border: note.color.name === c.name ? '2px solid var(--cms-accent, #7c3aed)' : `1px solid ${c.border}`, cursor: 'pointer', flexShrink: 0, padding: 0 }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        const types = ['text', 'todo', 'image', 'link'];
                        const nextType = types[(types.indexOf(note.type) + 1) % 4];
                        const newProps = {};
                        if (nextType === 'todo' && (!note.tasks || note.tasks.length === 0)) {
                          newProps.tasks = [{ id: Date.now(), text: '', completed: false }];
                        } else if (nextType === 'image' && !note.content.startsWith('http') && !note.content.startsWith('data:image')) {
                          newProps.content = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80';
                        }
                        updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, type: nextType, ...newProps } : n) });
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const types = ['text', 'todo', 'image', 'link'];
                        const nextType = types[(types.indexOf(note.type) + 1) % 4];
                        const newProps = {};
                        if (nextType === 'todo' && (!note.tasks || note.tasks.length === 0)) {
                          newProps.tasks = [{ id: Date.now(), text: '', completed: false }];
                        } else if (nextType === 'image' && !note.content.startsWith('http') && !note.content.startsWith('data:image')) {
                          newProps.content = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80';
                        }
                        updateActiveCanvas({ notes: activeCanvas.notes.map(n => n.id === note.id ? { ...n, type: nextType, ...newProps } : n) });
                      }}
                      title="Ganti Mode (Teks / ToDo / Gambar)"
                      className="cms-circle-btn"
                      style={{ width: 30, height: 30, minWidth: 30, minHeight: 30, aspectRatio: '1 / 1', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                    >
                      {note.type === 'text' ? <FileText size={14} /> : note.type === 'todo' ? <ListTodo size={14} /> : <ImageIcon size={14} />}
                    </button>
                    <button onClick={() => { const clone = { ...note, id: `note_${Date.now()}`, x: note.x + 24, y: note.y + 24, zIndex: (activeCanvas.notes.length || 0) + 1 }; updateActiveCanvas({ notes: [...activeCanvas.notes, clone] }); }} onTouchStart={() => { const clone = { ...note, id: `note_${Date.now()}`, x: note.x + 24, y: note.y + 24, zIndex: (activeCanvas.notes.length || 0) + 1 }; updateActiveCanvas({ notes: [...activeCanvas.notes, clone] }); }} className="cms-circle-btn" style={{ width: 30, height: 30, minWidth: 30, minHeight: 30, aspectRatio: '1 / 1', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}><Copy size={14} /></button>
                    <div onMouseDown={e => handleMouseDown(e, note, 'rotate')} onTouchStart={e => handleTouchStart(e, note, 'rotate')} className="cms-circle-btn" style={{ width: 30, height: 30, minWidth: 30, minHeight: 30, aspectRatio: '1 / 1', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'crosshair', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}><RotateCw size={14} /></div>
                    <div onMouseDown={e => handleMouseDown(e, note, 'resize')} onTouchStart={e => handleTouchStart(e, note, 'resize')} className="cms-circle-btn" style={{ width: 30, height: 30, minWidth: 30, minHeight: 30, aspectRatio: '1 / 1', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}><Maximize2 size={14} /></div>
                    <div style={{ width: 1, height: 22, background: 'var(--glass-border)', margin: '0 2px', alignSelf: 'center' }} />
                    <button onClick={() => updateActiveCanvas({ notes: activeCanvas.notes.filter(n => n.id !== note.id) })} onTouchStart={() => updateActiveCanvas({ notes: activeCanvas.notes.filter(n => n.id !== note.id) })} className="cms-circle-btn" style={{ width: 30, height: 30, minWidth: 30, minHeight: 30, aspectRatio: '1 / 1', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="wb-indicator-right" style={{ position: 'absolute', bottom: 16, right: 24, fontSize: 10, fontWeight: 600, color: 'var(--cms-text-muted)', opacity: 0.55, zIndex: 1000, letterSpacing: '0.04em', pointerEvents: 'none' }}>
           {activeCanvas?.notes?.length || 0} obj
        </div>
        <div className="wb-indicator-left" style={{ position: 'absolute', bottom: 16, left: 24, fontSize: 10, fontWeight: 600, color: 'var(--cms-text-muted)', opacity: 0.55, zIndex: 1000, letterSpacing: '0.04em', pointerEvents: 'none' }}>
           {Math.round(zoom * 100)}%
        </div>
        {/* Mobile-only top indicators (swapped from bottom on mobile) */}
        <div className="wb-indicator-top-right" style={{ display: 'none', position: 'absolute', top: 16, right: 16, fontSize: 9, fontWeight: 600, color: 'var(--cms-text-muted)', opacity: 0.6, zIndex: 1000, letterSpacing: '0.04em', pointerEvents: 'none' }}>
           {activeCanvas?.notes?.length || 0} obj
        </div>
        <div className="wb-indicator-top-left" style={{ display: 'none', position: 'absolute', top: 16, left: 16, fontSize: 9, fontWeight: 600, color: 'var(--cms-text-muted)', opacity: 0.6, zIndex: 1000, letterSpacing: '0.04em', pointerEvents: 'none' }}>
           {Math.round(zoom * 100)}%
        </div>
      </div>

      <style>{`
        .sidebar-toggle-btn:hover { background: var(--cms-accent) !important; color: #fff !important; transform: scale(1.1); }
        .sidebar-pill:hover { transform: translateX(8px); }
        
        .wb-textarea-clean:focus, .wb-textarea-clean:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }

        /* ── TABLET (501px – 1280px) ── */
        @media (min-width: 501px) and (max-width: 1280px) {
          .wb-toolbar-container {
            position: fixed !important;
            bottom: 96px !important;
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            max-width: calc(100% - 200px) !important;
            padding: 10px 14px !important;
          }
          .wb-toolbar-inner {
            gap: 6px !important;
          }
        }

        @media (max-width: 500px) {
          /* Toolbar — 92px dari bawah = navbar(~72px) + 10px gap + toolbar shadow */
          .wb-toolbar-container { 
            position: fixed !important;
            top: auto !important;
            bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important;
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            max-width: calc(100% - 24px) !important;
            width: max-content !important;
            z-index: 9999 !important;
          }
          .wb-toolbar-inner {
            padding: 2px !important; 
            gap: 4px !important;
            width: auto !important;
            min-width: unset !important;
          }
          .main-action-btn, .secondary-action-btn { 
            height: 36px !important; 
            padding: 0 12px !important; 
            font-size: 11px !important;
          }
          .hide-sm { display: none; }
          .wb-divider { width: 1px !important; height: 16px !important; margin: auto 1px !important; }
          /* Hide bottom indicators on mobile */
          .wb-indicator-right, .wb-indicator-left { display: none !important; }
          /* Show top indicators on mobile */
          .wb-indicator-top-right, .wb-indicator-top-left { display: flex !important; align-items: center; }
          .sidebar-toggle-btn { 
            width: 40px !important; 
            height: 40px !important; 
            top: 12px !important; 
            left: 12px !important; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          }
          .sidebar-toggle-btn svg { width: 16px !important; height: 16px !important; }
        }

      `}</style>
      
      {showGalleryModal && (
        <MediaGalleryModal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          onSelect={(url) => {
            setShowGalleryModal(false);
            const img = new Image();
            img.onload = () => {
              const rect = boardRef.current ? boardRef.current.getBoundingClientRect() : { width: 1000, height: 800 };
              const newNote = {
                id: `note_${Date.now()}`,
                type: 'image',
                x: -pan.x + rect.width / 2 - (img.width > 300 ? 150 : img.width / 2),
                y: -pan.y + rect.height / 2 - (img.height > 300 ? 150 : img.height / 2),
                width: img.width > 300 ? 300 : img.width,
                content: url,
                color: { name: 'plain', bg: 'var(--cms-card-bg)', border: 'transparent' },
                zIndex: (activeCanvas?.notes?.length || 0) + 1
              };
              updateActiveCanvas({ notes: [...(activeCanvas?.notes || []), newNote] });
            };
            img.src = url;
          }}
        />
      )}

    </div>
  );
};

export default WhiteboardModule;
