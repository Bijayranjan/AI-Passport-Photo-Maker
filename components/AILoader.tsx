import React, { useState, useEffect } from 'react';
import { Search, Eraser, Sparkles, Shirt, LayoutGrid, Loader2 } from 'lucide-react';

const steps = [
  { label: 'Checking image', icon: Search, color: 'text-blue-500' },
  { label: 'Cleaning background', icon: Eraser, color: 'text-indigo-500' },
  { label: 'Cleaning noise', icon: Sparkles, color: 'text-purple-500' },
  { label: 'Adding outfit', icon: Shirt, color: 'text-pink-500' },
  { label: 'Arranging photos', icon: LayoutGrid, color: 'text-cyan-500' },
];

const AILoader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2500); // Change state every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl animate-fade-in">
      <div className="relative flex flex-col items-center max-w-xs w-full">
        {/* Animated Background Glow */}
        <div className="absolute -z-10 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        
        {/* Main Icon Container */}
        <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-3xl shadow-2xl mb-8 transform transition-all duration-700">
            {/* Indeterminate Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-slate-100"
                />
                <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="377"
                    strokeDashoffset="280"
                    className={`${steps[currentStep].color} transition-all duration-1000 ease-in-out`}
                />
            </svg>

            {/* Icon with Key for Re-mounting Animation */}
            <div key={currentStep} className="animate-bounce-in flex items-center justify-center">
                <ActiveIcon size={48} className={steps[currentStep].color} />
            </div>
        </div>

        {/* Text States */}
        <div className="text-center">
          <div key={`text-${currentStep}`} className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-white mb-2">
                {steps[currentStep].label}
            </h3>
            <div className="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium tracking-widest uppercase">AI Processing</span>
            </div>
          </div>
        </div>

        {/* Step Indicator Dots */}
        <div className="flex gap-2 mt-12">
            {steps.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}
                />
            ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-in {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
            animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default AILoader;
