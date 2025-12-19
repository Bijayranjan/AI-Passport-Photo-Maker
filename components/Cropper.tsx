import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, Info } from 'lucide-react';
import { getCroppedImg } from '../utils/canvasUtils';

interface CropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

const Cropper: React.FC<CropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const ASPECT_RATIO = 35 / 45; 
  const CROP_BOX_HEIGHT = 420; 
  const CROP_BOX_WIDTH = CROP_BOX_HEIGHT * ASPECT_RATIO;

  // Indian Passport Auto-Framing Heuristic
  useEffect(() => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    
    const setupAutoCrop = () => {
      // 1. Calculate Target Zoom
      // For a standard portrait, we want the crop box to be about 40% of the image width
      // to isolate the head and shoulders properly.
      const widthZoom = (CROP_BOX_WIDTH / img.naturalWidth) * 2.8;
      const heightZoom = (CROP_BOX_HEIGHT / img.naturalHeight) * 1.5;
      
      // Use the more aggressive zoom to ensure we get a close-up
      let finalZoom = Math.max(widthZoom, heightZoom);
      
      // Prevent over-zooming on very small images
      finalZoom = Math.min(finalZoom, 4.0);
      setZoom(finalZoom);

      // 2. Calculate Initial Position (Framing)
      // The head is usually in the top 1/3 of the photo.
      // We want to shift the image up so the top of the head is near the top of the box.
      const renderedHeight = img.naturalHeight * finalZoom;
      
      // Shift up by 18% of the rendered height to center the face in the upper half
      const initialY = - (renderedHeight * 0.18);
      
      setPosition({ x: 0, y: initialY });
    };

    if (img.complete) {
      setupAutoCrop();
    } else {
      img.onload = setupAutoCrop;
    }
  }, [imageSrc]);

  // Pointer API for non-stick dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; 
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    
    const renderedWidth = img.naturalWidth * zoom;
    const renderedHeight = img.naturalHeight * zoom;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    
    const cropBoxLeft = (containerW - CROP_BOX_WIDTH) / 2;
    const cropBoxTop = (containerH - CROP_BOX_HEIGHT) / 2;

    const imgLeftInContainer = (containerW - renderedWidth) / 2 + position.x;
    const imgTopInContainer = (containerH - renderedHeight) / 2 + position.y;

    const offsetX = cropBoxLeft - imgLeftInContainer;
    const offsetY = cropBoxTop - imgTopInContainer;
    const scale = img.naturalWidth / renderedWidth;
    
    try {
      const cropped = await getCroppedImg(imageSrc, {
        x: offsetX * scale,
        y: offsetY * scale,
        width: CROP_BOX_WIDTH * scale,
        height: CROP_BOX_HEIGHT * scale,
      });
      onCropComplete(cropped);
    } catch (e) {
      console.error(e);
      alert('Failed to crop');
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full animate-fade-in select-none">
      <div 
        className="relative w-full h-[520px] bg-slate-900 overflow-hidden rounded-2xl shadow-2xl border border-slate-800 cursor-move touch-none"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Crop Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
           <div className="absolute inset-0 bg-black/70"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <div 
                style={{ width: CROP_BOX_WIDTH, height: CROP_BOX_HEIGHT }} 
                className="border-2 border-blue-400/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-20 pointer-events-none relative"
             >
                {/* Rule of Thirds / Face Guides */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-white/50"></div>
                  <div className="border-r border-white/50"></div>
                  <div></div>
                  <div className="border-t border-white/50 col-span-3"></div>
                  <div className="border-t border-white/50 col-span-3"></div>
                </div>

                {/* Face Alignment Oval (Optional Helper) */}
                <div className="absolute top-[15%] left-[15%] right-[15%] bottom-[25%] border border-dashed border-white/20 rounded-[50%] pointer-events-none"></div>

                <div className="absolute -top-8 left-0 right-0 flex justify-center">
                   <div className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">
                     Auto-Framing: India Standard
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* The Image */}
        <div className="flex items-center justify-center w-full h-full pointer-events-none">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop target"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.4, 1)',
              willChange: 'transform'
            }}
            className="max-w-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      <div className="w-full max-w-md mt-6 px-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Info size={12} /> Adjust Framing
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Zoom: {Math.round(zoom * 100)}%
            </span>
        </div>
        <div className="flex items-center gap-4">
            <ZoomOut size={18} className="text-slate-400" />
            <input
            type="range"
            min="0.1"
            max="4"
            step="0.001"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:bg-slate-200"
            />
            <ZoomIn size={18} className="text-slate-400" />
        </div>
      </div>

      <div className="flex gap-4 mt-8 pb-4">
        <button 
          onClick={onCancel}
          className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
        >
          Cancel
        </button>
        <button 
          onClick={handleCrop}
          className="flex items-center gap-2 px-10 py-3 rounded-xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 group"
        >
          <Check size={24} className="group-hover:scale-110 transition-transform" />
          Looks Good
        </button>
      </div>
    </div>
  );
};

export default Cropper;
