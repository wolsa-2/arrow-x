import React from 'react';
import confetti from 'canvas-confetti';
import { ChevronLeft, Check, Heart } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/audio';
import { ECONOMY_CONFIG } from '../game/economy';
import { getLocalDateString } from '../utils/storage';

interface DailyRewardsModalProps {
  streak: number;
  lastClaimDate?: string;
  claimedDays?: number[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onClaimDay: (dayIndex: number, reward: { coins: number; hints: number; bombs: number; undos: number }) => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  streak,
  lastClaimDate,
  claimedDays = [],
  soundEnabled,
  hapticsEnabled,
  onClaimDay,
  onClose,
}) => {
  const todayStr = getLocalDateString();
  const isClaimedToday = lastClaimDate === todayStr;

  // Active day in 7-day cycle (0 to 6)
  const currentDayIndex = streak % 7;

  const dailyCoins = ECONOMY_CONFIG.REWARDS.DAILY_LOGIN_COINS;

  // Reward schedule with standardized +25 Coins Daily Login Bonus
  const rewardSchedule = [
    { day: 1, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
    { day: 2, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
    { day: 3, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
    { day: 4, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
    { day: 5, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
    { day: 6, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
    { day: 7, rewardText: `+${dailyCoins}`, coins: dailyCoins, isHeart: false },
  ];

  const handleClaim = () => {
    if (isClaimedToday) return;

    sound.playReward(soundEnabled);
    triggerHaptic('double', hapticsEnabled);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0077FE', '#3B82F6', '#EF4444', '#F59E0B'],
      });
    } catch {}

    onClaimDay(currentDayIndex, {
      coins: dailyCoins,
      hints: 0,
      bombs: 0,
      undos: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl p-5 sm:p-6 bg-white border border-slate-200 shadow-2xl flex flex-col text-slate-900 max-h-[85vh] overflow-hidden">
        {/* Header matching Reference Screen 12 */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-1 relative">
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
            Daily Rewards
          </h2>

          <div className="w-9" />
        </div>

        {/* Subtitle */}
        <p className="text-xs font-semibold text-slate-500 text-center mb-5">
          Log in every day for amazing rewards!
        </p>

        {/* 7-Day Grid matching Reference Screen 12 */}
        <div className="flex-1 flex flex-col justify-center gap-3.5 mb-6">
          {/* Row 1: Days 1 to 4 */}
          <div className="grid grid-cols-4 gap-2">
            {rewardSchedule.slice(0, 4).map((item, idx) => {
              const isPast = idx < currentDayIndex || (idx === currentDayIndex && isClaimedToday);
              const isCurrent = idx === currentDayIndex && !isClaimedToday;

              return (
                <div
                  key={item.day}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-between border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/60 border-[#0077FE] shadow-md ring-2 ring-blue-500/20'
                      : isPast
                      ? 'bg-[#F8FAFC] border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500 text-white leading-tight">
                    Day {item.day}
                  </span>

                  <div className="my-2.5 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                      ★
                    </div>
                  </div>

                  <span className="text-xs font-black text-slate-800">
                    {item.rewardText}
                  </span>

                  {isPast && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mt-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Row 2: Days 5 to 7 */}
          <div className="grid grid-cols-3 gap-2 px-3">
            {rewardSchedule.slice(4, 7).map((item, sliceIdx) => {
              const idx = sliceIdx + 4;
              const isPast = idx < currentDayIndex || (idx === currentDayIndex && isClaimedToday);
              const isCurrent = idx === currentDayIndex && !isClaimedToday;

              return (
                <div
                  key={item.day}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-between border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/60 border-[#0077FE] shadow-md ring-2 ring-blue-500/20'
                      : isPast
                      ? 'bg-[#F8FAFC] border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-500 text-white leading-tight">
                    Day {item.day}
                  </span>

                  <div className="my-2.5 flex items-center justify-center">
                    {item.isHeart ? (
                      <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                        ★
                      </div>
                    )}
                  </div>

                  <span className={`text-xs font-black ${item.isHeart ? 'text-rose-600' : 'text-slate-800'}`}>
                    {item.rewardText}
                  </span>

                  {isPast && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center mt-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Large Solid Blue Claim Button matching Reference Screen 12 */}
        <button
          type="button"
          disabled={isClaimedToday}
          onClick={handleClaim}
          className={`w-full py-3.5 px-6 rounded-full font-extrabold text-sm shadow-md transition-all ${
            !isClaimedToday
              ? 'bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white shadow-blue-500/25 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isClaimedToday ? 'Claimed for Today' : 'Claim Reward'}
        </button>
      </div>
    </div>
  );
};
