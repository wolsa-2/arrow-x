import { LevelData } from './types';
import { buildAllLevels, buildLevelForId } from './levelGenerator';

// Compute the complete 200-level suite across all 8 tiers
export const ALL_LEVELS: LevelData[] = buildAllLevels();

export const TOTAL_LEVELS_COUNT = ALL_LEVELS.length; // 200

/**
 * Returns level data for any ID.
 * If ID is within 1..TOTAL_LEVELS_COUNT, returns the cached campaign level.
 * If ID is > TOTAL_LEVELS_COUNT, generates on-demand for infinite procedural progression.
 */
export function getLevelById(id: number): LevelData {
  if (id >= 1 && id <= TOTAL_LEVELS_COUNT) {
    const found = ALL_LEVELS.find((l) => l.id === id);
    if (found) return found;
  }
  return buildLevelForId(id);
}
