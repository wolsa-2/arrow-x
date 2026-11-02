import { SavedProgress, UserSettings } from '../game/types';
import { ECONOMY_CONFIG } from '../game/economy';

const PROGRESS_STORAGE_KEY = 'arrow_escape_progress_v1';
const SETTINGS_STORAGE_KEY = 'arrow_escape_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  musicEnabled: false,
  hapticsEnabled: true,
  theme: 'dark',
  timerEnabled: true,
};

export const DEFAULT_PROGRESS: SavedProgress = {
  highestUnlockedLevel: 1,
  levels: {},
  totalStars: 0,
  coins: ECONOMY_CONFIG.STARTING_BALANCES.COINS, // Starting gift: 100 Coins
  hintsCount: ECONOMY_CONFIG.STARTING_BALANCES.HINTS,
  bombsCount: ECONOMY_CONFIG.STARTING_BALANCES.BOMBS,
  undosCount: ECONOMY_CONFIG.STARTING_BALANCES.UNDOS,
  dailyStreak: 0,
  dailyRewardsClaimed: [],
  hearts: ECONOMY_CONFIG.STARTING_BALANCES.HEARTS,
  lastHeartLossTime: undefined,
};

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage quota or restriction
  }
}

export function loadProgress(): SavedProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      highestUnlockedLevel: Math.max(1, parsed.highestUnlockedLevel || 1),
      levels: parsed.levels || {},
      totalStars: parsed.totalStars || 0,
      coins: Math.max(
        0,
        typeof parsed.coins === 'number' ? parsed.coins : ECONOMY_CONFIG.STARTING_BALANCES.COINS
      ),
      hintsCount: typeof parsed.hintsCount === 'number' ? parsed.hintsCount : ECONOMY_CONFIG.STARTING_BALANCES.HINTS,
      bombsCount: typeof parsed.bombsCount === 'number' ? parsed.bombsCount : ECONOMY_CONFIG.STARTING_BALANCES.BOMBS,
      undosCount: typeof parsed.undosCount === 'number' ? parsed.undosCount : ECONOMY_CONFIG.STARTING_BALANCES.UNDOS,
      dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
      lastClaimDate: parsed.lastClaimDate,
      dailyRewardsClaimed: Array.isArray(parsed.dailyRewardsClaimed) ? parsed.dailyRewardsClaimed : [],
      dailyChallengeDate: parsed.dailyChallengeDate,
      dailyChallengeCompleted: parsed.dailyChallengeCompleted,
      hearts: typeof parsed.hearts === 'number' ? Math.max(0, Math.min(ECONOMY_CONFIG.STARTING_BALANCES.MAX_HEARTS, parsed.hearts)) : ECONOMY_CONFIG.STARTING_BALANCES.HEARTS,
      lastHeartLossTime: parsed.lastHeartLossTime,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: SavedProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage quota or restriction
  }
}

export function resetAllProgress(): SavedProgress {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {}
  }
  return { ...DEFAULT_PROGRESS };
}
