import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react';
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Passport aspect ratio 35:45 = 7:9
  const ASPECT_RATIO = 35 / 45; 
  // Visual size for the crop box on screen
  const CROP_BOX_HEIGHT = 360; 
  const CROP_BOX_WIDTH = CROP_BOX_HEIGHT * ASPECT_RATIO;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); 
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!imageRef.current) return;

    // Calculate crop based on visual position relative to the crop box
    // The "viewport" is fixed at center. The image moves.
    // We need to map the "Crop Box" coordinates onto the "Image" coordinates.

    const img = imageRef.current;
    
    // Scale factor between natural image size and displayed size (including zoom)
    // However, it's easier to think: how many pixels of the *natural* image are inside the box?
    
    // 1. Get current rendered dimensions
    const renderedWidth = img.naturalWidth * zoom;
    const renderedHeight = img.naturalHeight * zoom;

    // 2. Center of container
    const containerW = containerRef.current?.clientWidth || 0;
    const containerH = containerRef.current?.clientHeight || 0;
    
    // The center of the container corresponds to the center of the viewport
    // The image is offset by `position`.
    // Image Center X = ContainerCenter + PositionX
    
    const cropBoxLeft = (containerW - CROP_BOX_WIDTH) / 2;
    const cropBoxTop = (containerH - CROP_BOX_HEIGHT) / 2;

    // Calculate where the Crop Box Top-Left is relative to the Image Top-Left
    // Image Top-Left relative to container = (ContainerW/2 - RenderedW/2) + PositionX
    const imgLeftInContainer = (containerW - renderedWidth) / 2 + position.x;
    const imgTopInContainer = (containerH - renderedHeight) / 2 + position.y;

    // Offset of crop box relative to image
    const offsetX = cropBoxLeft - imgLeftInContainer;
    const offsetY = cropBoxTop - imgTopInContainer;

    // Map back to natural scale
    const scale = img.naturalWidth / renderedWidth;
    
    const cropX = Math.max(0, offsetX * scale);
    const cropY = Math.max(0, offsetY * scale);
    const cropW = Math.min(img.naturalWidth, CROP_BOX_WIDTH * scale);
    const cropH = Math.min(img.naturalHeight, CROP_BOX_HEIGHT * scale);

    try {
      const cropped = await getCroppedImg(imageSrc, {
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
      });
      onCropComplete(cropped);
    } catch (e) {
      console.error(e);
      alert('Failed to crop image');
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full animate-fade-in">
      <div className="relative w-full h-[500px] bg-slate-900 overflow-hidden rounded-xl shadow-inner cursor-move touch-none"
           ref={containerRef}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
           onTouchStart={handleMouseDown}
           onTouchMove={handleMouseMove}
           onTouchEnd={handleMouseUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
           {/* Dark Overlay with transparent cutout */}
           <div className="absolute inset-0 bg-black/60">
             {/* Cutout using clip-path or complex borders. Using borders for simplicity */}
           </div>
           
           {/* The actual visible hole mechanism */}
           <div className="absolute inset-0 flex items-center justify-center">
             <div 
                style={{ width: CROP_BOX_WIDTH, height: CROP_BOX_HEIGHT }} 
                className="border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-20 pointer-events-none relative"
             >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-white/50"></div>
                  <div className="border-r border-white/50"></div>
                  <div></div>
                  <div className="border-t border-white/50 col-span-3"></div>
                  <div className="border-t border-white/50 col-span-3"></div>
                </div>
                <div className="absolute -top-6 left-0 right-0 text-center text-white text-xs font-medium tracking-wide">
                  PASSPORT AREA (35x45mm)
                </div>
             </div>
           </div>
        </div>

        <div className="flex items-center justify-center w-full h-full pointer-events-none">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop target"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="max-w-none select-none"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6 w-full max-w-md px-4">
        <ZoomOut size={20} className="text-slate-500" />
        <input
          type="range"
          min="0.2"
          max="5"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <ZoomIn size={20} className="text-slate-500" />
      </div>

      <div className="flex gap-4 mt-8">
        <button 
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleCrop}
          className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all transform active:scale-95"
        >
          <Check size={18} />
          Crop Photo
        </button>
      </div>
    </div>
  );
};

export default Cropper;