import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Cropper from './components/Cropper';
import AILoader from './components/AILoader';
import { AppState, BackgroundColor, ClothingOption } from './types';
import { processBackground } from './services/geminiService';
import { generatePassportSheet } from './utils/canvasUtils';
import { Loader2, Download, RefreshCw, Wand2, ArrowLeft, AlertCircle, Shirt, User, Briefcase } from 'lucide-react';

const App = () => {
  const [state, setState] = useState<AppState>(AppState.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [finalSheet, setFinalSheet] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<BackgroundColor>(BackgroundColor.WHITE);
  const [selectedClothing, setSelectedClothing] = useState<ClothingOption>(ClothingOption.NONE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = (base64: string) => {
    setOriginalImage(base64);
    setState(AppState.CROP);
    setError(null);
  };

  const handleCropComplete = (cropped: string) => {
    setCroppedImage(cropped);
    // Move to process stage immediately, or let user review? Let's move to process UI.
    setState(AppState.PROCESS);
  };

  const handleProcess = async () => {
    if (!croppedImage) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Process Background and Clothing with Gemini
      const aiResult = await processBackground(croppedImage, selectedColor, selectedClothing);
      setProcessedImage(aiResult);
      
      // 2. Generate Sheet
      const sheet = await generatePassportSheet(aiResult);
      setFinalSheet(sheet);
      
      setState(AppState.PREVIEW);
    } catch (err) {
        // Fallback: If AI fails, use cropped image directly but warn user
        console.error(err);
        try {
            // Note: If clothing was requested but failed, we just revert to original clothes
            const sheet = await generatePassportSheet(croppedImage);
            setFinalSheet(sheet);
            setProcessedImage(croppedImage); // Use raw crop
            setState(AppState.PREVIEW);
            setError("AI processing failed. Using original photo.");
        } catch (innerErr) {
             setError("Failed to generate image. Please try again.");
        }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!finalSheet) return;
    const link = document.createElement('a');
    link.href = finalSheet;
    link.download = `passport-photos-4x6-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setState(AppState.UPLOAD);
    setOriginalImage(null);
    setCroppedImage(null);
    setProcessedImage(null);
    setFinalSheet(null);
    setError(null);
    setSelectedClothing(ClothingOption.NONE);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Immersive Processing Loader */}
      {isProcessing && <AILoader />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://lh3.googleusercontent.com/pw/AP1GczPsT7Kbwl2D3Man0MhE2xxg0egIVMoXN_x-ctR_VS2d6C66XWq-3dkbGU4PmTjxOb5zjUlSuQ5gEhv9QwQ1U1QQofMIuLrD3rsDOygXOUWQ1qVdj6CHukP-gDkY2qdXsU5l_5yF157GHU2Z6UHZRRF2EQ=w1217-h386-s-no?authuser=0" 
              alt="Art Centre" 
              className="h-10 w-auto object-contain"
            />
          </div>
          {state !== AppState.UPLOAD && (
            <button 
              onClick={handleReset}
              className="text-sm text-slate-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={14} /> Start Over
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p>{error}</p>
            </div>
        )}

        {state === AppState.UPLOAD && (
          <div className="max-w-2xl mx-auto mt-12 animate-fade-in-up">
             <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Create Professional Passport Photos</h2>
                <p className="text-lg text-slate-600">
                  Upload a selfie. We'll crop it, fix the background, and format it for printing on a 4x6 inch sheet.
                </p>
             </div>
             <ImageUploader onImageSelected={handleImageSelected} />
             
             <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Standard Size", desc: "35mm x 45mm Indian Passport Standard" },
                  { title: "AI Background", desc: "Clean White or Blue background automatically" },
                  { title: "Print Ready", desc: "Download a 4x6 sheet with 8 copies" }
                ].map((feature, i) => (
                  <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {state === AppState.CROP && originalImage && (
          <div className="max-w-3xl mx-auto h-[600px]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Step 1: Crop Face</h2>
              <span className="text-sm text-slate-500">Center the face inside the box</span>
            </div>
            <Cropper 
              imageSrc={originalImage} 
              onCropComplete={handleCropComplete} 
              onCancel={handleReset} 
            />
          </div>
        )}

        {state === AppState.PROCESS && croppedImage && (
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start animate-fade-in">
             {/* Left: Preview of Crop */}
             <div className="w-full md:w-1/3 flex flex-col gap-4">
               <h3 className="font-medium text-slate-700">Selected Crop</h3>
               <img src={croppedImage} alt="Crop" className="w-full rounded-lg shadow-md border border-slate-200" />
               <button onClick={() => setState(AppState.CROP)} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                 <ArrowLeft size={14} /> Adjust Crop
               </button>
             </div>

             {/* Right: Controls */}
             <div className="w-full md:w-2/3 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Step 2: Customize</h2>
               
               {/* Background Selection */}
               <div className="mb-8">
                 <label className="block text-sm font-medium text-slate-700 mb-3">Background Color</label>
                 <div className="flex gap-4">
                   <button
                     onClick={() => setSelectedColor(BackgroundColor.WHITE)}
                     className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${selectedColor === BackgroundColor.WHITE ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                     <div className="w-6 h-6 rounded-full border border-slate-300 bg-white shadow-sm"></div>
                     <span className="font-medium">White</span>
                   </button>
                   
                   <button
                     onClick={() => setSelectedColor(BackgroundColor.BLUE)}
                     className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${selectedColor === BackgroundColor.BLUE ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                     <div className="w-6 h-6 rounded-full border border-slate-300 bg-[#4b9cd3] shadow-sm"></div>
                     <span className="font-medium">Blue</span>
                   </button>
                 </div>
               </div>

               {/* Clothing Selection */}
               <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-700">Professional Attire (Optional)</label>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">AI Generated</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Option: Original */}
                      <button
                        onClick={() => setSelectedClothing(ClothingOption.NONE)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedClothing === ClothingOption.NONE ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <User size={24} className="text-slate-600" />
                         <span className="text-xs font-medium text-slate-700">Original</span>
                      </button>

                      {/* Option: Male Blazer */}
                      <button
                        onClick={() => setSelectedClothing(ClothingOption.MALE_BLAZER)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedClothing === ClothingOption.MALE_BLAZER ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <Briefcase size={24} className="text-slate-600" />
                         <span className="text-xs font-medium text-slate-700">Male Suit</span>
                      </button>

                      {/* Option: Female Blazer */}
                      <button
                        onClick={() => setSelectedClothing(ClothingOption.FEMALE_BLAZER)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedClothing === ClothingOption.FEMALE_BLAZER ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <Briefcase size={24} className="text-slate-600" />
                         <span className="text-xs font-medium text-slate-700">Female Suit</span>
                      </button>

                      {/* Option: Male Shirt */}
                      <button
                        onClick={() => setSelectedClothing(ClothingOption.MALE_SHIRT)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedClothing === ClothingOption.MALE_SHIRT ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <Shirt size={24} className="text-slate-600" />
                         <span className="text-xs font-medium text-slate-700">Male Shirt</span>
                      </button>

                      {/* Option: Female Shirt */}
                      <button
                        onClick={() => setSelectedClothing(ClothingOption.FEMALE_SHIRT)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedClothing === ClothingOption.FEMALE_SHIRT ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                         <Shirt size={24} className="text-slate-600" />
                         <span className="text-xs font-medium text-slate-700">Female Shirt</span>
                      </button>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                 <button
                   onClick={handleProcess}
                   disabled={isProcessing}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                 >
                   <Wand2 size={20} /> Generate Sheet
                 </button>
                 <p className="text-xs text-center text-slate-400 mt-3">Powered by Google Gemini AI</p>
               </div>
             </div>
          </div>
        )}

        {state === AppState.PREVIEW && finalSheet && (
           <div className="max-w-4xl mx-auto animate-fade-in">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-slate-900">Final Sheet (4x6 Inch)</h2>
               <button onClick={handleDownload} className="hidden md:flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition-all">
                  <Download size={18} /> Download PNG
               </button>
             </div>

             <div className="bg-slate-200 p-4 rounded-xl overflow-auto flex justify-center shadow-inner border border-slate-300">
                {/* Displaying scaled down version of the sheet */}
                <img src={finalSheet} alt="Final Sheet" className="max-w-full h-auto shadow-xl bg-white" style={{ maxHeight: '600px' }} />
             </div>

             <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-blue-50 border border-blue-100 rounded-xl">
               <div>
                  <h4 className="font-semibold text-blue-900">Printing Instructions</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1 list-disc list-inside">
                    <li>Print on <b>4x6 inch (4R)</b> photo paper.</li>
                    <li>Ensure printer scaling is set to <b>100%</b> or "Do Not Scale".</li>
                    <li>Cut along the grey guide lines.</li>
                  </ul>
               </div>
               <button onClick={handleDownload} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg transition-all">
                  <Download size={20} /> Download Sheet
               </button>
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
