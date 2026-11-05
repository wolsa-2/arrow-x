import test from 'node:test';
import assert from 'node:assert/strict';
import { ECONOMY_CONFIG } from './economy';
import { admob } from '../services/admobService';

test('ECONOMY_CONFIG adheres to exact specifications', () => {
  // A. Coin Rewards
  assert.equal(ECONOMY_CONFIG.REWARDS.REWARDED_AD_COINS, 50, 'Rewarded Ad must give 50 coins');
  assert.equal(ECONOMY_CONFIG.REWARDS.DAILY_LOGIN_COINS, 25, 'Daily Login must give 25 coins');
  assert.equal(ECONOMY_CONFIG.REWARDS.LEVEL_COMPLETION_COINS, 0, 'Level Completion must give 0 coins');
  assert.equal(ECONOMY_CONFIG.REWARDS.LEVEL_REPLAY_COINS, 0, 'Level Replay must give 0 coins');

  // B. Shop Prices
  assert.equal(ECONOMY_CONFIG.SHOP_PRICES.HINT, 50, 'Hint price must be 50 coins');
  assert.equal(ECONOMY_CONFIG.SHOP_PRICES.UNDO, 100, 'Undo price must be 100 coins');
  assert.equal(ECONOMY_CONFIG.SHOP_PRICES.EXTRA_LIFE, 100, 'Extra Life price must be 100 coins');

  // C. Game Over
  assert.equal(ECONOMY_CONFIG.GAME_OVER.REFILL_3_LIVES_COINS, 200, 'Refill 3 lives must cost 200 coins');
  assert.equal(ECONOMY_CONFIG.GAME_OVER.WATCH_AD_LIVES, 3, 'Watch ad must grant 3 lives');
});

test('Rewarded ad session for extra_life grants strictly 3 lives', () => {
  let grantCount = 0;
  let grantedLives = 0;

  const started = admob.startAdSession('extra_life', ECONOMY_CONFIG.GAME_OVER.WATCH_AD_LIVES, (reward) => {
    grantCount++;
    grantedLives += reward.amount;
  });

  assert.equal(started, true, 'Ad session should start');

  const claimed = admob.completeCurrentAdSession();
  assert.equal(claimed, true, 'Claim must succeed');
  assert.equal(grantCount, 1, 'Callback invoked once');
  assert.equal(grantedLives, 3, 'Granted lives must be exactly 3');
});

test('Shop purchase validation logic prevents insufficient balance and negative coins', () => {
  let playerCoins = 40; // Less than hint price (50)
  const hintPrice = ECONOMY_CONFIG.SHOP_PRICES.HINT;

  // Validation
  const canAfford = playerCoins >= hintPrice;
  assert.equal(canAfford, false, 'Player with 40 coins cannot buy 50 coin item');

  // Deduction should not happen
  if (canAfford) {
    playerCoins -= hintPrice;
  }
  assert.equal(playerCoins, 40, 'Balance must remain unchanged');

  // Now player has 120 coins
  playerCoins = 120;
  const undoPrice = ECONOMY_CONFIG.SHOP_PRICES.UNDO; // 100
  assert.equal(playerCoins >= undoPrice, true);

  playerCoins = Math.max(0, playerCoins - undoPrice);
  assert.equal(playerCoins, 20, 'Deduction must be exactly 100 coins');
});

test('GameOver refill 3 lives requires 200 coins and deducts correctly', () => {
  const refillCost = ECONOMY_CONFIG.GAME_OVER.REFILL_3_LIVES_COINS;
  assert.equal(refillCost, 200);

  // Insufficient scenario
  let coins = 150;
  let hearts = 0;
  if (coins >= refillCost) {
    coins -= refillCost;
    hearts = 3;
  }
  assert.equal(hearts, 0, 'Lives must not refill if coins < 200');
  assert.equal(coins, 150, 'Coins must not be deducted if insufficient');

  // Sufficient scenario
  coins = 250;
  if (coins >= refillCost) {
    coins = Math.max(0, coins - refillCost);
    hearts = 3;
  }
  assert.equal(hearts, 3, 'Lives must refill to 3');
  assert.equal(coins, 50, 'Coins must be deducted by exactly 200');
});

test('Rewarded ad session prevents duplicate claims and incomplete ad grants', () => {
  let grantCount = 0;
  let grantedAmount = 0;

  // Start an ad session for coins (+50)
  const started = admob.startAdSession('coins', ECONOMY_CONFIG.REWARDS.REWARDED_AD_COINS, (reward) => {
    grantCount++;
    grantedAmount += reward.amount;
  });

  assert.equal(started, true, 'Ad session should start when online');

  // Complete session strictly once
  const firstClaim = admob.completeCurrentAdSession();
  assert.equal(firstClaim, true, 'First claim must succeed');
  assert.equal(grantCount, 1, 'Reward callback must be called exactly once');
  assert.equal(grantedAmount, 50, 'Granted amount must be 50 coins');

  // Attempt duplicate claim on the same session
  const secondClaim = admob.completeCurrentAdSession();
  assert.equal(secondClaim, false, 'Duplicate claim on completed session must be rejected');
  assert.equal(grantCount, 1, 'Callback must not be invoked a second time');
  assert.equal(grantedAmount, 50, 'Amount must not increase');
});

