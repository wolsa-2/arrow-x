import React, { useEffect, useState } from 'react';

interface SplashViewProps {
  onFinish: () => void;
  autostart?: boolean;
}

export const SplashView: React.FC<SplashViewProps> = ({ onFinish, autostart }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autostart) {
      onFinish();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 150);
          return 100;
        }
        return prev + 12;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [autostart, onFinish]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white text-slate-900 select-none px-6 py-12"
      onClick={onFinish}
    >
      {/* Top spacing */}
      <div className="w-full flex justify-center pt-8">
        {/* Title & Arrow Brand matching Reference Screen 1 */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-[#0077FE] fill-current"
            >
              <path d="M4 12 L14 4 L14 9 L20 9 L20 15 L14 15 L14 20 Z" />
            </svg>
            <h1 className="text-3xl font-black tracking-tight text-[#0A1931]">
              ARROW
            </h1>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#0A1931] -mt-1">
            ESCAPE
          </h1>
          <span className="text-base font-extrabold tracking-[0.25em] text-[#0077FE] mt-0.5">
            PUZZLE
          </span>
        </div>
      </div>

      {/* Central 4-Way Directional Arrow Plate matching Reference Screen 1 */}
      <div className="flex items-center justify-center my-auto">
        <div className="relative w-40 h-40 rounded-full bg-[#EAF3FB] flex items-center justify-center shadow-inner">
          {/* North Arrow */}
          <div className="absolute top-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#0077FE] fill-current drop-shadow-sm">
              <path d="M12 3 L4 13 L9 13 L9 20 L15 20 L15 13 L20 13 Z" />
            </svg>
          </div>
          {/* South Arrow */}
          <div className="absolute bottom-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#0077FE] fill-current drop-shadow-sm">
              <path d="M12 21 L4 11 L9 11 L9 4 L15 4 L15 11 L20 11 Z" />
            </svg>
          </div>
          {/* West Arrow */}
          <div className="absolute left-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#0077FE] fill-current drop-shadow-sm">
              <path d="M3 12 L13 4 L13 9 L20 9 L20 15 L13 15 L13 20 Z" />
            </svg>
          </div>
          {/* East Arrow */}
          <div className="absolute right-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#0077FE] fill-current drop-shadow-sm">
              <path d="M21 12 L11 4 L11 9 L4 9 L4 15 L11 15 L11 20 Z" />
            </svg>
          </div>
          {/* Center Subtle Dot */}
          <div className="w-3.5 h-3.5 rounded-full bg-[#0077FE]" />
        </div>
      </div>

      {/* Bottom Progress Bar matching Reference Screen 1 */}
      <div className="w-full max-w-xs flex flex-col items-center pb-6">
        <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
          <div
            className="bg-[#0077FE] h-full rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs font-bold text-slate-500 mt-3">
          Loading... {progress}%
        </p>
      </div>
    </div>
  );
};
