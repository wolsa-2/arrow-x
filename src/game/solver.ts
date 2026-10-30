import { Arrow, LevelData } from './types';
import { canArrowEscape, getOccupiedCells } from './rules';

export interface LevelValidationResult {
  valid: boolean;
  solvable: boolean;
  errors: string[];
  solutionOrder: string[];
  totalArrows: number;
}

/**
 * Validates structural integrity and solvability of a level.
 */
export function validateLevelStructure(level: LevelData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (level.cols < 3 || level.rows < 3) {
    errors.push(`Level ${level.id}: Board dimensions too small (${level.cols}x${level.rows})`);
  }

  if (!level.arrows || level.arrows.length === 0) {
    errors.push(`Level ${level.id}: No arrows defined`);
  }

  const occupiedCells = new Map<string, string>();

  // Check obstacles
  if (level.obstacles) {
    for (const obs of level.obstacles) {
      if (obs.x < 0 || obs.x >= level.cols || obs.y < 0 || obs.y >= level.rows) {
        errors.push(`Level ${level.id}: Obstacle ${obs.id} out of bounds at (${obs.x},${obs.y})`);
      }
      const key = `${obs.x},${obs.y}`;
      occupiedCells.set(key, `obstacle-${obs.id}`);
    }
  }

  // Check arrows
  const seenArrowIds = new Set<string>();
  for (const arrow of level.arrows) {
    if (seenArrowIds.has(arrow.id)) {
      errors.push(`Level ${level.id}: Duplicate arrow ID ${arrow.id}`);
    }
    seenArrowIds.add(arrow.id);

    if (!['up', 'down', 'left', 'right'].includes(arrow.direction)) {
      errors.push(`Level ${level.id}: Invalid arrow direction ${arrow.direction} on ${arrow.id}`);
    }

    const cells = getOccupiedCells(arrow);
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= level.cols || cell.y < 0 || cell.y >= level.rows) {
        errors.push(`Level ${level.id}: Arrow ${arrow.id} cell out of bounds at (${cell.x},${cell.y})`);
      }
      const key = `${cell.x},${cell.y}`;
      if (occupiedCells.has(key)) {
        errors.push(`Level ${level.id}: Overlapping cell (${cell.x},${cell.y}) between ${arrow.id} and ${occupiedCells.get(key)}`);
      }
      occupiedCells.set(key, arrow.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Solves a level by simulating valid escape moves.
 * In Arrow Escape, removing an unblocked arrow never blocks another arrow (monotonic unblocking property).
 * Hence, greedy removal of any escapable arrow correctly decides solvability.
 */
export function solveLevel(level: LevelData): {
  solvable: boolean;
  solutionOrder: string[];
  remainingArrows: Arrow[];
} {
  const active: Arrow[] = [...level.arrows];
  const solutionOrder: string[] = [];
  const obstacles = level.obstacles || [];

  let madeProgress = true;
  while (active.length > 0 && madeProgress) {
    madeProgress = false;

    // Find the first arrow that can escape
    for (let i = 0; i < active.length; i++) {
      const candidate = active[i];
      const check = canArrowEscape(candidate, active, obstacles, level.cols, level.rows);
      if (check.canEscape) {
        solutionOrder.push(candidate.id);
        active.splice(i, 1);
        madeProgress = true;
        break;
      }
    }
  }

  return {
    solvable: active.length === 0,
    solutionOrder,
    remainingArrows: active,
  };
}

/**
 * Validates and solves a level completely.
 */
export function testAndValidateLevel(level: LevelData): LevelValidationResult {
  const structCheck = validateLevelStructure(level);
  if (!structCheck.valid) {
    return {
      valid: false,
      solvable: false,
      errors: structCheck.errors,
      solutionOrder: [],
      totalArrows: level.arrows.length,
    };
  }

  const solveResult = solveLevel(level);
  const errors: string[] = [];
  if (!solveResult.solvable) {
    errors.push(
      `Level ${level.id} (${level.name}) is NOT solvable! ${solveResult.remainingArrows.length} arrows deadlocked.`
    );
  }

  return {
    valid: structCheck.valid && solveResult.solvable,
    solvable: solveResult.solvable,
    errors,
    solutionOrder: solveResult.solutionOrder,
    totalArrows: level.arrows.length,
  };
}

export interface ComplexityMetrics {
  solvable: boolean;
  totalArrows: number;
  initialEscapableCount: number;
  averageBranchingFactor: number;
  maxBranchingFactor: number;
  criticalBottlenecks: number;
  solutionLength: number;
  density: number;
}

/**
 * Analyzes strategic complexity, bottleneck steps, and solution depth.
 * Used to ensure Ultra Pro Max levels provide genuine high-order puzzle depth.
 */
export function analyzeLevelComplexity(level: LevelData): ComplexityMetrics {
  const active: Arrow[] = [...level.arrows];
  const obstacles = level.obstacles || [];
  let step = 0;
  let initialEscapableCount = 0;
  let totalBranching = 0;
  let maxBranching = 0;
  let criticalBottlenecks = 0;

  const totalCells = level.cols * level.rows;
  let occupiedCellCount = 0;
  for (const a of level.arrows) {
    occupiedCellCount += getOccupiedCells(a).length;
  }
  const density = totalCells > 0 ? occupiedCellCount / totalCells : 0;

  while (active.length > 0) {
    // Find all escapable arrows at this exact state
    const escapable: Arrow[] = [];
    for (const arrow of active) {
      if (canArrowEscape(arrow, active, obstacles, level.cols, level.rows).canEscape) {
        escapable.push(arrow);
      }
    }

    if (step === 0) {
      initialEscapableCount = escapable.length;
    }

    if (escapable.length === 0) {
      // Deadlocked
      return {
        solvable: false,
        totalArrows: level.arrows.length,
        initialEscapableCount,
        averageBranchingFactor: step > 0 ? totalBranching / step : 0,
        maxBranchingFactor: maxBranching,
        criticalBottlenecks,
        solutionLength: step,
        density,
      };
    }

    if (escapable.length === 1) {
      criticalBottlenecks++;
    }

    totalBranching += escapable.length;
    if (escapable.length > maxBranching) {
      maxBranching = escapable.length;
    }

    // Greedily remove first escapable
    const toRemove = escapable[0];
    const idx = active.findIndex((a) => a.id === toRemove.id);
    active.splice(idx, 1);
    step++;
  }

  return {
    solvable: true,
    totalArrows: level.arrows.length,
    initialEscapableCount,
    averageBranchingFactor: step > 0 ? totalBranching / step : 0,
    maxBranchingFactor: maxBranching,
    criticalBottlenecks,
    solutionLength: step,
    density,
  };
}
