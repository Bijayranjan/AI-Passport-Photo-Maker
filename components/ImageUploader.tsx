import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import heic2any from 'heic2any';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = '';

    // Check for HEIC/HEIF
    if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith('.heic')) {
      try {
        setIsConverting(true);
        // Convert HEIC to JPEG
        const result = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9
        });

        // heic2any can return a single blob or an array of blobs. We take the first one.
        const conversionResult = Array.isArray(result) ? result[0] : result;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            onImageSelected(ev.target.result as string);
            setIsConverting(false);
          }
        };
        reader.readAsDataURL(conversionResult);
      } catch (error) {
        console.error("HEIC conversion failed:", error);
        alert("Failed to process HEIC file. Please try a JPG or PNG.");
        setIsConverting(false);
      }
    } else {
      // Standard image handling
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onImageSelected(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 transition-colors group relative ${!isConverting ? 'hover:bg-slate-100 cursor-pointer' : 'cursor-wait bg-slate-100'}`}
         onClick={() => !isConverting && fileInputRef.current?.click()}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif, .heic"
        className="hidden"
        disabled={isConverting}
      />
      
      {isConverting ? (
        <div className="flex flex-col items-center gap-4 text-blue-600 animate-fade-in">
          <Loader2 size={40} className="animate-spin" />
          <p className="font-medium">Converting HEIC image...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-slate-500 group-hover:text-blue-600 transition-colors">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Click to upload or drag and drop</p>
            <p className="text-sm opacity-75">Supports JPG, PNG, WEBP, HEIC</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;