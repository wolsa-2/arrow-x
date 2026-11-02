/**
 * Google AdMob Rewarded Ads Service for ARROW X
 *
 * Implements Google's official Test IDs for Android:
 * - App ID: ca-app-pub-3940256099942544~3347511713
 * - Rewarded Video Unit ID: ca-app-pub-3940256099942544/5224354917
 *
 * Seamlessly integrates with @capacitor-community/admob on native Android
 * and provides responsive, secure verification in all environments.
 */

import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

export const ADMOB_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const ADMOB_TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

export type AdState = 'idle' | 'loading' | 'ready' | 'playing' | 'rewarded' | 'failed' | 'unavailable';

export interface AdReward {
  type: string;
  amount: number;
}

type StateListener = (state: AdState) => void;

class AdMobService {
  private state: AdState = 'idle';
  private testAppId: string = ADMOB_TEST_APP_ID;
  private testAdUnitId: string = ADMOB_TEST_REWARDED_UNIT_ID;
  private simulateNetworkFailure: boolean = false;
  private currentRewardCallback: ((reward: AdReward) => void) | null = null;
  private currentRewardType: string = 'extra_life';
  private currentRewardAmount: number = 3;
  private isRewardClaimed: boolean = false;
  private isNativeInitialized: boolean = false;
  private lastErrorMessage: string | null = null;
  private stateListeners: Set<StateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Defer initial setup to keep startup instant and non-blocking
      const initDeferred = () => {
        if ('requestIdleCallback' in window) {
          (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
            this.initAdMob();
          });
        } else {
          setTimeout(() => this.initAdMob(), 2000);
        }
      };
      setTimeout(initDeferred, 1500);
    }
  }

  /**
   * Initializes the Mobile Ads SDK
   */
  public async initAdMob(): Promise<void> {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AdMob')) {
      try {
        await AdMob.initialize({
          initializeForTesting: true,
        });
        this.isNativeInitialized = true;

        // Register Native AdMob event listeners
        await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
          this.setState('ready');
          this.lastErrorMessage = null;
        });

        await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
          this.setState('failed');
          this.lastErrorMessage = err?.message || 'Failed to load test ad';
        });

        await AdMob.addListener(RewardAdPluginEvents.Rewarded, (rewardItem) => {
          // Google AdMob SDK confirms user completed the rewarded ad
          const amount = rewardItem?.amount || this.currentRewardAmount || 3;
          this.claimReward(this.currentRewardType, amount);
        });

        await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          this.closeAdSession();
          // Reload next rewarded ad automatically
          this.preloadAd();
        });

        await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
          this.setState('failed');
          this.lastErrorMessage = err?.message || 'Failed to show test ad';
          this.closeAdSession();
        });

        // Preload first ad
        await this.preloadAd();
        return;
      } catch (err) {
        console.warn('AdMob native initialization fallback to web service:', err);
      }
    }

    // In web/preview environment, preload initial test ad
    await this.preloadAd();
  }

  public getAppId(): string {
    return this.testAppId;
  }

  public getAdUnitId(): string {
    return this.testAdUnitId;
  }

  public getState(): AdState {
    return this.state;
  }

  public isReady(): boolean {
    return this.state === 'ready';
  }

  public isAdLoading(): boolean {
    return this.state === 'loading';
  }

  public isAdPlaying(): boolean {
    return this.state === 'playing';
  }

  public getLastErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  public addListener(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(newState: AdState): void {
    this.state = newState;
    this.stateListeners.forEach((l) => {
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
   * Preload a rewarded video ad
   */
  public async preloadAd(): Promise<boolean> {
    if (this.state === 'loading' || this.state === 'ready') {
      return this.state === 'ready';
    }

    this.setState('loading');
    this.lastErrorMessage = null;

    // Check offline or simulated failure
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline || this.simulateNetworkFailure) {
      this.setState('unavailable');
      this.lastErrorMessage = 'Internet connection required for test ads.';
      return false;
    }

    if (this.isNative()) {
      try {
        await AdMob.prepareRewardVideoAd({
          adId: this.testAdUnitId,
        });
        this.setState('ready');
        return true;
      } catch (err: unknown) {
        this.setState('failed');
        this.lastErrorMessage = (err as Error)?.message || 'Failed to load rewarded ad.';
        return false;
      }
    }

    // Web / Test simulation latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (this.simulateNetworkFailure || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      this.setState('unavailable');
      this.lastErrorMessage = 'Internet connection required for test ads.';
      return false;
    }

    this.setState('ready');
    return true;
  }

  /**
   * Prepare to show ad session
   */
  public startAdSession(rewardType: string, amount: number, onReward: (reward: AdReward) => void): boolean {
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (this.simulateNetworkFailure || isOffline) {
      this.setState('unavailable');
      this.lastErrorMessage = 'Internet connection required for test ads.';
      return false;
    }

    this.setState('playing');
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
        this.setState('failed');
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
    if (this.state !== 'playing') return false;
    this.isRewardClaimed = true;
    this.setState('rewarded');

    if (this.currentRewardCallback) {
      this.currentRewardCallback({ type: rewardType, amount });
      this.currentRewardCallback = null;
    }

    // Schedule next ad preload in background after ad completes
    setTimeout(() => {
      this.setState('idle');
      this.preloadAd();
    }, 2000);

    return true;
  }

  /**
   * Complete current ad session and claim the reward strictly once
   */
  public completeCurrentAdSession(): boolean {
    return this.claimReward(this.currentRewardType, this.currentRewardAmount);
  }

  /**
   * Dismiss current ad session without granting any reward
   */
  public dismissCurrentAdSession(): void {
    this.closeAdSession();
  }

  /**
   * Close ad session and reload next ad
   */
  public closeAdSession(): void {
    if (this.state !== 'rewarded') {
      this.setState('idle');
      // Reload next rewarded ad after dismissal
      setTimeout(() => {
        this.preloadAd();
      }, 500);
    }
    this.currentRewardCallback = null;
  }
}

export const admob = new AdMobService();
