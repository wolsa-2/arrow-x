import React, { useEffect } from 'react';
import { Play, Settings as SettingsIcon, ShoppingBag, Gift, HelpCircle } from 'lucide-react';
import { SavedProgress, UserSettings } from '../game/types';
import { sound, triggerHaptic } from '../utils/audio';
import { getLocalDateString } from '../utils/storage';

interface HomeViewProps {
  progress: SavedProgress;
  settings: UserSettings;
  onPlay: (levelId: number) => void;
  onOpenLevelSelect: () => void;
  onOpenShop: () => void;
  onOpenDailyRewards: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay?: () => void;
}

const HomeViewComponent: React.FC<HomeViewProps> = ({
  progress,
  settings,
  onPlay,
  onOpenLevelSelect,
  onOpenShop,
  onOpenDailyRewards,
  onOpenSettings,
  onOpenHowToPlay,
}) => {
  const currentLevel = progress.highestUnlockedLevel || 1;
  const todayStr = getLocalDateString();
  const canClaimDailyReward = progress.lastClaimDate !== todayStr;

  // Keyboard shortcut to play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.playButton(settings.soundEnabled);
        triggerHaptic('light', settings.hapticsEnabled);
        onPlay(currentLevel);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLevel, onPlay, settings]);

  return (
    <div className="relative w-full h-full bg-white text-slate-900 select-none flex flex-col justify-between p-5 sm:p-6">
      {/* Top Header matching Reference Screen 2 */}
      <header className="w-full flex items-center justify-between z-10 pt-2">
        {/* Left: Gold Coin Pill */}
        <button
          type="button"
          aria-label={`Coins: ${progress.coins ?? 100}. Open Shop`}
          onClick={() => {
            sound.playButton(settings.soundEnabled);
            triggerHaptic('light', settings.hapticsEnabled);
            onOpenShop();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFDF5] border border-amber-200/90 shadow-2xs hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-xs text-white text-xs font-black">
            ★
          </div>
          <span className="font-extrabold text-sm text-slate-800 tracking-tight">
            {progress.coins ?? 100}
          </span>
        </button>

        {/* Right: Blue outlined gear icon */}
        <button
          type="button"
          aria-label="Settings"
          onClick={() => {
            sound.playButton(settings.soundEnabled);
            triggerHaptic('light', settings.hapticsEnabled);
            onOpenSettings();
          }}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-blue-400 text-[#0077FE] flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
        >
          <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
        </button>
      </header>

      {/* Center Branding & Action Buttons matching Reference Screen 2 */}
      <main className="w-full my-auto flex flex-col items-center justify-center text-center px-4">
        {/* ARROW X Logo matching Reference */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0077FE] fill-current">
              <path d="M4 12 L14 4 L14 9 L20 9 L20 15 L14 15 L14 20 Z" />
            </svg>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A1931]">
              ARROW <span className="text-[#0077FE]">X</span>
            </h1>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0077FE] fill-current">
              <path d="M20 12 L10 4 L10 9 L4 9 L4 15 L10 15 L10 20 Z" />
            </svg>
          </div>
          <span className="text-xs font-black tracking-[0.28em] text-slate-400 mt-1 uppercase">
            Escape Puzzle
          </span>
        </div>

        {/* Action Button: Single Solid Blue Play Button with Redesigned Level Badge below */}
        <div className="w-full max-w-[260px] flex flex-col items-center gap-3 sm:gap-3.5 mb-6">
          {/* Primary Solid Blue Play Button */}
          <button
            type="button"
            data-start="true"
            aria-label={`Play Level ${currentLevel}`}
            onClick={() => {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('medium', settings.hapticsEnabled);
              onPlay(currentLevel);
            }}
            className="w-full py-4 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-lg shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
            <Play className="w-5 h-5 fill-white text-white" />
            <span>Play</span>
          </button>

          {/* Redesigned Level Indicator Capsule Badge */}
          <button
            type="button"
            aria-label={`Current Level: Level ${currentLevel}. Tap to open level select.`}
            onClick={() => {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('light', settings.hapticsEnabled);
              onOpenLevelSelect();
            }}
            className="inline-flex items-center justify-center px-4 sm:px-5 py-1.5 rounded-full bg-[#EAF3FB] border border-[#BFDBFE] text-[#0A1931] shadow-2xs hover:bg-[#E1EDF9] hover:border-[#93C5FD] active:scale-95 transition-all cursor-pointer select-none"
          >
            <span className="font-extrabold text-xs sm:text-sm text-[#0A1931] tracking-tight">
              Level {currentLevel}
            </span>
          </button>
        </div>
      </main>

      {/* Bottom 3 Circular Icon Action Cards matching Reference Screen 2 */}
      <footer className="w-full flex items-center justify-center gap-8 pb-3 z-10">
        {/* Shop Button */}
        <button
          type="button"
          aria-label="Shop"
          onClick={() => {
            sound.playButton(settings.soundEnabled);
            triggerHaptic('light', settings.hapticsEnabled);
            onOpenShop();
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EAF3FB] group-hover:bg-[#DEECF9] group-active:scale-90 text-[#0077FE] flex items-center justify-center shadow-xs transition-all">
            <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-700 group-hover:text-[#0077FE]">
            Shop
          </span>
        </button>

        {/* Daily Reward Button */}
        <button
          type="button"
          aria-label="Daily Reward"
          onClick={() => {
            sound.playButton(settings.soundEnabled);
            triggerHaptic('light', settings.hapticsEnabled);
            onOpenDailyRewards();
          }}
          className="relative flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EAF3FB] group-hover:bg-[#DEECF9] group-active:scale-90 text-[#0077FE] flex items-center justify-center shadow-xs transition-all">
            <Gift className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-700 group-hover:text-[#0077FE]">
            Daily Reward
          </span>
          {canClaimDailyReward && (
            <span className="absolute top-0 right-2 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Tutorial Button */}
        <button
          type="button"
          aria-label="Tutorial"
          onClick={() => {
            if (onOpenHowToPlay) {
              sound.playButton(settings.soundEnabled);
              triggerHaptic('light', settings.hapticsEnabled);
              onOpenHowToPlay();
            }
          }}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EAF3FB] group-hover:bg-[#DEECF9] group-active:scale-90 text-[#0077FE] flex items-center justify-center shadow-xs transition-all">
            <HelpCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-700 group-hover:text-[#0077FE]">
            Tutorial
          </span>
        </button>
      </footer>
    </div>
  );
};

export const HomeView = React.memo(HomeViewComponent);

