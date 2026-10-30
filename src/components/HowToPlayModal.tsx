import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';

interface HowToPlayModalProps {
  theme?: 'dark' | 'light';
  soundEnabled: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  soundEnabled,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  const steps = [
    {
      step: 1,
      title: 'Tap an Arrow',
      description: 'Tap any arrow to make it escape in the direction it is pointing.',
      renderGraphic: () => (
        <div className="relative w-full h-44 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 overflow-hidden">
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none">
            {/* Dotted Grid Matrix (5 cols x 4 rows) */}
            {[25, 62, 100, 138, 175].map((x) =>
              [20, 50, 80, 105].map((y) => (
                <circle key={`dot-${x}-${y}`} cx={x} cy={y} r="2.2" fill="#CBD5E1" />
              ))
            )}
            {/* Left Navy Arrow pointing Up */}
            <path d="M 62 80 L 62 30" stroke="#0B132B" strokeWidth="5" strokeLinecap="round" />
            <polygon points="62,20 54,34 70,34" fill="#0B132B" />

            {/* Target Blue Arrow pointing Right */}
            <path d="M 62 50 L 130 50" stroke="#0077FE" strokeWidth="6" strokeLinecap="round" />
            <polygon points="142,50 128,42 128,58" fill="#0077FE" />

            {/* Dotted escape trajectory to border */}
            <line x1="145" y1="50" x2="190" y2="50" stroke="#0077FE" strokeWidth="2.5" strokeDasharray="3 3" />

            {/* Bottom Navy Arrow pointing Down */}
            <path d="M 138 60 L 138 100" stroke="#0B132B" strokeWidth="5" strokeLinecap="round" />
            <polygon points="138,108 130,95 146,95" fill="#0B132B" />
          </svg>

          {/* Animated Tap Hand Cursor */}
          <div className="absolute top-[42%] left-[45%] transform animate-bounce pointer-events-none">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Hand className="w-6 h-6 text-[#0077FE] fill-blue-100 stroke-[2.2]" />
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Clear Exit Path',
      description: 'An arrow can only escape if its path to the boundary is unobstructed.',
      renderGraphic: () => (
        <div className="relative w-full h-44 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 overflow-hidden">
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none">
            {[25, 62, 100, 138, 175].map((x) =>
              [20, 50, 80, 105].map((y) => (
                <circle key={`dot-${x}-${y}`} cx={x} cy={y} r="2.2" fill="#CBD5E1" />
              ))
            )}
            {/* Front unblocked arrow (Blue) */}
            <path d="M 100 20 L 170 20" stroke="#0077FE" strokeWidth="6" strokeLinecap="round" />
            <polygon points="182,20 168,12 168,28" fill="#0077FE" />
            <line x1="184" y1="20" x2="198" y2="20" stroke="#0077FE" strokeWidth="2.5" strokeDasharray="3 3" />

            {/* Blocked arrow behind it (Coral Red highlight) */}
            <path d="M 30 20 L 80 20" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
            <polygon points="90,20 78,13 78,27" fill="#EF4444" />
          </svg>
          <span className="absolute bottom-2 text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Free the front arrow first!
          </span>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Turns & Corners',
      description: 'Winding arrows follow their track, turning smoothly around every corner.',
      renderGraphic: () => (
        <div className="relative w-full h-44 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 overflow-hidden">
          <svg viewBox="0 0 200 120" className="w-full h-full" fill="none">
            {[25, 62, 100, 138, 175].map((x) =>
              [20, 50, 80, 105].map((y) => (
                <circle key={`dot-${x}-${y}`} cx={x} cy={y} r="2.2" fill="#CBD5E1" />
              ))
            )}
            {/* L-shaped Arrow */}
            <path d="M 40 90 L 110 90 L 110 30" stroke="#0077FE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <polygon points="110,18 102,32 118,32" fill="#0077FE" />
            <line x1="110" y1="18" x2="110" y2="2" stroke="#0077FE" strokeWidth="2.5" strokeDasharray="3 3" />
          </svg>
          <span className="absolute bottom-2 text-[10px] font-black text-[#0077FE] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Follows corner trajectory
          </span>
        </div>
      ),
    },
    {
      step: 4,
      title: '3 Hearts System',
      description: 'You have 3 hearts. Tapping a blocked arrow deducts 1 heart!',
      renderGraphic: () => (
        <div className="relative w-full h-44 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col items-center justify-center p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">❤️</span>
            <span className="text-3xl">❤️</span>
            <span className="text-3xl opacity-30">🖤</span>
          </div>
          <span className="text-xs font-black text-rose-600 bg-white px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
            1 Blocked Move = -1 Heart
          </span>
        </div>
      ),
    },
  ];

  const current = steps[currentStep - 1];

  const handleNext = () => {
    sound.playButton(soundEnabled);
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    sound.playButton(soundEnabled);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900 max-h-[85vh] overflow-hidden">
        {/* Header matching Reference Screen 11 */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
          <button
            type="button"
            aria-label="Back"
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0077FE] shadow-2xs active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            How to Play
          </h2>

          {/* Step indicator e.g. 1/4 */}
          <div className="font-extrabold text-xs text-slate-400 font-mono">
            {currentStep}/{totalSteps}
          </div>
        </div>

        {/* Content Card matching Reference Screen 11 */}
        <div className="flex-1 flex flex-col items-center text-center my-auto py-2">
          {current.renderGraphic()}

          <h3 className="text-xl font-black text-slate-900 tracking-tight mt-5 mb-1.5">
            {current.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[240px]">
            {current.description}
          </p>
        </div>

        {/* Footer matching Reference Screen 11 */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-100">
          {/* Skip Button */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              onClose();
            }}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
          >
            Skip
          </button>

          {/* 4 Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <span
                key={s.step}
                className={`h-2 rounded-full transition-all ${
                  s.step === currentStep
                    ? 'w-6 bg-[#0077FE]'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Next / Finish Button (Solid Blue Pill) */}
          <button
            type="button"
            onClick={handleNext}
            className="py-2.5 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {currentStep === totalSteps ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
