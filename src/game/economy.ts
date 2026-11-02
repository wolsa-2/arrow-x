/**
 * Centralized Economy Configuration for ARROW X
 * Defines all coin rewards, shop prices, game over costs, and life parameters.
 */

export const ECONOMY_CONFIG = {
  // Coin & Life Rewards
  REWARDS: {
    REWARDED_AD_COINS: 50,
    REWARDED_AD_LIVES: 3, // Rewarded video ad now grants full +3 Lives!
    DAILY_LOGIN_COINS: 25,
    LEVEL_COMPLETION_COINS: 0,
    LEVEL_REPLAY_COINS: 0,
  },

  // Shop Item Prices (in Coins)
  SHOP_PRICES: {
    HINT: 50,
    UNDO: 100,
    EXTRA_LIFE: 100,
  },

  // Shop Item Grant Quantities
  SHOP_GRANTS: {
    HINT_COUNT: 3,
    UNDO_COUNT: 5,
    LIFE_COUNT: 1,
  },

  // Game Over Action Costs
  GAME_OVER: {
    REFILL_3_LIVES_COINS: 200,
    WATCH_AD_LIVES: 3,
  },

  // Starting Balances
  STARTING_BALANCES: {
    COINS: 100,
    HEARTS: 3,
    MAX_HEARTS: 3,
    HINTS: 3,
    BOMBS: 1,
    UNDOS: 3,
  },
} as const;
