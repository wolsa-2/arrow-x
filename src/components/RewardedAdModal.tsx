import React, { useState, useEffect, useRef } from 'react';
import { Heart, Tv, AlertCircle } from 'lucide-react';
import { admob, ADMOB_TEST_REWARDED_UNIT_ID, AdReward } from '../services/admobService';
import { sound, triggerHaptic } from '../utils/audio';
import { ECONOMY_CONFIG } from '../game/economy';

interface RewardedAdModalProps {
  rewardType: 'extra_life' | 'coins' | 'hint';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onRewardEarned: (reward: AdReward) => void;
  onClose: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  rewardType,
  soundEnabled,
  hapticsEnabled,
  onRewardEarned,
  onClose,
}) => {
  const [isPlayingAd, setIsPlayingAd] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const [isRewarded, setIsRewarded] = useState<boolean>(false);
  const [showSkipWarning, setShowSkipWarning] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const rewardAmount =
    rewardType === 'coins'
      ? ECONOMY_CONFIG.REWARDS.REWARDED_AD_COINS
      : ECONOMY_CONFIG.REWARDS.REWARDED_AD_LIVES;

  const startAdPlayback = async () => {
    sound.playButton(soundEnabled);
    triggerHaptic('medium', hapticsEnabled);

    // If native Capacitor Android is active, present native Google Rewarded Ad
    if (admob.isNative()) {
      setIsPlayingAd(true);
      const shown = await admob.showNativeRewardedAd(rewardType, rewardAmount, (reward) => {
        onRewardEarned(reward);
      });
      if (shown) {
        onClose();
        return;
      }
      setIsError(true);
      setErrorMessage(admob.getLastErrorMessage() || 'Ad failed to load. Please try again.');
      return;
    }

    // Web / Test simulation
    setIsPlayingAd(true);
    const started = admob.startAdSession(rewardType, rewardAmount, (reward) => {
      onRewardEarned(reward);
    });

    if (!started) {
      setIsError(true);
      setErrorMessage(admob.getLastErrorMessage() || 'Ad is currently unavailable.');
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleGrantReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGrantReward = () => {
    setIsRewarded(true);
    sound.playReward(soundEnabled);
    triggerHaptic('double', hapticsEnabled);
    admob.completeCurrentAdSession();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTryClose = () => {
    if (isPlayingAd && !isRewarded && secondsRemaining > 0) {
      setShowSkipWarning(true);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      admob.dismissCurrentAdSession();
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-[310px] rounded-3xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col items-center text-center text-slate-900 animate-in zoom-in-95 duration-150 relative">
        {/* Error State: User-Friendly Message */}
        {isError && (
          <div className="w-full flex flex-col items-center py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Ad Unavailable
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-5 px-2">
              {errorMessage || 'Test ad could not load. Please check your internet connection and try again.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsError(false);
                setIsPlayingAd(false);
                admob.preloadAd();
                onClose();
              }}
              className="py-2.5 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* State A: Initial Screen */}
        {!isPlayingAd && !isError && (
          <>
            {/* Visual Icon: Coin vs Heart */}
            <div className="relative my-4 flex items-center justify-center">
              {rewardType === 'coins' ? (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-amber-100/70 blur-xl animate-pulse" />
                  <div className="relative transform hover:scale-105 transition-transform duration-300 w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-xl text-white text-5xl font-black">
                    ★
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-rose-100/70 blur-xl animate-pulse" />
                  <div className="relative transform hover:scale-105 transition-transform duration-300">
                    <Heart className="w-24 h-24 text-[#EF4444] fill-[#EF4444] drop-shadow-xl" />
                  </div>
                </>
              )}
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              {rewardType === 'coins' ? `Get ${rewardAmount} Coins!` : `Get ${rewardAmount} Lives!`}
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed max-w-[210px]">
              {rewardType === 'coins'
                ? `Watch a rewarded ad to receive +${rewardAmount} coins.`
                : `Watch a rewarded ad to refill ${rewardAmount} lives.`}
            </p>

            {/* Action Buttons matching Reference Screen 10 */}
            <div className="w-full flex flex-col gap-2.5 mb-4">
              {/* Solid Blue Watch Ad button */}
              <button
                type="button"
                onClick={startAdPlayback}
                className="w-full py-3.5 px-6 rounded-full bg-[#0077FE] hover:bg-[#0066E0] active:scale-95 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Tv className="w-4 h-4 text-white" />
                <span>Watch Ad</span>
              </button>

              {/* Outlined Blue No Thanks button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-6 rounded-full bg-white border-2 border-[#0077FE] hover:bg-blue-50/50 active:scale-95 text-[#0077FE] font-extrabold text-sm shadow-2xs transition-all cursor-pointer"
              >
                No Thanks
              </button>
            </div>

            {/* Fine print matching Screen 10 */}
            <p className="text-[10px] text-slate-400 font-medium">
              Reward will be granted after ad completion.
            </p>
          </>
        )}

        {/* State B: Ad Playback Simulation */}
        {isPlayingAd && !isRewarded && !isError && (
          <div className="w-full flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0077FE] flex items-center justify-center mb-4">
              <Tv className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Playing Google AdMob Test Ad
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Unit: {ADMOB_TEST_REWARDED_UNIT_ID.slice(-10)}
            </p>

            {/* 5-second countdown circular timer */}
            <div className="w-20 h-20 rounded-full border-4 border-[#0077FE] border-t-transparent animate-spin flex items-center justify-center mb-4">
              <span className="text-xl font-black text-[#0077FE] transform -rotate-45">
                {secondsRemaining}s
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-4">
              Please watch the full ad to earn your reward.
            </p>

            <button
              type="button"
              onClick={handleTryClose}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
            >
              Skip Ad
            </button>
          </div>
        )}

        {/* State C: Reward Granted Celebration */}
        {isRewarded && (
          <div className="w-full flex flex-col items-center py-6 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
              {rewardType === 'coins' ? (
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-black shadow-xs">
                  ★
                </div>
              ) : (
                <Heart className="w-10 h-10 fill-rose-500 text-rose-500 animate-bounce" />
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {rewardType === 'coins' ? `+${rewardAmount} Coins Earned!` : `+${rewardAmount} Lives Earned!`}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {rewardType === 'coins' ? 'Coins added to your balance.' : 'Resuming your puzzle with full lives...'}
            </p>
          </div>
        )}

        {/* Skip Warning Modal */}
        {showSkipWarning && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl p-5 flex flex-col items-center justify-center text-center z-20">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <h4 className="font-bold text-sm text-slate-900 mb-1">
              Skip Ad Early?
            </h4>
            <p className="text-xs text-slate-500 mb-4 px-2">
              If you leave now, you will not receive your {rewardType === 'coins' ? `${rewardAmount} coins` : `${rewardAmount} lives`}!
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowSkipWarning(false)}
                className="flex-1 py-2 rounded-xl bg-[#0077FE] text-white text-xs font-bold"
              >
                Continue Ad
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSkipWarning(false);
                  onClose();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
              >
                Skip Anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
