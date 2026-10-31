/**
 * Arrow Escape Puzzle - Game Types
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export type ArrowColor = 'cyan' | 'teal' | 'coral' | 'amber' | 'violet' | 'indigo' | 'emerald' | 'rose';

export interface Arrow {
  id: string;
  x: number; // 0-indexed column (head position)
  y: number; // 0-indexed row (head position)
  direction: Direction;
  color?: ArrowColor;
  length?: number; // 1 = 1x1 cell, 2 = 1x2 or 2x1 cell
  points?: Array<{ x: number; y: number }>; // Full orthogonal path from tail to head
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  type?: 'rock' | 'block';
}

export type Difficulty =
  | 'tutorial'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'master'
  | 'ultra_pro'
  | 'ultra_pro_max';

export interface LevelData {
  id: number;
  name: string;
  cols: number;
  rows: number;
  arrows: Arrow[];
  obstacles?: Obstacle[];
  parMoves: number;
  difficulty: Difficulty;
  tip?: string;
}

export interface MoveStep {
  arrow: Arrow;
  remainingArrows: Arrow[];
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number; // 1, 2, or 3
  bestMoves: number;
  bestTimeSeconds: number;
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  theme: 'dark' | 'light';
  timerEnabled: boolean;
}

export interface SavedProgress {
  highestUnlockedLevel: number;
  levels: Record<number, LevelProgress>;
  totalStars: number;
  coins: number;
  hintsCount: number;
  bombsCount: number;
  undosCount: number;
  dailyStreak: number;
  lastClaimDate?: string;
  dailyRewardsClaimed?: number[];
  dailyChallengeDate?: string;
  dailyChallengeCompleted?: boolean;
  hearts?: number;
  lastHeartLossTime?: number;
}

export type AdMobRewardType = 'extra_life' | 'coins' | 'hint';
