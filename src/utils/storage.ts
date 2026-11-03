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

// In-memory caches to avoid synchronous disk I/O on every access
let cachedProgress: SavedProgress | null = null;
let cachedSettings: UserSettings | null = null;
let progressFlushTimeout: any = null;
let settingsFlushTimeout: any = null;

function flushProgressNow(): void {
  if (typeof window === 'undefined' || !cachedProgress) return;
  if (progressFlushTimeout) {
    clearTimeout(progressFlushTimeout);
    progressFlushTimeout = null;
  }
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(cachedProgress));
  } catch {
    // Storage quota or restriction
  }
}

function flushSettingsNow(): void {
  if (typeof window === 'undefined' || !cachedSettings) return;
  if (settingsFlushTimeout) {
    clearTimeout(settingsFlushTimeout);
    settingsFlushTimeout = null;
  }
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cachedSettings));
  } catch {
    // Storage quota or restriction
  }
}

// Ensure pending writes are immediately committed on app hide or exit
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushProgressNow();
    flushSettingsNow();
  });
  window.addEventListener('pagehide', () => {
    flushProgressNow();
    flushSettingsNow();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushProgressNow();
      flushSettingsNow();
    }
  });
}

export function loadSettings(): UserSettings {
  if (cachedSettings) return { ...cachedSettings };
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      cachedSettings = { ...DEFAULT_SETTINGS };
      return cachedSettings;
    }
    const parsed = JSON.parse(raw);
    cachedSettings = {
      soundEnabled: typeof parsed?.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      musicEnabled: typeof parsed?.musicEnabled === 'boolean' ? parsed.musicEnabled : DEFAULT_SETTINGS.musicEnabled,
      hapticsEnabled: typeof parsed?.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : DEFAULT_SETTINGS.hapticsEnabled,
      theme: parsed?.theme === 'light' || parsed?.theme === 'dark' ? parsed.theme : DEFAULT_SETTINGS.theme,
      timerEnabled: typeof parsed?.timerEnabled === 'boolean' ? parsed.timerEnabled : DEFAULT_SETTINGS.timerEnabled,
    };
    return { ...cachedSettings };
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  cachedSettings = { ...settings };
  if (typeof window === 'undefined') return;

  // Debounced write to avoid blocking the main thread during animations or clicks
  if (settingsFlushTimeout) clearTimeout(settingsFlushTimeout);
  settingsFlushTimeout = setTimeout(flushSettingsNow, 120);
}

export function loadProgress(): SavedProgress {
  if (cachedProgress) return { ...cachedProgress };
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      cachedProgress = { ...DEFAULT_PROGRESS };
      return cachedProgress;
    }
    const parsed = JSON.parse(raw);
    cachedProgress = {
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
    return { ...cachedProgress };
  } catch {
    cachedProgress = { ...DEFAULT_PROGRESS };
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: SavedProgress): void {
  cachedProgress = { ...progress };
  if (typeof window === 'undefined') return;

  // Non-blocking asynchronous commit: prevents 1s freeze during level complete or moves
  if (progressFlushTimeout) clearTimeout(progressFlushTimeout);
  progressFlushTimeout = setTimeout(flushProgressNow, 80);
}

export function resetAllProgress(): SavedProgress {
  cachedProgress = { ...DEFAULT_PROGRESS };
  if (progressFlushTimeout) clearTimeout(progressFlushTimeout);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {}
  }
  return { ...DEFAULT_PROGRESS };
}
