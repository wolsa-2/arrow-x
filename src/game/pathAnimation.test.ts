import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildArrowTrack,
  getArrowRenderData,
  getSlicedArrowRenderData,
  getPointAndTangentAtDistance,
  slicePolylineByArcLength,
} from './pathAnimation';
import { Arrow } from './types';

test('Straight arrow track creates linear trajectory and exits off-board', () => {
  const straight: Arrow = { id: 's1', x: 2, y: 2, direction: 'up' };
  const cellSize = 60;
  const track = buildArrowTrack(straight, cellSize, 5, 5);

  assert.equal(track.direction, 'up');
  assert.equal(track.isBent, false);
  assert.ok(track.totalDurationMs > 0);

  // At rest (elapsed = 0), render data matches initial position pointing up
  const restData = getArrowRenderData(track, 0);
  assert.ok(restData !== null);
  assert.equal(restData.tangent.x, 0);
  assert.equal(restData.tangent.y, -1);

  // Mid-exit (e.g. 50% elapsed), arrow translates upward along (0, -1)
  const midData = getArrowRenderData(track, track.totalDurationMs * 0.5);
  assert.ok(midData !== null);
  assert.equal(midData.tangent.x, 0);
  assert.equal(midData.tangent.y, -1);
  assert.ok(midData.tip.y < restData.tip.y, 'Arrow should move upward');

  // At completion (elapsed >= totalDurationMs), returns null (exited completely)
  const exitData = getArrowRenderData(track, track.totalDurationMs);
  assert.equal(exitData, null);
});

test('L-shaped arrow follows snake-like path preserving corner geometry without straightening', () => {
  // L-shaped arrow: tail at (1, 3), corner at (2, 3), head at (2, 1) pointing UP
  const lArrow: Arrow = {
    id: 'l1',
    x: 2,
    y: 1,
    direction: 'up',
    points: [
      { x: 1, y: 3 }, // tail
      { x: 2, y: 3 }, // corner
      { x: 2, y: 1 }, // head
    ],
  };

  const cellSize = 60;
  const track = buildArrowTrack(lArrow, cellSize, 5, 5);

  assert.equal(track.isBent, true);
  assert.ok(track.totalDurationMs > 0);

  // 1. At rest (elapsed = 0):
  const restData = getArrowRenderData(track, 0);
  assert.ok(restData !== null);
  // Corner at x=150, y=210 is present in resting polyline
  assert.ok(restData.pathD.includes('150.0 210.0'), 'Resting arrow must include corner at (150, 210)');
  assert.equal(restData.tangent.x, 0);
  assert.equal(restData.tangent.y, -1);

  // 2. Early in escape (e.g. 15% duration):
  // Head has moved forward into the exit ray, tail is advancing towards the corner.
  // The corner MUST STILL BE IN THE PATH! The arrow MUST NOT be straightened!
  const earlyData = getArrowRenderData(track, track.totalDurationMs * 0.15);
  assert.ok(earlyData !== null);
  assert.ok(
    earlyData.pathD.includes('150.0 210.0'),
    'Early in snake escape, corner must remain in path without straightening'
  );
  // Tangent at arrowhead remains UP
  assert.equal(earlyData.tangent.x, 0);
  assert.equal(earlyData.tangent.y, -1);
  // Head has advanced upward
  assert.ok(earlyData.tip.y < restData.tip.y, 'Arrowhead must advance forward in exit direction');

  // 3. Later in escape (e.g. 70% duration):
  // Tail has passed the corner; now the entire remaining body is on the vertical escape ray
  const lateData = getArrowRenderData(track, track.totalDurationMs * 0.7);
  assert.ok(lateData !== null);
  assert.ok(lateData.tip.y < earlyData.tip.y, 'Arrow must continue exiting off-board');

  // 4. Completed exit:
  const doneData = getArrowRenderData(track, track.totalDurationMs);
  assert.equal(doneData, null, 'Should return null when completely exited');
});

test('U-shaped multi-turn arrow snakes through both corners sequentially', () => {
  // U-shaped arrow with 2 90-degree corners:
  // (1, 1) -> (1, 3) [corner 1] -> (3, 3) [corner 2] -> (3, 1) [head pointing UP]
  const uArrow: Arrow = {
    id: 'u1',
    x: 3,
    y: 1,
    direction: 'up',
    points: [
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 1 },
    ],
  };

  const cellSize = 50;
  const track = buildArrowTrack(uArrow, cellSize, 6, 6);
  assert.equal(track.isBent, true);

  // At rest: both corners (75, 175) and (175, 175) must exist
  const r0 = getArrowRenderData(track, 0);
  assert.ok(r0 !== null);
  assert.ok(r0.pathD.includes('75.0 175.0'), 'Must contain first corner');
  assert.ok(r0.pathD.includes('175.0 175.0'), 'Must contain second corner');

  // During early movement (10% duration): both corners must STILL be in the snake body!
  const rEarly = getArrowRenderData(track, track.totalDurationMs * 0.1);
  assert.ok(rEarly !== null);
  assert.ok(rEarly.pathD.includes('75.0 175.0'), 'Early snake must retain first corner');
  assert.ok(rEarly.pathD.includes('175.0 175.0'), 'Early snake must retain second corner');

  // At end of exit
  const rExit = getArrowRenderData(track, track.totalDurationMs);
  assert.equal(rExit, null, 'U-arrow must exit completely');
});

test('slicePolylineByArcLength maintains exact constant body length during traversal', () => {
  const vertices = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },   // corner 1
    { x: 100, y: 100 }, // corner 2
    { x: 100, y: 500 }, // exit ray
  ];
  const cumDist = [0, 100, 200, 600];
  const arrowLen = 200;

  // Test across multiple sample travel distances
  for (const s of [0, 25, 50, 100, 150, 250, 350]) {
    const uStart = s;
    const uEnd = s + arrowLen;
    const pts = slicePolylineByArcLength(vertices, cumDist, uStart, uEnd);

    assert.ok(pts.length >= 2, `Slice at s=${s} must have at least 2 points`);

    // Calculate total length of sliced polyline
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }

    assert.ok(
      Math.abs(len - arrowLen) < 0.2,
      `Sliced length at s=${s} must equal ${arrowLen}, got ${len}`
    );
  }
});

test('Compatibility helper getSlicedArrowRenderData and getPointAndTangentAtDistance work as expected', () => {
  const straight: Arrow = { id: 'compat1', x: 2, y: 2, direction: 'right' };
  const track = buildArrowTrack(straight, 60, 5, 5);

  const at0 = getSlicedArrowRenderData(track, 0);
  assert.ok(at0 !== null);
  assert.equal(at0.tangent.x, 1);
  assert.equal(at0.tangent.y, 0);

  const at1 = getSlicedArrowRenderData(track, 1);
  assert.equal(at1, null);

  const sample = getPointAndTangentAtDistance(track, 10);
  assert.equal(sample.tangent.x, 1);
  assert.equal(sample.tangent.y, 0);
});
