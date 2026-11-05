/**
 * Google AdMob Integration Service for ARROW X
 *
 * Implements Google's official Android Test Ad Unit IDs for development:
 * - Test App ID: ca-app-pub-3940256099942544~3347511713
 * - App Open Test ID: ca-app-pub-3940256099942544/9257395921
 * - Rewarded Video Test ID: ca-app-pub-3940256099942544/5224354917
 *
 * Provides strict architectural separation between Test IDs and Production IDs:
 * - Test IDs are strictly isolated for development & testing.
 * - Production IDs are safely configured separately via environment variables
 *   or release profiles, never overwritten or mixed with demo IDs.
 * - Seamlessly integrates with @capacitor-community/admob on native Android
 *   and provides full web/dev simulation and diagnostics.
 */

import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents, AppOpenAdPluginEvents } from '@capacitor-community/admob';

/**
 * Official Google Android Test Configuration
 */
export const ADMOB_TEST_CONFIG = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  rewardedUnitId: 'ca-app-pub-3940256099942544/5224354917',
  appOpenUnitId: 'ca-app-pub-3940256099942544/9257395921',
} as const;

// Backward-compatible individual constants
export const ADMOB_TEST_APP_ID = ADMOB_TEST_CONFIG.appId;
export const ADMOB_TEST_REWARDED_UNIT_ID = ADMOB_TEST_CONFIG.rewardedUnitId;
export const ADMOB_TEST_APP_OPEN_UNIT_ID = ADMOB_TEST_CONFIG.appOpenUnitId;

export interface AdMobConfig {
  appId: string;
  rewardedUnitId: string;
  appOpenUnitId: string;
}

/**
 * Production AdMob Configuration
 * Sourced securely from environment variables, preserving user IDs for final release
 */
export const ADMOB_PROD_CONFIG: AdMobConfig = {
  appId:
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_ADMOB_PROD_APP_ID || import.meta.env?.VITE_ADMOB_APP_ID)) ||
    'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
  rewardedUnitId:
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_ADMOB_PROD_REWARDED_ID || import.meta.env?.VITE_ADMOB_REWARDED_ID)) ||
    'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  appOpenUnitId:
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_ADMOB_PROD_APP_OPEN_ID || import.meta.env?.VITE_ADMOB_APP_OPEN_ID)) ||
    'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
};

export type AdState = 'idle' | 'loading' | 'ready' | 'playing' | 'rewarded' | 'failed' | 'unavailable';

export interface AdReward {
  type: string;
  amount: number;
}

export type StateListener = (state: AdState) => void;

class AdMobService {
  // Test mode flag: true during development/testing (default)
  private isTestingMode: boolean = true;

  // Configurations
  private testConfig: AdMobConfig = { ...ADMOB_TEST_CONFIG };
  private prodConfig: AdMobConfig = { ...ADMOB_PROD_CONFIG };

  // Rewarded Video Ad State
  private rewardedState: AdState = 'idle';
  private currentRewardCallback: ((reward: AdReward) => void) | null = null;
  private currentRewardType: string = 'extra_life';
  private currentRewardAmount: number = 3;
  private isRewardClaimed: boolean = false;
  private rewardedStateListeners: Set<StateListener> = new Set();

  // App Open Ad State
  private appOpenState: AdState = 'idle';
  private appOpenDismissCallback: (() => void) | null = null;
  private appOpenStateListeners: Set<StateListener> = new Set();
  private lastAppOpenShowTime: number = 0;

  // Common State
  private simulateNetworkFailure: boolean = false;
  private isNativeInitialized: boolean = false;
  private isInitializing: boolean = false;
  private lastErrorMessage: string | null = null;

