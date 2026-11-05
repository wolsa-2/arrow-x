import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { admob, ADMOB_TEST_APP_OPEN_UNIT_ID } from '../services/admobService';

interface AppOpenAdModalProps {
  onDismiss: () => void;
}

export const AppOpenAdModal: React.FC<AppOpenAdModalProps> = ({ onDismiss }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3);
  const [canSkip, setCanSkip] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    admob.dismissAppOpenAd();
    onDismiss();
  };

  const isTesting = admob.isTesting();
  const unitId = admob.getAppOpenUnitId();

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-[#0A1931] to-slate-950 text-white select-none animate-in fade-in duration-200 p-6">
      {/* Top Bar with Google AdMob Ad Badge */}
      <div className="w-full flex items-center justify-between pt-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-sm">
            Ad
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {isTesting ? 'Google AdMob Test Ad' : 'Sponsor'}
          </span>
        </div>

        {/* Skip / Continue Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            canSkip
              ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-md scale-100'
              : 'bg-white/20 text-slate-300 hover:bg-white/30'
          }`}
        >
          <span>{canSkip ? 'Continue to App' : `Skip in ${secondsRemaining}s`}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle Banner: ARROW X Welcome Hero */}
      <div className="flex flex-col items-center justify-center my-auto text-center px-4">
        {/* App Icon badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-[#0077FE]/30 blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-white p-2 shadow-2xl flex items-center justify-center border border-white/20">
            <img
              src="/arrow-x-icon-1024.jpg"
              alt="ARROW X"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                // Fallback graphic if image cannot be loaded
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-[#0077FE] text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>ARROW X Escape Puzzle</span>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          Ready to Solve?
        </h2>
        <p className="text-sm text-slate-400 max-w-xs mb-6 font-medium leading-relaxed">
          Untangle 200 mind-bending arrow mazes. Every level has a clean escape solution.
        </p>

        {/* Unit Info for Developers & Testers */}
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center max-w-xs w-full">
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Format: Google App Open Ad</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 break-all">
            {isTesting ? `Test ID: ${ADMOB_TEST_APP_OPEN_UNIT_ID}` : `Unit ID: ${unitId}`}
          </p>
        </div>
      </div>

      {/* Bottom Bar: Action Button */}
      <div className="w-full flex flex-col items-center pb-6">
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full max-w-xs py-4 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-98 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue to Game</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <span className="text-[10px] text-slate-500 mt-3 font-medium">
          Official Google Android Mobile Ads Integration
        </span>
      </div>
    </div>
  );
};
