import React, { useState } from 'react';
import { ChevronLeft, Lock, Star, ThumbsUp } from 'lucide-react';
import { ALL_LEVELS } from '../game/levels';
import { SavedProgress } from '../game/types';
import { sound, triggerHaptic } from '../utils/audio';

interface LevelSelectModalProps {
  progress: SavedProgress;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

type FilterCategory = 'normal' | 'hard' | 'expert' | 'master' | 'ultra_pro' | 'ultra_pro_max';

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  progress,
  soundEnabled,
  hapticsEnabled,
  onSelectLevel,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('normal');
  const highest = progress.highestUnlockedLevel || 1;

  // Filter matching category
  const filteredLevels = ALL_LEVELS.filter((level) => {
    if (selectedFilter === 'normal') {
      return level.difficulty === 'tutorial' || level.difficulty === 'easy' || level.difficulty === 'medium';
    }
    return level.difficulty === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-[90vh] max-h-[700px] rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* Header matching Reference Screen 4 */}
        <div className="px-5 pt-4 pb-2 flex flex-col items-center relative border-b border-slate-100">
          {/* Back button */}
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('light', hapticsEnabled);
              onClose();
            }}
            className="absolute left-4 top-4 w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0077FE] shadow-2xs active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Title */}
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Select Level
          </h2>

          {/* Star count pill matching Screen 4: ⭐ 25/200 */}
          <div className="mt-1 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-black border border-amber-200/80">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{progress.totalStars || 25}/200</span>
          </div>
        </div>

        {/* 5-Column Levels Grid matching Reference Screen 4 */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-2.5">
          {filteredLevels.map((lvl) => {
            const isUnlocked = lvl.id <= highest;
            const levelProg = progress.levels[lvl.id];
            const isCompleted = levelProg?.completed || false;
            const isCurrent = lvl.id === highest;

            return (
              <button
                key={lvl.id}
                type="button"
                aria-label={`Level ${lvl.id}`}
                disabled={!isUnlocked}
                onClick={() => {
                  sound.playButton(soundEnabled);
                  triggerHaptic('light', hapticsEnabled);
                  onSelectLevel(lvl.id);
                }}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0077FE] text-white shadow-md shadow-blue-500/30 scale-105 font-black text-lg'
                    : isCompleted
                    ? 'bg-white border border-slate-200 shadow-2xs hover:border-blue-300 text-slate-800'
                    : isUnlocked
                    ? 'bg-white border border-slate-200 text-slate-700 font-bold'
                    : 'bg-[#F1F5F9] border border-slate-200/60 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                {isCurrent ? (
                  <span className="font-black text-base">{lvl.id}</span>
                ) : !isUnlocked ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-bold text-slate-400 leading-none">{lvl.id}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-bold leading-none">{lvl.id}</span>
                    <ThumbsUp className="w-3 h-3 text-blue-500 fill-blue-500 mt-0.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Difficulty Filter Pills matching Reference Screen 4 */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          {/* Row 1: Normal, Hard, Expert */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                setSelectedFilter('normal');
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black text-white text-center transition-all ${
                selectedFilter === 'normal'
                  ? 'bg-[#10B981] shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                  : 'bg-[#10B981]/80 hover:bg-[#10B981]'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                setSelectedFilter('hard');
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black text-white text-center transition-all ${
                selectedFilter === 'hard'
                  ? 'bg-[#06B6D4] shadow-md ring-2 ring-cyan-400/50 scale-[1.02]'
                  : 'bg-[#06B6D4]/80 hover:bg-[#06B6D4]'
              }`}
            >
              Hard
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                setSelectedFilter('expert');
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black text-white text-center transition-all ${
                selectedFilter === 'expert'
                  ? 'bg-[#8B5CF6] shadow-md ring-2 ring-purple-400/50 scale-[1.02]'
                  : 'bg-[#8B5CF6]/80 hover:bg-[#8B5CF6]'
              }`}
            >
              Expert
            </button>
          </div>

          {/* Row 2: Master, Ultra Pro, Ultra Pro Max */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                setSelectedFilter('master');
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black text-white text-center transition-all ${
                selectedFilter === 'master'
                  ? 'bg-[#F59E0B] shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                  : 'bg-[#F59E0B]/80 hover:bg-[#F59E0B]'
              }`}
            >
              Master
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                setSelectedFilter('ultra_pro');
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black text-white text-center transition-all ${
                selectedFilter === 'ultra_pro'
                  ? 'bg-[#EF4444] shadow-md ring-2 ring-rose-400/50 scale-[1.02]'
                  : 'bg-[#EF4444]/80 hover:bg-[#EF4444]'
              }`}
            >
              Ultra Pro
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playButton(soundEnabled);
                setSelectedFilter('ultra_pro_max');
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black text-white text-center transition-all ${
                selectedFilter === 'ultra_pro_max'
                  ? 'bg-[#0A1931] shadow-md ring-2 ring-slate-900/50 scale-[1.02]'
                  : 'bg-[#0A1931]/85 hover:bg-[#0A1931]'
              }`}
            >
              Ultra Pro Max
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
