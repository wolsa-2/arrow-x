import test from 'node:test';
import assert from 'node:assert/strict';
import { canArrowEscape, findEscapableArrows, calculateStars, getOccupiedCells } from './rules';
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
  assert.ok(upmLevel.arrows.length >= 20, 'Ultra Pro Max must have high arrow density');

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
