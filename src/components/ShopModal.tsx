import React from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Undo2, Coins } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';
import { ECONOMY_CONFIG } from '../game/economy';

interface ShopModalProps {
  coins: number;
  hintsCount: number;
  bombsCount: number;
  undosCount: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onBuyItem: (item: 'hints' | 'bomb' | 'undos' | 'hearts', cost: number) => boolean;
  onWatchAdForCoins: () => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  soundEnabled,
  hapticsEnabled,
  onBuyItem,
  onWatchAdForCoins,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl p-5 sm:p-6 bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900 max-h-[88vh] overflow-hidden">
        {/* Header matching Reference Screen 9 */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-3.5">
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('light', hapticsEnabled);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0077FE] shadow-2xs active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Shop
          </h2>

          {/* Coins Pill matching Screen 9 */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0077FE] text-white font-black text-xs shadow-xs">
            <span className="text-amber-300">★</span>
            <span>{coins}</span>
          </div>
        </div>

        {/* Shop Items List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 py-1">
          {/* Item 1: Hint - 50 Coins */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#EAF3FB] text-[#0077FE] flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                  Hint
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                  Show a solution hint (+{ECONOMY_CONFIG.SHOP_GRANTS.HINT_COUNT})
                </p>
                <div className="flex items-center gap-1 mt-1 text-amber-500 font-extrabold text-xs">
                  <span>★</span>
                  <span>{ECONOMY_CONFIG.SHOP_PRICES.HINT}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const ok = onBuyItem('hints', ECONOMY_CONFIG.SHOP_PRICES.HINT);
                if (ok) {
                  sound.playCoin(soundEnabled);
                  triggerHaptic('double', hapticsEnabled);
                } else {
                  sound.playBlocked(soundEnabled);
                  triggerHaptic('heavy', hapticsEnabled);
                }
              }}
              className="py-1.5 px-4 rounded-xl bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              Buy
            </button>
          </div>

          {/* Item 2: Undo - 100 Coins */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#EAF3FB] text-[#0077FE] flex items-center justify-center shrink-0">
                <Undo2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                  Undo
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                  Undo your last move (+{ECONOMY_CONFIG.SHOP_GRANTS.UNDO_COUNT})
                </p>
                <div className="flex items-center gap-1 mt-1 text-amber-500 font-extrabold text-xs">
                  <span>★</span>
                  <span>{ECONOMY_CONFIG.SHOP_PRICES.UNDO}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const ok = onBuyItem('undos', ECONOMY_CONFIG.SHOP_PRICES.UNDO);
                if (ok) {
                  sound.playCoin(soundEnabled);
                  triggerHaptic('double', hapticsEnabled);
                } else {
                  sound.playBlocked(soundEnabled);
                  triggerHaptic('heavy', hapticsEnabled);
                }
              }}
              className="py-1.5 px-4 rounded-xl bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              Buy
            </button>
          </div>

          {/* Item 4: Get More Coins (Rewarded Ad: +50 Coins) matching Reference Screen 9 */}
          <button
            type="button"
            onClick={() => {
              sound.playButton(soundEnabled);
              triggerHaptic('medium', hapticsEnabled);
              onWatchAdForCoins();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-2xs hover:bg-amber-100/70 active:scale-98 transition-all cursor-pointer mt-1"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Coins className="w-6 h-6 fill-white" />
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-black text-sm text-amber-900 leading-tight">
                  Get More Coins
                </h3>
                <p className="text-[11px] text-amber-700/80 font-semibold leading-tight mt-0.5">
                  Watch rewarded ad (+{ECONOMY_CONFIG.REWARDS.REWARDED_AD_COINS} Coins)
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-amber-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
