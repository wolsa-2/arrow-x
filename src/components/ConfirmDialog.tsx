import React from 'react';
import { RotateCcw, Home } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';

interface ConfirmDialogProps {
  isOpen?: boolean;
  type?: 'restart' | 'exit' | 'reset';
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen = true,
  type = 'restart',
  title,
  message,
  description,
  confirmText,
  cancelText = 'Cancel',
  soundEnabled = true,
  hapticsEnabled = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Defaults matching Reference Screen 13 & 14
  const isRestart = type === 'restart' || type === 'reset';
  const displayTitle = title || (isRestart ? 'Restart Level?' : 'Exit to Main Menu?');
  const displayMessage =
    message ||
    description ||
    (isRestart
      ? 'Are you sure you want to restart this level? Your progress will be lost.'
      : 'Your current level progress will be lost.');
  const displayConfirm = confirmText || (isRestart ? 'Restart' : 'Exit');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[290px] rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-center text-slate-900 animate-in zoom-in-95 duration-150">
        {/* Blue Circular Icon Badge matching Screen 13 & 14 */}
        <div className="w-16 h-16 rounded-full bg-[#0077FE] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
          {isRestart ? (
            <RotateCcw className="w-8 h-8 stroke-[2.4]" />
          ) : (
            <Home className="w-8 h-8 stroke-[2.2]" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          {displayTitle}
        </h3>

        {/* Subtitle */}
        <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed px-2">
          {displayMessage}
        </p>

        {/* Action Buttons Column matching Screen 13 & 14 */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Primary Solid Blue Button */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('medium', hapticsEnabled);
              onConfirm();
            }}
            className="w-full py-3 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {displayConfirm}
          </button>

          {/* Secondary Outlined Blue Button */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('light', hapticsEnabled);
              onCancel();
            }}
            className="w-full py-2.5 px-6 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-sm shadow-2xs transition-all cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
