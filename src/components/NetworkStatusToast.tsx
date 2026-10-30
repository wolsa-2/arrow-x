import React from 'react';
import { WifiOff, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface NetworkStatusToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NetworkStatusToast: React.FC<NetworkStatusToastProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-xs px-2 pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-3 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 text-xs font-bold border animate-in slide-in-from-top-3 duration-200 ${
              isError
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : isSuccess
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : isWarning
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isError && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
              {isWarning && <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />}
              {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="leading-tight">{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
