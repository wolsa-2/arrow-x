import React, { useState, useEffect } from 'react';
import { Heart, Tv, Loader2 } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';
import { ECONOMY_CONFIG } from '../game/economy';
import { admob, AdState } from '../services/admobService';

interface GameOverModalProps {
  levelId: number;
  coins: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onWatchAdForLife: () => void;
  onRefillWithCoins: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  levelId,
  coins,
  soundEnabled,
  hapticsEnabled,
  onWatchAdForLife,
  onRefillWithCoins,
  onRestart,
  onHome,
}) => {
  const [adState, setAdState] = useState<AdState>(() => admob.getState());

  useEffect(() => {
    // If ad is idle, start loading in the background
    if (adState === 'idle' || adState === 'failed') {
      admob.preloadAd();
    }
    const unsubscribe = admob.addListener((newState) => {
      setAdState(newState);
    });
    return unsubscribe;
  }, []);

  const isAdLoading = adState === 'loading';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="w-full max-w-[290px] rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-center text-slate-900 animate-in zoom-in-95 duration-150">
        {/* 3 Grey Depleted Hearts matching Reference Screen 7 */}
        <div className="flex items-center justify-center gap-2 mb-4 pt-2">
          {[1, 2, 3].map((index) => (
            <Heart
              key={index}
              className="w-10 h-10 text-slate-400 fill-slate-400 drop-shadow-sm opacity-90"
            />
          ))}
        </div>

        {/* Title: Bold Red "Game Over" matching Reference Screen 7 */}
        <h2 className="text-3xl font-black text-[#EF4444] tracking-tight mb-2">
          Game Over
        </h2>

        {/* Subtext */}
        <p className="text-sm font-bold text-slate-800 leading-snug">
          No more lives!
        </p>
        <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed max-w-[200px]">
          Refill your lives or watch an ad to get 3 lives.
        </p>

        {/* Action Buttons Column matching Reference Screen 7 */}
        <div className="w-full flex flex-col gap-2.5">
          {/* 1. Solid Blue Button: Watch Ad +3 Lives (Google AdMob Rewarded Video) */}
          <button
            type="button"
            disabled={isAdLoading}
            onClick={() => {
              if (isAdLoading) return;
              sound.playButton(soundEnabled);
              triggerHaptic('medium', hapticsEnabled);
              onWatchAdForLife();
            }}
            className={`w-full py-3.5 px-6 rounded-full font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              isAdLoading
                ? 'bg-[#0077FE]/60 text-white cursor-not-allowed shadow-none'
                : 'bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white shadow-blue-500/25 cursor-pointer'
            }`}
          >
            {isAdLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Loading Ad...</span>
              </>
            ) : (
              <>
                <Tv className="w-4 h-4 text-white" />
                <span>Watch Ad</span>
                <span className="text-white/90 font-medium text-xs ml-1">+3 Lives</span>
              </>
            )}
          </button>

          {/* 2. Refill with 200 Coins Button */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('medium', hapticsEnabled);
              onRefillWithCoins();
            }}
            className="w-full py-2.5 px-4 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Refill 3 Lives</span>
            <span className="bg-amber-700/40 px-2 py-0.5 rounded-full text-[11px] font-bold">
              {ECONOMY_CONFIG.GAME_OVER.REFILL_3_LIVES_COINS} Coins
            </span>
          </button>

          {/* 3. Outlined Blue Button: Main Menu */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('light', hapticsEnabled);
              onHome();
            }}
            className="w-full py-2.5 px-6 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-sm shadow-2xs transition-all cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
