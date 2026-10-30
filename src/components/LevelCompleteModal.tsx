import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, RotateCcw, Home } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';

interface LevelCompleteModalProps {
  levelId: number;
  levelName: string;
  stars: number; // 1, 2, or 3
  moves: number;
  parMoves: number;
  timeSeconds: number;
  hasNextLevel: boolean;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
  onHome: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelId,
  stars,
  moves,
  parMoves,
  soundEnabled,
  hapticsEnabled,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#0077FE', '#3B82F6', '#EF4444', '#F59E0B', '#10B981'],
      });
    } catch {}
  }, []);

  const earnedCoins = stars === 3 ? 50 : stars === 2 ? 30 : 20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-[310px] rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-center relative animate-in zoom-in-95 duration-150">
        {/* 3 Arched Golden Stars matching Reference Screen 6 */}
        <div className="flex items-end justify-center gap-2 mb-2 pt-2">
          {/* Star 1 (Left) */}
          <div className="transform -rotate-12 translate-y-1">
            <Star
              className={`w-10 h-10 drop-shadow-md ${
                stars >= 1
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 fill-slate-200'
              }`}
            />
          </div>

          {/* Star 2 (Center - elevated and larger) */}
          <div className="transform -translate-y-2">
            <Star
              className={`w-14 h-14 drop-shadow-lg ${
                stars >= 2
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 fill-slate-200'
              }`}
            />
          </div>

          {/* Star 3 (Right) */}
          <div className="transform rotate-12 translate-y-1">
            <Star
              className={`w-10 h-10 drop-shadow-md ${
                stars >= 3
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 fill-slate-200'
              }`}
            />
          </div>
        </div>

        {/* Curved / Ribbon Banner "Level Completed!" matching Reference Screen 6 */}
        <div className="w-full relative my-2 flex justify-center">
          <div className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#0052CC] via-[#0077FE] to-[#0052CC] text-white font-black text-lg tracking-tight shadow-md flex items-center justify-center">
            <span>Level Completed!</span>
          </div>
        </div>

        {/* Level Number and Difficulty Badge */}
        <div className="flex flex-col items-center gap-1 my-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Level {levelId}
          </h3>
          <div className="px-3.5 py-0.5 rounded-full bg-[#0077FE] text-white text-[11px] font-extrabold uppercase tracking-wider">
            Normal
          </div>
        </div>

        {/* Gold Coin Reward Pill matching Reference Screen 6 */}
        <div className="flex items-center gap-2 my-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
            ★
          </div>
          <span className="font-black text-amber-800 text-base">
            +{earnedCoins}
          </span>
        </div>

        {/* Tag: New High Score! matching Reference Screen 6 */}
        <div className="px-3 py-0.5 rounded-full bg-blue-50 text-[#0077FE] text-[11px] font-bold border border-blue-200 mb-5">
          New High Score!
        </div>

        {/* Primary Action Button: Next Level (Solid Blue Pill) */}
        <button
          type="button"
          onClick={() => {
            sound.playButton(soundEnabled);
            triggerHaptic('medium', hapticsEnabled);
            onNextLevel();
          }}
          className="w-full py-3.5 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-base shadow-lg shadow-blue-500/25 transition-all cursor-pointer mb-3"
        >
          Next Level
        </button>

        {/* Bottom Secondary Action Buttons Row matching Screen 6 */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Home Button (Outlined Blue Pill) */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('light', hapticsEnabled);
              onHome();
            }}
            className="py-2.5 px-4 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4 stroke-[2.2]" />
            <span>Home</span>
          </button>

          {/* Replay Button (Outlined Blue Pill) */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('light', hapticsEnabled);
              onReplay();
            }}
            className="py-2.5 px-4 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.2]" />
            <span>Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
