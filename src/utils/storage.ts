import { SavedProgress, UserSettings } from '../game/types';

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
  coins: 100, // Starting gift
  hintsCount: 3,
  bombsCount: 1,
  undosCount: 3,
  dailyStreak: 0,
  dailyRewardsClaimed: [],
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
      coins: typeof parsed.coins === 'number' ? parsed.coins : 100,
      hintsCount: typeof parsed.hintsCount === 'number' ? parsed.hintsCount : 3,
      bombsCount: typeof parsed.bombsCount === 'number' ? parsed.bombsCount : 1,
      undosCount: typeof parsed.undosCount === 'number' ? parsed.undosCount : 3,
      dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
      lastClaimDate: parsed.lastClaimDate,
      dailyRewardsClaimed: Array.isArray(parsed.dailyRewardsClaimed) ? parsed.dailyRewardsClaimed : [],
      dailyChallengeDate: parsed.dailyChallengeDate,
      dailyChallengeCompleted: parsed.dailyChallengeCompleted,
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
