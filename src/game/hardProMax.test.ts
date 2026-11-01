import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_ARROW_PATTERNS, generatePatternPoints } from './arrowPatterns';
import { getLevelById, ALL_LEVELS } from './levels';
import { solveLevel, analyzeLevelComplexity } from './solver';
import { canArrowEscape } from './rules';
import { Direction } from './types';

test('All 10 arrow path patterns generate valid non-intersecting paths', () => {
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  const cols = 12;
  const rows = 12;

  for (const pattern of ALL_ARROW_PATTERNS) {
    let generatedCount = 0;

    for (const dir of directions) {
      // Pick interior head so multi-bend paths have ample runway
      const headX = 6;
      const headY = 6;
      const occupied = new Set<string>();

      const pts = generatePatternPoints(
        pattern,
        headX,
        headY,
        dir,
        7, // target length 7
        cols,
        rows,
        occupied
      );

      assert.ok(pts !== null, `Pattern ${pattern} must generate points for direction ${dir}`);
      assert.ok(pts.length >= 3, `Pattern ${pattern} length must be >= 3`);

      // Verify head is at pts[pts.length - 1]
      const headPt = pts[pts.length - 1];
      assert.equal(headPt.x, headX, `Head X must match for ${pattern}`);
      assert.equal(headPt.y, headY, `Head Y must match for ${pattern}`);

      // Verify no duplicate cells (no self-intersection)
      const set = new Set(pts.map((p) => `${p.x},${p.y}`));
      assert.equal(set.size, pts.length, `Pattern ${pattern} must not self-intersect`);

      // Verify orthogonal connectivity between successive points
      for (let i = 1; i < pts.length; i++) {
        const stepDist: number = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
        assert.equal(stepDist, 1, `Points must be strictly orthogonally adjacent in ${pattern}`);
      }

      generatedCount++;
    }

    assert.equal(generatedCount, 4, `All 4 directions must work for pattern ${pattern}`);
  }
});

test('Arrow lengths span from 3 to 13 grid dots across generated campaign suite', () => {
  let minLength = 999;
  let maxLength = 0;
  const lengthDistribution = new Map<number, number>();

  for (const level of ALL_LEVELS) {
    for (const arrow of level.arrows) {
      const len = arrow.points ? arrow.points.length : (arrow.length || 1);
      minLength = Math.min(minLength, len);
      maxLength = Math.max(maxLength, len);
      lengthDistribution.set(len, (lengthDistribution.get(len) || 0) + 1);
    }
  }

  assert.equal(minLength, 3, 'Minimum arrow length must be 3 dots');
  assert.ok(maxLength >= 10, 'Maximum arrow length must reach at least 10-13 dots');
  assert.ok(maxLength <= 13, 'Maximum arrow length must not exceed 13 dots');
});

test('Every Hard Pro Max level requires logical thinking (limited initial openings)', () => {
  // Test sample levels across all tiers
  const sampleLevelIds = [1, 10, 25, 50, 75, 100, 150, 200];

  for (const id of sampleLevelIds) {
    const level = getLevelById(id);
    const complexity = analyzeLevelComplexity(level);

    assert.equal(complexity.solvable, true, `Level ${id} must be 100% solvable`);
    assert.ok(
      complexity.initialEscapableCount < complexity.totalArrows,
      `Level ${id} must have blocked arrows in dependency chains`
    );
    assert.ok(
      complexity.initialEscapableCount <= Math.max(5, Math.ceil(complexity.totalArrows * 0.5)),
      `Level ${id} initial openings (${complexity.initialEscapableCount}/${complexity.totalArrows}) must be restricted to demand logical deduction`
    );
    assert.ok(
      complexity.criticalBottlenecks >= 1,
      `Level ${id} must contain dependency bottlenecks`
    );
    assert.ok(
      complexity.totalArrows >= 6,
      `Level ${id} must have at least 6 arrows for real puzzle depth`
    );
    assert.ok(
      complexity.density >= 0.20,
      `Level ${id} must have solid board density (got ${complexity.density.toFixed(2)})`
    );
  }
});

test('Level 1 is a genuine Hard Pro Max puzzle with 3+ dot arrows', () => {
  const l1 = getLevelById(1);
  assert.ok(l1.arrows.length >= 6, 'Level 1 must have at least 6 arrows');
  assert.ok(l1.cols >= 5 && l1.rows >= 5, 'Level 1 must be at least 5x5 board');

  for (const arrow of l1.arrows) {
    assert.ok(arrow.points && arrow.points.length >= 3, 'Level 1 arrows must have length >= 3');
  }

  const solveRes = solveLevel(l1);
  assert.equal(solveRes.solvable, true, 'Level 1 must be verified solvable');
});

test('No unwanted obstacles or X icons exist in any campaign or procedural level', () => {
  // Test Level 52 specifically
  const lvl52 = getLevelById(52);
  assert.equal(lvl52.obstacles, undefined, 'Level 52 must not have obstacles');

  // Test sample across all difficulty tiers and procedural progression
  const testIds = [1, 27, 30, 52, 54, 81, 82, 111, 141, 171, 200, 205, 250];
  for (const id of testIds) {
    const lvl = getLevelById(id);
    assert.equal(lvl.obstacles, undefined, `Level ${id} must have no obstacles`);
  }
});
