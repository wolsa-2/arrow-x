/**
 * Google AdMob Rewarded Ads Service (SDK-Ready Simulation)
 *
 * Implements asynchronous loading, callback verification, reward integrity,
 * failure/no-fill/offline state handling, and official test ad unit identifiers.
 */

export const ADMOB_TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

export type AdState = 'idle' | 'loading' | 'ready' | 'playing' | 'rewarded' | 'failed' | 'unavailable';

export interface AdReward {
  type: string;
  amount: number;
}

class AdMobService {
  private state: AdState = 'idle';
  private testAdUnitId: string = ADMOB_TEST_REWARDED_UNIT_ID;
  private simulateNetworkFailure: boolean = false;
  private currentRewardCallback: ((reward: AdReward) => void) | null = null;
  private isRewardClaimed: boolean = false;

  constructor() {
    // Preload test ad on startup
    if (typeof window !== 'undefined') {
      setTimeout(() => this.preloadAd(), 1000);
    }
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

  public setSimulateNetworkFailure(fail: boolean): void {
    this.simulateNetworkFailure = fail;
  }

  public getSimulateNetworkFailure(): boolean {
    return this.simulateNetworkFailure;
  }

  /**
   * Preload a rewarded video ad
   */
  public async preloadAd(): Promise<boolean> {
    if (this.state === 'loading' || this.state === 'ready') {
      return this.state === 'ready';
    }

    this.state = 'loading';

    // Simulate network latency (0.8s - 1.5s)
    await new Promise((resolve) => setTimeout(resolve, 900));

    // Check offline or simulated failure
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline || this.simulateNetworkFailure) {
      this.state = 'unavailable';
      return false;
    }

    this.state = 'ready';
    return true;
  }

  /**
   * Prepare to show ad
   */
  public startAdSession(rewardType: string, amount: number, onReward: (reward: AdReward) => void): boolean {
    if (this.simulateNetworkFailure || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      this.state = 'unavailable';
      return false;
    }

    this.state = 'playing';
    this.isRewardClaimed = false;
    this.currentRewardCallback = onReward;
    return true;
  }

  /**
   * Claim the reward strictly once
   */
  public claimReward(rewardType: string, amount: number): boolean {
    if (this.isRewardClaimed) return false;
    this.isRewardClaimed = true;
    this.state = 'rewarded';

    if (this.currentRewardCallback) {
      this.currentRewardCallback({ type: rewardType, amount });
      this.currentRewardCallback = null;
    }

    // Schedule next ad preload in background
    setTimeout(() => {
      this.state = 'idle';
      this.preloadAd();
    }, 2000);

    return true;
  }

  /**
   * Complete current ad session
   */
  public completeCurrentAdSession(): void {
    this.state = 'rewarded';
  }

  /**
   * Dismiss current ad session
   */
  public dismissCurrentAdSession(): void {
    this.closeAdSession();
  }

  /**
   * Close ad session
   */
  public closeAdSession(): void {
    if (this.state !== 'rewarded') {
      this.state = 'idle';
      this.preloadAd();
    }
    this.currentRewardCallback = null;
  }
}

export const admob = new AdMobService();
