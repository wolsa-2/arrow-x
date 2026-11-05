import test from 'node:test';
import assert from 'node:assert/strict';
import { canArrowEscape, findEscapableArrows, calculateStars, getOccupiedCells, findArrowAtBoardCoord } from './rules';
import { validateLevelStructure, solveLevel, testAndValidateLevel } from './solver';
import { ALL_LEVELS, TOTAL_LEVELS_COUNT, getLevelById } from './levels';
import { Arrow, Obstacle } from './types';

test('Occupied cells returns correct footprint', () => {
  const single: Arrow = { id: 's1', x: 2, y: 3, direction: 'up' };
  assert.deepEqual(getOccupiedCells(single), [{ x: 2, y: 3 }]);
});

test('Arrow can escape towards unobstructed boundary in all 4 directions', () => {
  const cols = 5;
  const rows = 5;

  // Up: from (2, 2) to top boundary (2, 0)
  const arrowUp: Arrow = { id: 'u1', x: 2, y: 2, direction: 'up' };
  assert.equal(canArrowEscape(arrowUp, [arrowUp], [], cols, rows).canEscape, true);

  // Down: from (2, 2) to bottom boundary (2, 4)
  const arrowDown: Arrow = { id: 'd1', x: 2, y: 2, direction: 'down' };
  assert.equal(canArrowEscape(arrowDown, [arrowDown], [], cols, rows).canEscape, true);

  // Left: from (2, 2) to left boundary (0, 2)
  const arrowLeft: Arrow = { id: 'l1', x: 2, y: 2, direction: 'left' };
  assert.equal(canArrowEscape(arrowLeft, [arrowLeft], [], cols, rows).canEscape, true);

  // Right: from (2, 2) to right boundary (4, 2)
  const arrowRight: Arrow = { id: 'r1', x: 2, y: 2, direction: 'right' };
  assert.equal(canArrowEscape(arrowRight, [arrowRight], [], cols, rows).canEscape, true);
});

test('Arrow is blocked when another arrow stands in its escape path', () => {
  const cols = 5;
  const rows = 5;

  const arrowA: Arrow = { id: 'a', x: 2, y: 3, direction: 'up' };
  const blockerB: Arrow = { id: 'b', x: 2, y: 1, direction: 'right' };

  const result = canArrowEscape(arrowA, [arrowA, blockerB], [], cols, rows);
  assert.equal(result.canEscape, false);
  assert.equal(result.blocker?.id, 'b');
  assert.equal(result.blocker?.type, 'arrow');

  // But blocker B is pointing right, and has a clear path to (4, 1)
  const resultB = canArrowEscape(blockerB, [arrowA, blockerB], [], cols, rows);
  assert.equal(resultB.canEscape, true);

  // Once blocker B escapes, arrow A can escape!
  const escapable = findEscapableArrows([arrowA, blockerB], [], cols, rows);
  assert.equal(escapable.length, 1);
  assert.equal(escapable[0].id, 'b');
});

test('Arrow is blocked by obstacle on board and objects remain independent', () => {
  const cols = 5;
  const rows = 5;

  const arrow: Arrow = { id: 'a1', x: 2, y: 3, direction: 'up' };
  const obstacle: Obstacle = { id: 'obs1', x: 2, y: 2, type: 'rock' };

  // 1. Initial state
  const result = canArrowEscape(arrow, [arrow], [obstacle], cols, rows);
  assert.equal(result.canEscape, false);
  assert.equal(result.blocker?.id, 'obs1');
  assert.equal(result.blocker?.type, 'obstacle');

  // 2. Obstacle coordinates remain completely invariant
  assert.equal(obstacle.x, 2);
  assert.equal(obstacle.y, 2);
  assert.equal(obstacle.id, 'obs1');

  // 3. Arrow pointing left from (2, 3) does NOT hit obstacle at (2, 2)
  const arrowEscapingLeft: Arrow = { id: 'a2', x: 2, y: 3, direction: 'left' };
  const leftResult = canArrowEscape(arrowEscapingLeft, [arrowEscapingLeft], [obstacle], cols, rows);
  assert.equal(leftResult.canEscape, true);
  // Obstacle unchanged
  assert.equal(obstacle.x, 2);
  assert.equal(obstacle.y, 2);
});

test('Star calculation awards 1 to 3 stars correctly', () => {
  assert.equal(calculateStars(5, 5), 3); // exact par
  assert.equal(calculateStars(4, 5), 3); // under par
  assert.equal(calculateStars(6, 5), 2); // par + 1
  assert.equal(calculateStars(7, 5), 2); // par + 2
  assert.equal(calculateStars(8, 5), 1); // par + 3
});

test('All 200 levels pass structural validation and have verified solutions', () => {
  assert.equal(TOTAL_LEVELS_COUNT, 200, 'Must have exactly 200 levels in the core campaign suite');

  let totalArrowsSolved = 0;

  for (let i = 0; i < ALL_LEVELS.length; i++) {
    const level = ALL_LEVELS[i];
    const validation = testAndValidateLevel(level);

    if (!validation.valid || !validation.solvable) {
      assert.fail(`Level ${level.id} (${level.name}) failed validation: ${validation.errors.join(', ')}`);
    }

    assert.equal(validation.solvable, true, `Level ${level.id} must be solvable`);
    assert.equal(validation.solutionOrder.length, level.arrows.length, `Solution order must clear all arrows`);
    totalArrowsSolved += level.arrows.length;
  }

  assert.equal(ALL_LEVELS.length, 200, 'Campaign suite must contain 200 verified levels');
  assert.ok(totalArrowsSolved > 2000, `Solved a total of ${totalArrowsSolved} arrows across all 200 levels`);
});

