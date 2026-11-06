import React from 'react';
import { X, Calendar, Play, CheckCircle2 } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';
import { SavedProgress, UserSettings } from '../game/types';
import { getLocalDateString } from '../utils/storage';

interface DailyChallengeModalProps {
  progress: SavedProgress;
  settings: UserSettings;
  onStartDaily: () => void;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  progress,
  settings,
  onStartDaily,
  onClose,
}) => {
  const todayStr = getLocalDateString();
  const isDoneToday = progress.dailyChallengeDate === todayStr && progress.dailyChallengeCompleted;

  const formattedDate = new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xs rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-center text-slate-900">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Daily Puzzle</h2>
          </div>
          <button
            type="button"
            aria-label="Close daily challenge"
            onClick={() => {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('light', settings.hapticsEnabled);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-transform active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Display */}
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 mb-3 flex items-center justify-center shadow-inner">
          <Calendar className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-black text-slate-900">{formattedDate}</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
          Solve today's unique winding arrow challenge with 3 Hearts!
        </p>

        {/* Action Button */}
        {isDoneToday ? (
          <div className="w-full p-3.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed for Today!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('medium', settings.hapticsEnabled);
              onStartDaily();
            }}
            className="w-full py-3.5 rounded-full font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Daily Challenge</span>
          </button>
        )}
      </div>
    </div>
  );
};
