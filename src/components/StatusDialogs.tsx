import React from 'react';
import { Loader2, WifiOff, Ban, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio';

export type StatusDialogType = 'loading' | 'no_internet' | 'ad_unavailable' | 'error';

interface StatusDialogProps {
  type: StatusDialogType;
  isOpen: boolean;
  onRetry?: () => void;
  onClose: () => void;
  soundEnabled?: boolean;
}

export const StatusDialog: React.FC<StatusDialogProps> = ({
  type,
  isOpen,
  onRetry,
  onClose,
  soundEnabled = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[260px] rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-center text-slate-900 animate-in zoom-in-95 duration-150">
        {/* 1. Loading State */}
        {type === 'loading' && (
          <>
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0077FE] flex items-center justify-center mb-3">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Loading...
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Please wait.
            </p>
          </>
        )}

        {/* 2. No Internet State */}
        {type === 'no_internet' && (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#EF4444] flex items-center justify-center mb-3">
              <WifiOff className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              No Internet
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5 px-1 leading-relaxed">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                if (onRetry) onRetry();
                else onClose();
              }}
              className="w-full py-2.5 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Retry
            </button>
          </>
        )}

        {/* 3. Ad Unavailable State */}
        {type === 'ad_unavailable' && (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#EF4444] flex items-center justify-center mb-3">
              <Ban className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Ad Unavailable
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5 px-1 leading-relaxed">
              No ads available right now. Please try again later.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                onClose();
              }}
              className="w-full py-2.5 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              OK
            </button>
          </>
        )}

        {/* 4. Generic Error State */}
        {type === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#EF4444] flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Error
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5 px-1 leading-relaxed">
              Something went wrong. Please try again.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                if (onRetry) onRetry();
                else onClose();
              }}
              className="w-full py-2.5 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
};