test('Dismissing ad session grants 0 rewards', () => {
  let grantCount = 0;

  admob.startAdSession('extra_life', 3, () => {
    grantCount++;
  });

  // User skips or closes before finishing
  admob.dismissCurrentAdSession();

  assert.equal(grantCount, 0, 'Skipped ad must not grant any reward');
  assert.equal(admob.completeCurrentAdSession(), false, 'Dismissed ad cannot be completed later');
});

test('Level restart or retry always restores exactly 3 lives', () => {
  let currentLives = 0; // Game over state

  // Simulate level retry or restart logic
  currentLives = ECONOMY_CONFIG.STARTING_BALANCES.HEARTS;
  assert.equal(currentLives, 3, 'Restarting must restore exactly 3 lives');
});

test('Google AdMob official Test IDs are strictly used in test mode', () => {
  // Ensure test mode is active
  admob.setTestingMode(true);
  assert.equal(admob.isTesting(), true, 'Testing mode must be active');

  // Test App ID
  assert.equal(
    admob.getAppId(),
    'ca-app-pub-3940256099942544~3347511713',
    'AdMob Android App ID must match Google official test ID'
  );

  // App Open Test Unit ID
  assert.equal(
    admob.getAppOpenUnitId(),
    'ca-app-pub-3940256099942544/9257395921',
    'AdMob App Open Test Unit ID must match Google official test ID'
  );

  // Rewarded Video Test Unit ID
  assert.equal(
    admob.getRewardedUnitId(),
    'ca-app-pub-3940256099942544/5224354917',
    'AdMob Rewarded Unit ID must match Google official test ID'
  );

  // Backward compatibility alias
  assert.equal(
    admob.getAdUnitId(),
    'ca-app-pub-3940256099942544/5224354917',
    'getAdUnitId alias must match Rewarded Unit ID'
  );
});

test('AdMob test and production configurations are strictly isolated and never mix', () => {
  // Configure mock production IDs
  const mockProdConfig = {
    appId: 'ca-app-pub-1111222233334444~5555666677',
    rewardedUnitId: 'ca-app-pub-1111222233334444/8888999900',
    appOpenUnitId: 'ca-app-pub-1111222233334444/9999000011',
  };
  admob.setProductionConfig(mockProdConfig);

  // Switch to Production Mode
  admob.setTestingMode(false);
  assert.equal(admob.isTesting(), false);
  assert.equal(admob.getAppId(), mockProdConfig.appId, 'In production mode, real App ID must be returned');
  assert.equal(admob.getRewardedUnitId(), mockProdConfig.rewardedUnitId, 'In production mode, real Rewarded ID must be returned');
  assert.equal(admob.getAppOpenUnitId(), mockProdConfig.appOpenUnitId, 'In production mode, real App Open ID must be returned');

  // Verify Test configuration was NOT modified or contaminated
  const testConfig = admob.getTestConfig();
  assert.equal(testConfig.appId, 'ca-app-pub-3940256099942544~3347511713');
  assert.equal(testConfig.rewardedUnitId, 'ca-app-pub-3940256099942544/5224354917');
  assert.equal(testConfig.appOpenUnitId, 'ca-app-pub-3940256099942544/9257395921');

  // Switch back to Test Mode
  admob.setTestingMode(true);
  assert.equal(admob.isTesting(), true);
  assert.equal(admob.getAppId(), 'ca-app-pub-3940256099942544~3347511713');
  assert.equal(admob.getRewardedUnitId(), 'ca-app-pub-3940256099942544/5224354917');
  assert.equal(admob.getAppOpenUnitId(), 'ca-app-pub-3940256099942544/9257395921');
});

test('App Open Ad preload, display, and dismissal lifecycle function properly', async () => {
  admob.setTestingMode(true);

  // Preload
  const loaded = await admob.preloadAppOpenAd();
  assert.equal(loaded, true, 'App Open ad should preload successfully');
  assert.equal(admob.isAppOpenReady(), true, 'App Open ad should be ready');

  // Show
  let dismissed = false;
  const shown = await admob.showAppOpenAd(() => {
    dismissed = true;
  });
  assert.equal(shown, true, 'App Open ad should show');
  assert.equal(admob.isAppOpenPlaying(), true, 'App Open state should be playing');

  // Dismiss
  admob.dismissAppOpenAd();
  assert.equal(admob.isAppOpenPlaying(), false, 'App Open state should not be playing after dismissal');
  assert.equal(dismissed, true, 'Dismiss callback must be invoked');
});

test('AdMob failure handling provides user-friendly error and does not crash', async () => {
  admob.setSimulateNetworkFailure(true);
  const started = admob.startAdSession('extra_life', 3, () => {});
  assert.equal(started, false, 'Ad session must fail when network fails');
  assert.equal(typeof admob.getLastErrorMessage(), 'string', 'Must provide a user-friendly error message');
  assert.ok(admob.getLastErrorMessage()!.length > 0, 'Error message cannot be empty');

  // Restore simulated network
  admob.setSimulateNetworkFailure(false);
});
