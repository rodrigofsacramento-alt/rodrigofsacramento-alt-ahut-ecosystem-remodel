import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ImageIcon, Download, Trash2, Upload, Save, 
  RotateCw, FlipHorizontal, FlipVertical, 
  ZoomIn, ZoomOut, Crop, Type, Brush, 
  Sun, Contrast, Droplets, 
  X, Check, Palette, Eraser, Square, Circle,
  ArrowLeft, Share2, Sparkles, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface SavedImage {
  id: string;
  dataUrl: string;
  name: string;
  created_at: string;
  width: number;
  height: number;
}

type Tool = 'crop' | 'draw' | 'text' | 'shape' | 'filter' | 'none';

export default function ImageEditor() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [filterType, setFilterType] = useState<string>('none');
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#00FFCC');
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#00FFCC');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageName, setImageName] = useState('minha-criacao');
  const [showGallery, setShowGallery] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  
  // IA Generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{id: string; description: string; prompt: string} | null>(null);
  const [aiHistory, setAiHistory] = useState<{id: string; prompt: string; description: string; created_at: string}[]>([]);

  // Load saved images from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('qubits-edited-images');
      if (stored) setSavedImages(JSON.parse(stored));
    } catch {}
  }, []);

  const saveToLocalStorage = (images: SavedImage[]) => {
    localStorage.setItem('qubits-edited-images', JSON.stringify(images));
    setSavedImages(images);
  };

  const loadImage = useCallback((src: string) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.min(img.width, 800);
      canvas.height = Math.min(img.height, 600);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL();
      setHistory([dataUrl]);
      setHistoryIndex(0);
    };
    img.src = src;
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) loadImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIdx];
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[newIdx];
  };

  const applyFilter = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r += brightness * 2.55;
      g += brightness * 2.55;
      b += brightness * 2.55;

      // Contrast
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;

      // Saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + (r - gray) * (1 + saturation / 100);
      g = gray + (g - gray) * (1 + saturation / 100);
      b = gray + (b - gray) * (1 + saturation / 100);

      // Apply filter presets
      if (filterType === 'grayscale') {
        const avg = (r + g + b) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      } else if (filterType === 'sepia') {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (filterType === 'invert') {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      } else {
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (image) applyFilter();
  }, [brightness, contrast, saturation, filterType, image]);

  const startDrawing = (e: React.MouseEvent) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setLastX(e.clientX - rect.left);
    setLastY(e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const addText = () => {
    if (!textInput || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(textInput, canvas.width / 2, canvas.height / 2);
    saveState();
  };

  const rotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.height;
    tempCanvas.height = canvas.width;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(Math.PI / 2);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    saveState();
  };

  const flipH = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, 0, 0);
    saveState();
  };

  const flipV = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    ctx.drawImage(canvas, 0, 0);
    saveState();
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    
    const newImage: SavedImage = {
      id: Date.now().toString(),
      dataUrl,
      name: imageName || `imagem-${Date.now()}`,
      created_at: new Date().toISOString(),
      width: canvas.width,
      height: canvas.height,
    };
    
    saveToLocalStorage([newImage, ...savedImages]);
  };

  const deleteImage = (id: string) => {
    saveToLocalStorage(savedImages.filter(img => img.id !== id));
  };

  const downloadImage = (dataUrl: string, name: string) => {
    const link = document.createElement('a');
    link.download = `${name}.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportToChat = (dataUrl: string) => {
    // Copy to clipboard for pasting into chat
    canvasRef.current?.toBlob(blob => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          alert('✅ Imagem copiada! Cole no chat com Ctrl+V');
        });
      }
    });
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiResult(null);
    try {
      const res = await fetch('https://media.apexfyhub.com.br/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, model: 'minimax' }),
      });
      const data = await res.json();
      setAiResult(data);
      setAiHistory(prev => [data, ...prev].slice(0, 20));
      // Also load the description as text on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 800;
          canvas.height = 400;
          ctx.fillStyle = '#06080e';
          ctx.fillRect(0, 0, 800, 400);
          ctx.fillStyle = '#00FFCC';
          ctx.font = 'bold 20px Inter';
          ctx.textAlign = 'left';
          const lines = data.description.split('\n').filter((l: string) => l.trim());
          lines.slice(0, 15).forEach((line: string, i: number) => {
            ctx.fillStyle = i === 0 ? '#00FFCC' : '#94a3b8';
            ctx.font = i === 0 ? 'bold 16px Inter' : '14px Inter';
            ctx.fillText(line.slice(0, 80), 20, 30 + i * 24);
          });
          const dataUrl = canvas.toDataURL();
          const newImage: SavedImage = {
            id: data.id,
            dataUrl,
            name: `ia-${aiPrompt.slice(0, 30)}`,
            created_at: new Date().toISOString(),
            width: 800,
            height: 400,
          };
          saveToLocalStorage([newImage, ...savedImages]);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar:', err);
      alert('❌ Erro ao gerar imagem. Tente novamente.');
    }
    setAiGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Editor de Imagens</h1>
          <p className="text-slate-400 text-sm">Crie, edite e gerencie suas imagens</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowGallery(!showGallery)} className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2",
            showGallery ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-300 hover:bg-white/10"
          )}>
            <ImageIcon className="w-4 h-4" />
            Galeria ({savedImages.length})
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Abrir Imagem
          </button>
        </div>
      </div>

      {showGallery ? (
        /* Gallery View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {savedImages.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Nenhuma imagem criada ainda</p>
              <p className="text-xs">Crie sua primeira imagem no editor</p>
            </div>
          )}
          {savedImages.map(img => (
            <div key={img.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden group">
              <div className="aspect-square relative">
                <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => loadImage(img.dataUrl)} className="p-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors">
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => downloadImage(img.dataUrl, img.name)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => exportToChat(img.dataUrl)} className="p-2 bg-emerald-500/50 rounded-lg hover:bg-emerald-500 transition-colors">
                    <Share2 className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => deleteImage(img.id)} className="p-2 bg-rose-500/50 rounded-lg hover:bg-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-2 text-xs text-slate-400 truncate">{img.name}</div>
            </div>
          ))}
        </div>
      ) : (
        /* Editor View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Toolbar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tools */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Ferramentas</h3>
              <div className="grid grid-cols-4 gap-2">
                <ToolButton icon={<Brush className="w-4 h-4" />} label="Draw" active={activeTool === 'draw'} onClick={() => setActiveTool(activeTool === 'draw' ? 'none' : 'draw')} />
                <ToolButton icon={<Type className="w-4 h-4" />} label="Texto" active={activeTool === 'text'} onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')} />
                <ToolButton icon={<Sun className="w-4 h-4" />} label="Filtro" active={activeTool === 'filter'} onClick={() => setActiveTool(activeTool === 'filter' ? 'none' : 'filter')} />
                <ToolButton icon={<RotateCw className="w-4 h-4" />} label="Girar" onClick={rotate} />
                <ToolButton icon={<FlipHorizontal className="w-4 h-4" />} label="Flip H" onClick={flipH} />
                <ToolButton icon={<FlipVertical className="w-4 h-4" />} label="Flip V" onClick={flipV} />
                <ToolButton icon={<UndoIcon />} label="Desfazer" onClick={undo} />
                <ToolButton icon={<RedoIcon />} label="Refazer" onClick={redo} />
              </div>
            </div>

            {/* Drawing Options */}
            {activeTool === 'draw' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase">Pincel</h3>
                <div>
                  <label className="text-xs text-slate-400">Tamanho: {brushSize}px</label>
                  <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Cor</label>
                  <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                </div>
              </div>
            )}

            {/* Text Options */}
            {activeTool === 'text' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase">Adicionar Texto</h3>
                <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Digite seu texto..." className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm" />
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                  <button onClick={addText} className="flex-1 py-2 bg-cyan-500 text-white rounded-lg text-xs font-bold">Aplicar Texto</button>
                </div>
              </div>
            )}

            {/* Filter Options */}
            {activeTool === 'filter' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase">Filtros</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Original' },
                    { id: 'grayscale', label: 'Preto & Branco' },
                    { id: 'sepia', label: 'Sépia' },
                    { id: 'invert', label: 'Inverter' },
                  ].map(f => (
                    <button key={f.id} onClick={() => { setFilterType(f.id); saveState(); }} className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-colors",
                      filterType === f.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    )}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-400">Brilho: {brightness}</label>
                  <input type="range" min="-100" max="100" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Contraste: {contrast}</label>
                  <input type="range" min="-100" max="100" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Saturação: {saturation}</label>
                  <input type="range" min="-100" max="100" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full" />
                </div>
              </div>
            )}

            {/* AI Generation */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase">Gerar com IA</h3>
              <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Descreva a imagem que deseja gerar..." className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm h-20 resize-none" />
              <button onClick={generateWithAI} disabled={aiGenerating || !aiPrompt.trim()} className={cn(
                "w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                aiGenerating ? "bg-cyan-500/30 text-cyan-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
              )}>
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiGenerating ? 'Gerando...' : 'Gerar com IA ✨'}
              </button>
              {aiResult && (
                <div className="text-xs text-slate-400 p-2 bg-white/5 rounded-lg max-h-24 overflow-y-auto">
                  <span className="text-cyan-400 font-bold">✅ Pronto!</span> {aiResult.description.slice(0, 200)}...
                </div>
              )}
              {aiHistory.length > 0 && (
                <div className="text-[10px] text-slate-500 max-h-20 overflow-y-auto space-y-1">
                  {aiHistory.slice(0, 5).map(h => (
                    <div key={h.id} className="truncate">{h.prompt.slice(0, 40)}...</div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Actions */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase">Salvar</h3>
              <input type="text" value={imageName} onChange={e => setImageName(e.target.value)} placeholder="Nome da imagem" className="w-full bg-white/5 border border-cyan-900/30 rounded-lg px-3 py-2 text-sm" />
              <button onClick={saveImage} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <Save className="w-4 h-4" />
                Salvar na Galeria
              </button>
              <button onClick={() => { if (canvasRef.current) downloadImage(canvasRef.current.toDataURL(), imageName); }} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button onClick={() => { if (canvasRef.current) exportToChat(canvasRef.current.toDataURL()); }} className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                <Share2 className="w-4 h-4" />
                Copiar para Chat
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
              <div className="p-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {image ? `${canvasRef.current?.width}×${canvasRef.current?.height}px` : 'Nenhuma imagem carregada'}
                </span>
                {image && (
                  <span className="text-[10px] text-slate-500">
                    Histórico: {historyIndex + 1}/{history.length}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center min-h-[400px] bg-[#050505]">
                {!image ? (
                  <div className="text-center py-20">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-500">Clique em "Abrir Imagem" para começar</p>
                    <button onClick={() => {
                      // Create a blank canvas
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      canvas.width = 800;
                      canvas.height = 600;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      ctx.fillStyle = '#ffffff';
                      ctx.fillRect(0, 0, 800, 600);
                      const dataUrl = canvas.toDataURL();
                      setHistory([dataUrl]);
                      setHistoryIndex(0);
                      // Create a fake image to trigger the editor
                      const img = new window.Image();
                      img.onload = () => setImage(img);
                      img.src = dataUrl;
                    }} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm">
                      Criar Tela em Branco
                    </button>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="max-w-full max-h-[70vh] cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
      active ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
    )}>
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

function UndoIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>; }
function RedoIcon() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2m13-7l-4-4 4 4m0 0l-4 4" /></svg>; }