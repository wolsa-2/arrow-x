import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LevelData, SavedProgress, UserSettings } from './game/types';
import { getLevelById, ALL_LEVELS, TOTAL_LEVELS_COUNT, cloneLevel } from './game/levels';
import { generateSolvableLevel } from './game/levelGenerator';
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  resetAllProgress,
} from './utils/storage';
import { sound } from './utils/audio';
import { admob, AdReward } from './services/admobService';

import { SplashView } from './components/SplashView';
import { HomeView } from './components/HomeView';
import { GameView } from './components/GameView';
import { PauseModal } from './components/PauseModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { ShopModal } from './components/ShopModal';
import { GameOverModal } from './components/GameOverModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { NetworkStatusToast, ToastMessage } from './components/NetworkStatusToast';
import { StatusDialog, StatusDialogType } from './components/StatusDialogs';

export default function App() {
  const [screen, setScreen] = useState<'splash' | 'home' | 'playing'>('splash');
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [progress, setProgress] = useState<SavedProgress>(() => loadProgress());

  // Active level & gameplay session state
  const [activeLevelId, setActiveLevelId] = useState<number>(() => {
    return progress.highestUnlockedLevel || 1;
  });
  const [gameSessionId, setGameSessionId] = useState<number>(0);
  const [isDailyActive, setIsDailyActive] = useState<boolean>(false);
  const [hearts, setHearts] = useState<number>(() => {
    return typeof progress.hearts === 'number' ? Math.max(0, Math.min(3, progress.hearts)) : 3;
  });

  // Guard to prevent duplicate rapid restarts or overlapping operations
  const isRestartingRef = useRef<boolean>(false);

  // Modals & Screens
  const [isPaused, setIsPaused] = useState(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [rewardedAdConfig, setRewardedAdConfig] = useState<{
    rewardType: 'extra_life' | 'coins' | 'hint';
  } | null>(null);

  const [statusDialog, setStatusDialog] = useState<StatusDialogType | null>(null);

  // Online / Offline state detection (Screen 15)
  useEffect(() => {
    const handleOffline = () => setStatusDialog('no_internet');
    const handleOnline = () => {
      setStatusDialog(null);
      addToast('Back online!', 'success');
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [completedResult, setCompletedResult] = useState<{
    stars: number;
    moves: number;
    timeSeconds: number;
  } | null>(null);

  // Helper to push toasts
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check URL query parameters (?autostart=1 or ?level=N)
  const queryParams = useMemo(() => {
    if (typeof window === 'undefined') return { autostart: false, level: null };
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1' || params.get('start') === '1';
    const levelParam = params.get('level');
    const level = levelParam ? parseInt(levelParam, 10) : null;
    return { autostart, level };
  }, []);

  // Compute daily puzzle lazily only when playing daily challenge
  const getDailyLevel = useCallback((): LevelData => {
    const today = new Date();
    const dateNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return generateSolvableLevel(999000 + (dateNum % 500), 5, 5, 8, 1, 'medium');
  }, []);

  // Active level data (always fresh deep copy)
  const currentLevelData = useMemo<LevelData>(() => {
    if (isDailyActive) {
      return cloneLevel(getDailyLevel());
    }
    return getLevelById(activeLevelId);
  }, [activeLevelId, getDailyLevel, isDailyActive, gameSessionId]);

  // Handle autostart on mount
  useEffect(() => {
    if (queryParams.autostart) {
      const targetLevel = queryParams.level || progress.highestUnlockedLevel || 1;
      setActiveLevelId(targetLevel);
      setHearts((h) => (h > 0 ? h : 3));
      setGameSessionId((prev) => prev + 1);
      setScreen('playing');
      document.body.dataset.state = 'playing';
    }
  }, [queryParams, progress.highestUnlockedLevel]);

  // Sync ambient music state
  useEffect(() => {
    if (settings.musicEnabled) {
      sound.setMusic(true);
    } else {
      sound.setMusic(false);
    }
  }, [settings.musicEnabled]);

  // Passive life regeneration (1 life per 5 minutes when depleted)
  useEffect(() => {
    if (hearts >= 3) return;
    const interval = setInterval(() => {
      setHearts((currentHearts) => {
        if (currentHearts >= 3) return 3;
        const nextHearts = currentHearts + 1;
        setProgress((prev) => {
          const next = { ...prev, hearts: nextHearts, lastHeartLossTime: nextHearts >= 3 ? undefined : Date.now() };
          saveProgress(next);
          return next;
        });
        addToast('+1 Life Regenerated!', 'info');
        return nextHearts;
      });
    }, 300000);
    return () => clearInterval(interval);
  }, [hearts, addToast]);

  // Centralized, rock-solid restart function for Replay & Restart Level
  const restartCurrentLevel = useCallback(() => {
    if (isRestartingRef.current) return;
    isRestartingRef.current = true;
    setTimeout(() => {
      isRestartingRef.current = false;
    }, 250);

    // Close all game modals
    setIsPaused(false);
    setCompletedResult(null);
    setIsGameOverOpen(false);
    setIsLevelSelectOpen(false);
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setIsDailyOpen(false);
    setIsDailyRewardsOpen(false);
    setIsShopOpen(false);
    setRewardedAdConfig(null);

    // If hearts are 0, prompt game over refill instead of continuing without lives
    if (hearts <= 0) {
      setIsGameOverOpen(true);
      addToast('No lives remaining! Watch an ad or refill.', 'warning');
      return;
    }

    // Increment game session ID to guarantee a completely new GameView instance
    setGameSessionId((prev) => prev + 1);
    setScreen('playing');
    document.body.dataset.state = 'playing';
  }, [addToast, hearts]);

  // Start playing a specific level
  const handleStartLevel = useCallback(
    (lvlId: number) => {
      if (isRestartingRef.current) return;
      isRestartingRef.current = true;
      setTimeout(() => {
        isRestartingRef.current = false;
      }, 250);

      if (hearts <= 0) {
        setIsGameOverOpen(true);
        addToast('No lives remaining! Watch an ad or refill.', 'warning');
        return;
      }
      setActiveLevelId(lvlId);
      setIsDailyActive(false);
      setIsPaused(false);
      setIsGameOverOpen(false);
      setCompletedResult(null);
      setIsLevelSelectOpen(false);
      setIsSettingsOpen(false);
      setIsHowToPlayOpen(false);
      setIsDailyOpen(false);
      setIsDailyRewardsOpen(false);
      setIsShopOpen(false);
      setRewardedAdConfig(null);

      // Trigger fresh instance
      setGameSessionId((prev) => prev + 1);
      setScreen('playing');
      document.body.dataset.state = 'playing';
    },
    [hearts, addToast]
  );

  // Start daily challenge puzzle
  const handleStartDaily = useCallback(() => {
    if (isRestartingRef.current) return;
    isRestartingRef.current = true;
    setTimeout(() => {
      isRestartingRef.current = false;
    }, 250);

    if (hearts <= 0) {
      setIsGameOverOpen(true);
      addToast('No lives remaining! Watch an ad or refill.', 'warning');
      return;
    }
    setIsDailyActive(true);
    setIsDailyOpen(false);
    setIsPaused(false);
    setIsGameOverOpen(false);
    setCompletedResult(null);
    setIsLevelSelectOpen(false);
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setIsDailyRewardsOpen(false);
    setIsShopOpen(false);
    setRewardedAdConfig(null);

    setGameSessionId((prev) => prev + 1);
    setScreen('playing');
    document.body.dataset.state = 'playing';
  }, [hearts, addToast]);

  // Resume active game session from Pause Screen
  const handleResume = useCallback(() => {
    // Only resume if level is still active and not completed
    if (completedResult !== null || screen !== 'playing') {
      setIsPaused(false);
      return;
    }
    setIsPaused(false);
  }, [completedResult, screen]);

  // Handle heart lost during play
  const handleHeartLost = useCallback((remainingHearts: number) => {
    const clamped = Math.max(0, Math.min(3, remainingHearts));
    setHearts(clamped);
    setProgress((prev) => {
      const next = {
        ...prev,
        hearts: clamped,
        lastHeartLossTime: clamped === 0 ? Date.now() : prev.lastHeartLossTime,
      };
      saveProgress(next);
      return next;
    });
  }, []);

  // Handle Game Over (0 lives reached)
  const handleGameOver = useCallback(() => {
    setIsGameOverOpen(true);
  }, []);

  // Handle level completion
  const handleLevelComplete = useCallback(
    (stars: number, moves: number, timeSeconds: number) => {
      setCompletedResult({ stars, moves, timeSeconds });

      if (isDailyActive) {
        const todayStr = new Date().toISOString().split('T')[0];
        setProgress((prev) => {
          const next = {
            ...prev,
            coins: (prev.coins ?? 100) + 50,
            dailyChallengeDate: todayStr,
            dailyChallengeCompleted: true,
          };
          saveProgress(next);
          return next;
        });
        addToast(`Daily Challenge Solved! +50 Coins`, 'success');
        return;
      }

      // Update regular level progress
      setProgress((prev) => {
        const existing = prev.levels[activeLevelId];
        const prevStars = existing?.stars || 0;
        const newStars = Math.max(prevStars, stars);
        const starDiff = newStars - prevStars;

        const nextHighest = Math.max(
          prev.highestUnlockedLevel,
          Math.min(TOTAL_LEVELS_COUNT, activeLevelId + 1)
        );

        const nextProgress: SavedProgress = {
          ...prev,
          highestUnlockedLevel: nextHighest,
          totalStars: prev.totalStars + starDiff,
          levels: {
            ...prev.levels,
            [activeLevelId]: {
              levelId: activeLevelId,
              completed: true,
              stars: newStars,
              bestMoves: existing?.bestMoves ? Math.min(existing.bestMoves, moves) : moves,
              bestTimeSeconds: existing?.bestTimeSeconds
                ? Math.min(existing.bestTimeSeconds, timeSeconds)
                : timeSeconds,
            },
          },
        };

        saveProgress(nextProgress);
        return nextProgress;
      });

      addToast('Level Cleared!', 'success');
    },
    [activeLevelId, addToast, isDailyActive]
  );

  // Advance to next level
  const handleNextLevel = useCallback(() => {
    setCompletedResult(null);
    if (isDailyActive) {
      handleReturnHome();
      return;
    }
    const nextId = activeLevelId + 1;
    if (nextId <= TOTAL_LEVELS_COUNT) {
      handleStartLevel(nextId);
    } else {
      handleReturnHome();
    }
  }, [activeLevelId, handleStartLevel, isDailyActive]);

  // Update settings
  const handleUpdateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  // Reset progress
  const handleResetProgress = useCallback(() => {
    const fresh = resetAllProgress();
    setProgress(fresh);
    setActiveLevelId(1);
    setHearts(3);
    setGameSessionId((prev) => prev + 1);
    setIsSettingsOpen(false);
    addToast('Progress reset successfully', 'info');
  }, [addToast]);

  // Return to home
  const handleReturnHome = useCallback(() => {
    setIsPaused(false);
    setIsGameOverOpen(false);
    setCompletedResult(null);
    setIsLevelSelectOpen(false);
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setIsDailyOpen(false);
    setIsDailyRewardsOpen(false);
    setIsShopOpen(false);
    setRewardedAdConfig(null);
    setScreen('home');
    document.body.dataset.state = 'title';
  }, []);

  // Buy Shop Items
  const handleBuyShopItem = useCallback(
    (item: 'hints' | 'bomb' | 'undos' | 'hearts', cost: number): boolean => {
      if ((progress.coins ?? 0) < cost) {
        addToast('Not enough coins!', 'warning');
        return false;
      }

      setProgress((prev) => {
        const nextCoins = prev.coins - cost;
        let nextHints = prev.hintsCount ?? 3;
        let nextBombs = prev.bombsCount ?? 1;
        let nextUndos = prev.undosCount ?? 3;

        if (item === 'hints') nextHints += 3;
        else if (item === 'bomb') nextBombs += 1;
        else if (item === 'undos') nextUndos += 5;
        else if (item === 'hearts') setHearts(3);

        const next: SavedProgress = {
          ...prev,
          coins: nextCoins,
          hintsCount: nextHints,
          bombsCount: nextBombs,
          undosCount: nextUndos,
        };
        saveProgress(next);
        return next;
      });

      addToast(`Purchased ${item}!`, 'success');
      return true;
    },
    [addToast, progress.coins]
  );

  // Refill hearts with 100 coins from GameOver
  const handleRefillHeartsWithCoins = useCallback(() => {
    if ((progress.coins ?? 0) < 100) {
      addToast('Not enough coins! Watch an ad to get +1 life.', 'warning');
      return;
    }
    setProgress((prev) => {
      const next = {
        ...prev,
        coins: prev.coins - 100,
        hearts: 3,
        lastHeartLossTime: undefined,
      };
      saveProgress(next);
      return next;
    });
    setHearts(3);
    setIsGameOverOpen(false);
    addToast('Lives Refilled to 3!', 'success');
  }, [addToast, progress.coins]);

  // Claim Daily Streak Reward
  const handleClaimDailyReward = useCallback(
    (dayIndex: number, reward: { coins: number; hints: number; bombs: number; undos: number }) => {
      const todayStr = new Date().toISOString().split('T')[0];
      setProgress((prev) => {
        const next: SavedProgress = {
          ...prev,
          coins: (prev.coins ?? 100) + reward.coins,
          hintsCount: (prev.hintsCount ?? 3) + reward.hints,
          bombsCount: (prev.bombsCount ?? 1) + reward.bombs,
          undosCount: (prev.undosCount ?? 3) + reward.undos,
          dailyStreak: (prev.dailyStreak ?? 0) + 1,
          lastClaimDate: todayStr,
        };
        saveProgress(next);
        return next;
      });
      addToast(`Claimed Day ${dayIndex + 1}: +${reward.coins} Coins!`, 'success');
    },
    [addToast]
  );

  // Rewarded Ad Grant Callback
  const handleRewardEarned = useCallback(
    (reward: AdReward) => {
      if (reward.type === 'extra_life') {
        // Restore strictly 1 life and resume
        setHearts(1);
        setProgress((prev) => {
          const next = {
            ...prev,
            hearts: 1,
            lastHeartLossTime: undefined,
          };
          saveProgress(next);
          return next;
        });
        setIsGameOverOpen(false);
        addToast('+1 Life Granted! Keep escaping!', 'success');
      } else if (reward.type === 'coins') {
        setProgress((prev) => {
          const next = {
            ...prev,
            coins: (prev.coins ?? 100) + reward.amount,
          };
          saveProgress(next);
          return next;
        });
        addToast(`+${reward.amount} Coins Received!`, 'success');
      } else if (reward.type === 'hint') {
        setProgress((prev) => {
          const next = {
            ...prev,
            hintsCount: (prev.hintsCount ?? 3) + 1,
          };
          saveProgress(next);
          return next;
        });
        addToast('+1 Free Hint Added!', 'success');
      }
    },
    [addToast]
  );

  return (
    <div
      className={`w-full h-full flex items-center justify-center overflow-hidden transition-colors ${
        settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Toast Alert Layer */}
      <NetworkStatusToast toasts={toasts} onDismiss={dismissToast} />

      {/* Safe Area Viewport Container */}
      <div
        className={`w-full h-full max-w-md mx-auto relative flex flex-col overflow-hidden shadow-2xl ${
          settings.theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        {/* Screen 1: Splash / Loading View */}
        {screen === 'splash' && (
          <SplashView
            autostart={queryParams.autostart}
            onFinish={() => {
              setScreen('home');
              document.body.dataset.state = 'title';
            }}
          />
        )}

        {/* Screen 2: Main Menu / Home View */}
        {screen === 'home' && (
          <HomeView
            progress={progress}
            settings={settings}
            theme={settings.theme}
            onPlay={handleStartLevel}
            onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
            onOpenDaily={() => setIsDailyOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onToggleSound={() =>
              handleUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
          />
        )}

        {/* Screen 3: Gameplay View (fresh session key guarantees zero stale state on Replay/Restart) */}
        {screen === 'playing' && (
          <GameView
            key={`game-${currentLevelData.id}-${isDailyActive ? 'daily' : 'reg'}-session-${gameSessionId}`}
            level={currentLevelData}
            settings={settings}
            theme={settings.theme}
            hearts={hearts}
            hintsRemaining={progress.hintsCount ?? 3}
            bombsRemaining={progress.bombsCount ?? 1}
            undosRemaining={progress.undosCount ?? 3}
            isPaused={isPaused}
            onHeartLost={handleHeartLost}
            onUseHint={() => {
              setProgress((prev) => {
                const next = {
                  ...prev,
                  hintsCount: Math.max(0, (prev.hintsCount ?? 3) - 1),
                };
                saveProgress(next);
                return next;
              });
            }}
            onUseBomb={() => {
              setProgress((prev) => {
                const next = {
                  ...prev,
                  bombsCount: Math.max(0, (prev.bombsCount ?? 1) - 1),
                };
                saveProgress(next);
                return next;
              });
            }}
            onUseUndo={() => {
              setProgress((prev) => {
                const next = {
                  ...prev,
                  undosCount: Math.max(0, (prev.undosCount ?? 3) - 1),
                };
                saveProgress(next);
                return next;
              });
            }}
            onPause={() => {
              if (!completedResult && !isGameOverOpen) {
                setIsPaused(true);
              }
            }}
            onRestart={restartCurrentLevel}
            onLevelComplete={handleLevelComplete}
            onGameOver={handleGameOver}
            onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onToggleSound={() =>
              handleUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
          />
        )}

        {/* Screen 5: Pause Menu Modal */}
        {isPaused && (
          <PauseModal
            levelId={currentLevelData.id}
            moves={0}
            settings={settings}
            theme={settings.theme}
            onResume={handleResume}
            onRestart={restartCurrentLevel}
            onHome={handleReturnHome}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onToggleSound={() =>
              handleUpdateSettings({ soundEnabled: !settings.soundEnabled })
            }
            onToggleMusic={() =>
              handleUpdateSettings({ musicEnabled: !settings.musicEnabled })
            }
            onToggleHaptics={() =>
              handleUpdateSettings({ hapticsEnabled: !settings.hapticsEnabled })
            }
          />
        )}

        {/* Screen 6: Level Complete / Victory Screen */}
        {completedResult && (
          <LevelCompleteModal
            levelId={currentLevelData.id}
            levelName={currentLevelData.name}
            stars={completedResult.stars}
            moves={completedResult.moves}
            parMoves={currentLevelData.parMoves}
            timeSeconds={completedResult.timeSeconds}
            hasNextLevel={!isDailyActive && activeLevelId < TOTAL_LEVELS_COUNT}
            theme={settings.theme}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onNextLevel={handleNextLevel}
            onReplay={restartCurrentLevel}
            onOpenLevelSelect={() => {
              setCompletedResult(null);
              setIsLevelSelectOpen(true);
            }}
            onHome={handleReturnHome}
          />
        )}

        {/* Screen 7: Game Over / Out of Lives Modal */}
        {isGameOverOpen && (
          <GameOverModal
            levelId={currentLevelData.id}
            coins={progress.coins ?? 100}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onWatchAdForLife={() => {
              setRewardedAdConfig({ rewardType: 'extra_life' });
            }}
            onRefillWithCoins={handleRefillHeartsWithCoins}
            onRestart={restartCurrentLevel}
            onHome={handleReturnHome}
          />
        )}

        {/* Screen 4: Level Selection Modal */}
        {isLevelSelectOpen && (
          <LevelSelectModal
            progress={progress}
            theme={settings.theme}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onSelectLevel={handleStartLevel}
            onClose={() => setIsLevelSelectOpen(false)}
          />
        )}

        {/* Screen 8: Settings Modal */}
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            theme={settings.theme}
            onUpdateSettings={handleUpdateSettings}
            onResetProgress={handleResetProgress}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {/* Screen 9: Coin Shop / Power-ups Modal */}
        {isShopOpen && (
          <ShopModal
            coins={progress.coins ?? 100}
            hintsCount={progress.hintsCount ?? 3}
            bombsCount={progress.bombsCount ?? 1}
            undosCount={progress.undosCount ?? 3}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onBuyItem={handleBuyShopItem}
            onWatchAdForCoins={() => {
              setRewardedAdConfig({ rewardType: 'coins' });
            }}
            onClose={() => setIsShopOpen(false)}
          />
        )}

        {/* Screen 10: Rewarded Ad / Extra Life AdMob Flow */}
        {rewardedAdConfig && (
          <RewardedAdModal
            rewardType={rewardedAdConfig.rewardType}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onRewardEarned={handleRewardEarned}
            onClose={() => setRewardedAdConfig(null)}
          />
        )}

        {/* Screen 11: Tutorial / How to Play Modal */}
        {isHowToPlayOpen && (
          <HowToPlayModal
            theme={settings.theme}
            soundEnabled={settings.soundEnabled}
            onClose={() => setIsHowToPlayOpen(false)}
          />
        )}

        {/* Screen 12: Daily Rewards 7-Day Streak Calendar */}
        {isDailyRewardsOpen && (
          <DailyRewardsModal
            streak={progress.dailyStreak ?? 0}
            lastClaimDate={progress.lastClaimDate}
            soundEnabled={settings.soundEnabled}
            hapticsEnabled={settings.hapticsEnabled}
            onClaimDay={handleClaimDailyReward}
            onClose={() => setIsDailyRewardsOpen(false)}
          />
        )}

        {/* Daily Challenge Puzzle Modal */}
        {isDailyOpen && (
          <DailyChallengeModal
            progress={progress}
            settings={settings}
            theme={settings.theme}
            onStartDaily={handleStartDaily}
            onClose={() => setIsDailyOpen(false)}
          />
        )}

        {/* Screen 15: Status Dialogs (Loading / No Internet / Ad Unavailable / Error) */}
        {statusDialog && (
          <StatusDialog
            type={statusDialog}
            isOpen={true}
            onRetry={() => {
              if (navigator.onLine) {
                setStatusDialog(null);
                addToast('Connected!', 'success');
              } else {
                addToast('Still offline. Check connection.', 'warning');
              }
            }}
            onClose={() => setStatusDialog(null)}
            soundEnabled={settings.soundEnabled}
          />
        )}
      </div>

      {/* Reference Bottom Branding Banner */}
      <footer className="fixed bottom-2 left-0 right-0 z-10 pointer-events-none hidden md:flex items-center justify-center gap-2.5 text-slate-400 font-extrabold text-[11px] tracking-widest uppercase select-none opacity-85">
        <svg className="w-4 h-4 text-[#0077FE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
        <span className="text-slate-800 font-black tracking-wider">ARROW X</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500 font-semibold tracking-normal normal-case">Think • Plan • Escape</span>
      </footer>
    </div>
  );
}