  constructor() {
    // Check if test mode is explicitly disabled in environment
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMOB_TEST_MODE === 'false') {
      this.isTestingMode = false;
    }
  }

  // ==========================================
  // CONFIGURATION & MODE SWITCHING
  // ==========================================

  /**
   * Check if development test mode is currently active
   */
  public isTesting(): boolean {
    return this.isTestingMode;
  }

  /**
   * Safely switch between Test Mode and Production Mode
   */
  public setTestingMode(enabled: boolean): void {
    if (this.isTestingMode === enabled) return;
    this.isTestingMode = enabled;
    // Reset loaded states so new ad units are prepared
    this.rewardedState = 'idle';
    this.appOpenState = 'idle';
    this.notifyRewardedState('idle');
    this.notifyAppOpenState('idle');
  }

  /**
   * Get currently active AdMob App ID
   */
  public getAppId(): string {
    return this.isTestingMode ? this.testConfig.appId : this.prodConfig.appId;
  }

  /**
   * Get currently active Rewarded Video Ad Unit ID
   */
  public getRewardedUnitId(): string {
    return this.isTestingMode ? this.testConfig.rewardedUnitId : this.prodConfig.rewardedUnitId;
  }

  /**
   * Backward-compatible alias for getRewardedUnitId
   */
  public getAdUnitId(): string {
    return this.getRewardedUnitId();
  }

  /**
   * Get currently active App Open Ad Unit ID
   */
  public getAppOpenUnitId(): string {
    return this.isTestingMode ? this.testConfig.appOpenUnitId : this.prodConfig.appOpenUnitId;
  }

  /**
   * Retrieve official test IDs
   */
  public getTestConfig(): Readonly<AdMobConfig> {
    return { ...this.testConfig };
  }

  /**
   * Retrieve production IDs
   */
  public getProductionConfig(): Readonly<AdMobConfig> {
    return { ...this.prodConfig };
  }

  /**
   * Safely update production IDs without modifying test IDs
   */
  public setProductionConfig(config: Partial<AdMobConfig>): void {
    this.prodConfig = {
      ...this.prodConfig,
      ...config,
    };
  }

  // ==========================================
  // INITIALIZATION & LIFECYCLE
  // ==========================================

  /**
   * Initializes the Mobile Ads SDK on-demand without blocking cold start
   */
  public async initAdMob(): Promise<void> {
    if (this.isNativeInitialized || this.isInitializing) return;
    this.isInitializing = true;
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AdMob')) {
        try {
          await AdMob.initialize({
            initializeForTesting: this.isTestingMode,
          });
          this.isNativeInitialized = true;

          // Register Native Rewarded Ad Event Listeners
          await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
            this.setRewardedState('ready');
            this.lastErrorMessage = null;
          });

          await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
            this.setRewardedState('failed');
            this.lastErrorMessage = err?.message || 'Failed to load test rewarded ad';
          });

          await AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem) => {
            const amount = rewardItem?.amount || this.currentRewardAmount || 3;
            this.claimReward(this.currentRewardType, amount);
          });

          await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
            this.closeAdSession();
            this.preloadAd();
          });

          await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
            this.setRewardedState('failed');
            this.lastErrorMessage = err?.message || 'Failed to show test rewarded ad';
            this.closeAdSession();
          });

          // Register Native App Open Ad Event Listeners
          await AdMob.addListener(AppOpenAdPluginEvents.Loaded, () => {
            this.setAppOpenState('ready');
          });

          await AdMob.addListener(AppOpenAdPluginEvents.FailedToLoad, (err) => {
            this.setAppOpenState('failed');
            this.lastErrorMessage = err?.message || 'Failed to load test app open ad';
          });

          await AdMob.addListener(AppOpenAdPluginEvents.Opened, () => {
            this.setAppOpenState('playing');
            this.lastAppOpenShowTime = Date.now();
          });

          await AdMob.addListener(AppOpenAdPluginEvents.Closed, () => {
            this.setAppOpenState('idle');
            if (this.appOpenDismissCallback) {
              this.appOpenDismissCallback();
              this.appOpenDismissCallback = null;
            }
            // Automatically preload the next App Open Ad
            this.preloadAppOpenAd();
          });

          await AdMob.addListener(AppOpenAdPluginEvents.FailedToShow, (err) => {
            this.setAppOpenState('failed');
            this.lastErrorMessage = err?.message || 'Failed to show test app open ad';
            if (this.appOpenDismissCallback) {
              this.appOpenDismissCallback();
              this.appOpenDismissCallback = null;
            }
          });

          // Preload both ad formats in background
          this.preloadAd();
          this.preloadAppOpenAd();
          return;
        } catch (err) {
          console.warn('AdMob native initialization fallback to web service:', err);
        }
      }

      // In web/preview environment, preload initial test ads
      await Promise.all([this.preloadAd(), this.preloadAppOpenAd()]);
    } finally {
      this.isInitializing = false;
    }
  }

  // ==========================================
  // REWARDED VIDEO ADS API
  // ==========================================

  public getState(): AdState {
    return this.rewardedState;
  }

  public isReady(): boolean {
    return this.rewardedState === 'ready';
  }

  public isAdLoading(): boolean {
    return this.rewardedState === 'loading';
  }

  public isAdPlaying(): boolean {
    return this.rewardedState === 'playing';
  }

  public getLastErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  public addListener(listener: StateListener): () => void {
    this.rewardedStateListeners.add(listener);
    return () => this.rewardedStateListeners.delete(listener);
  }

  private setRewardedState(newState: AdState): void {
    this.rewardedState = newState;
    this.notifyRewardedState(newState);
  }

  private notifyRewardedState(newState: AdState): void {
    this.rewardedStateListeners.forEach((l) => {
      try {
        l(newState);
      } catch {}
    });
  }

  public setSimulateNetworkFailure(fail: boolean): void {
    this.simulateNetworkFailure = fail;
  }

  public getSimulateNetworkFailure(): boolean {
    return this.simulateNetworkFailure;
  }

  public isNative(): boolean {
    return this.isNativeInitialized && Capacitor.isNativePlatform();
  }

  /**
   * Preload a rewarded video ad (uses configured test ID or production ID)
   */
  public async preloadAd(): Promise<boolean> {
    if (this.rewardedState === 'loading' || this.rewardedState === 'ready') {
      return this.rewardedState === 'ready';
    }

    this.setRewardedState('loading');
    this.lastErrorMessage = null;

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline || this.simulateNetworkFailure) {
      this.setRewardedState('unavailable');
      this.lastErrorMessage = 'Internet connection required for test ads.';
      return false;
    }

    if (this.isNative()) {
      try {
        await AdMob.prepareRewardVideoAd({
          adId: this.getRewardedUnitId(),
        });
        this.setRewardedState('ready');
        return true;
      } catch (err: unknown) {
        this.setRewardedState('failed');
        this.lastErrorMessage = (err as Error)?.message || 'Failed to load rewarded ad.';
        return false;
      }
    }

    // Web / Test simulation latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (this.simulateNetworkFailure || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      this.setRewardedState('unavailable');
      this.lastErrorMessage = 'Internet connection required for test ads.';
      return false;
    }

    this.setRewardedState('ready');
    return true;
  }

  /**
   * Prepare to show rewarded ad session
   */
  public startAdSession(rewardType: string, amount: number, onReward: (reward: AdReward) => void): boolean {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (this.simulateNetworkFailure || isOffline) {
      this.setRewardedState('unavailable');
      this.lastErrorMessage = 'Internet connection required for test ads.';
      return false;
    }

    this.setRewardedState('playing');
    this.isRewardClaimed = false;
    this.currentRewardType = rewardType;
    this.currentRewardAmount = amount;
    this.currentRewardCallback = onReward;
    this.lastErrorMessage = null;
    return true;
  }

  /**
   * Show Native Rewarded Video Ad via Capacitor AdMob
   */
  public async showNativeRewardedAd(
    rewardType: string,
    amount: number,
    onReward: (reward: AdReward) => void
  ): Promise<boolean> {
    const started = this.startAdSession(rewardType, amount, onReward);
    if (!started) return false;

    if (this.isNative()) {
      try {
        await AdMob.showRewardVideoAd();
        return true;
      } catch (err: unknown) {
        this.setRewardedState('failed');
        this.lastErrorMessage = (err as Error)?.message || 'Failed to show native ad';
        this.closeAdSession();
        return false;
      }
    }
    return true;
  }

  /**
   * Claim the reward strictly once while actively playing
   */
  public claimReward(rewardType: string, amount: number): boolean {
    if (this.isRewardClaimed) return false;
    if (this.rewardedState !== 'playing') return false;
    this.isRewardClaimed = true;
    this.setRewardedState('rewarded');

    if (this.currentRewardCallback) {
      this.currentRewardCallback({ type: rewardType, amount });
      this.currentRewardCallback = null;
    }

    setTimeout(() => {
      this.setRewardedState('idle');
      this.preloadAd();
    }, 2000);

    return true;
  }

  public completeCurrentAdSession(): boolean {
    return this.claimReward(this.currentRewardType, this.currentRewardAmount);
  }

  public dismissCurrentAdSession(): void {
    this.closeAdSession();
  }

  public closeAdSession(): void {
    if (this.rewardedState !== 'rewarded') {
      this.setRewardedState('idle');
      setTimeout(() => {
        this.preloadAd();
      }, 500);
    }
    this.currentRewardCallback = null;
  }

  // ==========================================
  // APP OPEN ADS API
  // ==========================================

  public getAppOpenState(): AdState {
    return this.appOpenState;
  }

  public isAppOpenReady(): boolean {
    return this.appOpenState === 'ready';
  }

  public isAppOpenPlaying(): boolean {
    return this.appOpenState === 'playing';
  }

  public addAppOpenListener(listener: StateListener): () => void {
    this.appOpenStateListeners.add(listener);
    return () => this.appOpenStateListeners.delete(listener);
  }

  private setAppOpenState(newState: AdState): void {
    this.appOpenState = newState;
    this.notifyAppOpenState(newState);
  }

  private notifyAppOpenState(newState: AdState): void {
    this.appOpenStateListeners.forEach((l) => {
      try {
        l(newState);
      } catch {}
    });
  }

  /**
   * Preload an App Open Ad
   */
  public async preloadAppOpenAd(): Promise<boolean> {
    if (this.appOpenState === 'loading' || this.appOpenState === 'ready') {
      return this.appOpenState === 'ready';
    }

    this.setAppOpenState('loading');

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline || this.simulateNetworkFailure) {
      this.setAppOpenState('unavailable');
      return false;
    }

    if (this.isNative()) {
      try {
        await AdMob.loadAppOpen({
          adId: this.getAppOpenUnitId(),
        });
        this.setAppOpenState('ready');
        return true;
      } catch (err: unknown) {
        this.setAppOpenState('failed');
        this.lastErrorMessage = (err as Error)?.message || 'Failed to load App Open ad';
        return false;
      }
    }

    // Web simulation
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (this.simulateNetworkFailure) {
      this.setAppOpenState('unavailable');
      return false;
    }

    this.setAppOpenState('ready');
    return true;
  }

  /**
   * Show App Open Ad on cold launch or resume
   */
  public async showAppOpenAd(onDismiss?: () => void): Promise<boolean> {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (this.simulateNetworkFailure || isOffline) {
      return false;
    }

    // Prevent spamming App Open ads within 15 seconds
    const now = Date.now();
    if (now - this.lastAppOpenShowTime < 15000 && this.lastAppOpenShowTime > 0) {
      return false;
    }

    if (onDismiss) {
      this.appOpenDismissCallback = onDismiss;
    }

    if (this.isNative()) {
      try {
        // Check if loaded on native
        const isLoaded = await AdMob.isAppOpenLoaded();
        if (isLoaded?.value) {
          await AdMob.showAppOpen();
          this.lastAppOpenShowTime = now;
          return true;
        } else {
          // Preload for next resume
          this.preloadAppOpenAd();
          return false;
        }
      } catch (err) {
        this.setAppOpenState('failed');
        this.lastErrorMessage = (err as Error)?.message || 'Failed to show App Open ad';
        return false;
      }
    }

    // Web Simulation: activate playing state
    this.lastAppOpenShowTime = now;
    this.setAppOpenState('playing');
    return true;
  }

  /**
   * Dismiss the currently displaying App Open Ad
   */
  public dismissAppOpenAd(): void {
    if (this.appOpenState === 'playing') {
      this.setAppOpenState('idle');
      if (this.appOpenDismissCallback) {
        this.appOpenDismissCallback();
        this.appOpenDismissCallback = null;
      }
      setTimeout(() => {
        this.preloadAppOpenAd();
      }, 500);
    }
  }
}

export const admob = new AdMobService();
