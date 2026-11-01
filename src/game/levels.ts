import { LevelData, Arrow } from './types';
import { buildLevelForId, buildAllLevels } from './levelGenerator';
import precomputedCampaignLevels from './campaignLevels.json';

// Fast precomputed and verified 200-level core campaign suite (instant cold start)
export const ALL_LEVELS: LevelData[] = precomputedCampaignLevels as LevelData[];

export const TOTAL_LEVELS_COUNT = ALL_LEVELS.length; // 200
export { buildAllLevels };

/**
 * Deep clones an arrow array ensuring no mutable reference sharing.
 */
export function cloneArrows(arrows: Arrow[]): Arrow[] {
  return arrows.map((a) => ({
    ...a,
    points: a.points ? a.points.map((p) => ({ ...p })) : undefined,
  }));
}

/**
 * Deep clones a LevelData object so gameplay mutations never corrupt original cached levels.
 */
export function cloneLevel(level: LevelData): LevelData {
  return {
    ...level,
    arrows: cloneArrows(level.arrows),
    obstacles: level.obstacles ? level.obstacles.map((o) => ({ ...o })) : undefined,
  };
}

/**
 * Returns pristine, deep-cloned level data for any ID.
 * If ID is within 1..TOTAL_LEVELS_COUNT, returns a fresh copy of the cached campaign level.
 * If ID is > TOTAL_LEVELS_COUNT, generates on-demand for infinite procedural progression.
 */
export function getLevelById(id: number): LevelData {
  if (id >= 1 && id <= TOTAL_LEVELS_COUNT) {
    const found = ALL_LEVELS.find((l) => l.id === id);
    if (found) return cloneLevel(found);
  }
  return cloneLevel(buildLevelForId(id));
}