test('Ultra Pro Max level generation satisfies complexity and solvability', () => {
  // Test a campaign Ultra Pro Max level (e.g. Level 180)
  const upmLevel = getLevelById(180);
  assert.equal(upmLevel.difficulty, 'ultra_pro_max');
  assert.ok(upmLevel.arrows.length >= 12, 'Ultra Pro Max must have high arrow count');
  const occupiedDots = upmLevel.arrows.reduce((sum, a) => sum + (a.points?.length || 1), 0);
  assert.ok(occupiedDots >= 40, 'Ultra Pro Max must have high arrow grid coverage with 3-13 dot arrows');

  const validation = testAndValidateLevel(upmLevel);
  assert.equal(validation.valid, true);
  assert.equal(validation.solvable, true);

  // Test procedural infinite generation beyond 200 (e.g. Level 250)
  const infiniteLevel = getLevelById(250);
  assert.equal(infiniteLevel.id, 250);
  assert.equal(infiniteLevel.difficulty, 'ultra_pro_max');

  const infiniteValidation = testAndValidateLevel(infiniteLevel);
  assert.equal(infiniteValidation.valid, true);
  assert.equal(infiniteValidation.solvable, true);
});

test('Level 7 coordinate mapping and path validation resolves exact intended arrows', () => {
  const l7 = getLevelById(7);
  assert.equal(l7.id, 7);
  const cellSize = 60; // 60px cell size

  // 1. Cell (5, 2) is occupied by a3. It must resolve to a3, never a2!
  const clickA3TailX = (5 + 0.5) * cellSize;
  const clickA3TailY = (2 + 0.8) * cellSize; // near bottom of cell (5, 2)
  const resolvedA3 = findArrowAtBoardCoord(l7.arrows, clickA3TailX, clickA3TailY, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA3?.id, 'a3', 'Tapping cell (5, 2) must strictly select a3');

  // a3 has clear escape path pointing up
  const a3Escape = canArrowEscape(resolvedA3!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows);
  assert.equal(a3Escape.canEscape, true, 'a3 must escape cleanly without obstruction');

  // 2. Cell (5, 3) is occupied by a2. It must resolve to a2.
  const clickA2HeadX = (5 + 0.5) * cellSize;
  const clickA2HeadY = (3 + 0.3) * cellSize;
  const resolvedA2 = findArrowAtBoardCoord(l7.arrows, clickA2HeadX, clickA2HeadY, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA2?.id, 'a2', 'Tapping cell (5, 3) must select a2');

  // While a3 is present, a2 is blocked by a3
  const a2Blocked = canArrowEscape(resolvedA2!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows);
  assert.equal(a2Blocked.canEscape, false, 'a2 is blocked by a3');
  assert.equal(a2Blocked.blocker?.id, 'a3');

  // Once a3 is removed, a2 can escape
  const activeWithoutA3 = l7.arrows.filter((a) => a.id !== 'a3');
  const a2AfterA3 = canArrowEscape(resolvedA2!, activeWithoutA3, l7.obstacles || [], l7.cols, l7.rows);
  assert.equal(a2AfterA3.canEscape, true, 'a2 escapes immediately once a3 is removed');

  // 3. Cell (4, 3) is occupied by a1.
  const clickA1X = (4 + 0.5) * cellSize;
  const clickA1Y = (3 + 0.5) * cellSize;
  const resolvedA1 = findArrowAtBoardCoord(l7.arrows, clickA1X, clickA1Y, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA1?.id, 'a1', 'Tapping cell (4, 3) selects a1');
  assert.equal(canArrowEscape(resolvedA1!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows).canEscape, false, 'a1 is blocked by a2');

  // Once a2 is removed, a1 can escape
  const activeWithoutA2 = activeWithoutA3.filter((a) => a.id !== 'a2');
  assert.equal(canArrowEscape(resolvedA1!, activeWithoutA2, l7.obstacles || [], l7.cols, l7.rows).canEscape, true, 'a1 escapes once a2 is removed');

  // 4. Test remaining clear arrows in Level 7
  // a7 (1, 0) pointing left
  const resolvedA7 = findArrowAtBoardCoord(l7.arrows, (1 + 0.5) * cellSize, (0 + 0.5) * cellSize, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA7?.id, 'a7');
  assert.equal(canArrowEscape(resolvedA7!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows).canEscape, true);

  // a6 (0, 5) pointing down
  const resolvedA6 = findArrowAtBoardCoord(l7.arrows, (0 + 0.5) * cellSize, (5 + 0.5) * cellSize, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA6?.id, 'a6');
  assert.equal(canArrowEscape(resolvedA6!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows).canEscape, true);

  // a5 (1, 3) pointing down
  const resolvedA5 = findArrowAtBoardCoord(l7.arrows, (1 + 0.5) * cellSize, (3 + 0.5) * cellSize, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA5?.id, 'a5');
  assert.equal(canArrowEscape(resolvedA5!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows).canEscape, true);

  // a4 (2, 5) pointing down
  const resolvedA4 = findArrowAtBoardCoord(l7.arrows, (2 + 0.5) * cellSize, (5 + 0.5) * cellSize, cellSize, l7.cols, l7.rows);
  assert.equal(resolvedA4?.id, 'a4');
  assert.equal(canArrowEscape(resolvedA4!, l7.arrows, l7.obstacles || [], l7.cols, l7.rows).canEscape, true);

  // 5. Tapping far empty space returns null
  const emptyTap = findArrowAtBoardCoord(l7.arrows, (0 + 0.5) * cellSize, (0 + 0.5) * cellSize, cellSize, l7.cols, l7.rows);
  assert.equal(emptyTap, null, 'Empty cell (0, 0) returns null');
});

