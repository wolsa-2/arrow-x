import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildArrowTrack,
  getArrowRenderData,
  getSlicedArrowRenderData,
  getPointAndTangentAtDistance,
} from './pathAnimation';
import { Arrow } from './types';

test('Straight arrow track recognizes isBent=false and transitions directly to exit translation', () => {
  const straight: Arrow = { id: 's1', x: 2, y: 2, direction: 'up' };
  const cellSize = 60;
  const track = buildArrowTrack(straight, cellSize, 5, 5);

  assert.equal(track.direction, 'up');
  assert.equal(track.isBent, false);
  assert.equal(track.straightenDurationMs, 0);
  assert.ok(track.totalDurationMs > 0);

  // At rest (elapsed = 0), render data matches initial position pointing up
  const restData = getArrowRenderData(track, 0);
  assert.ok(restData !== null);
  assert.equal(restData.tangent.x, 0);
  assert.equal(restData.tangent.y, -1);

  // Mid-exit (e.g. 50% elapsed), arrow translates along (0, -1)
  const midData = getArrowRenderData(track, track.totalDurationMs * 0.5);
  assert.ok(midData !== null);
  assert.equal(midData.tangent.x, 0);
  assert.equal(midData.tangent.y, -1);

  // At completion (elapsed >= totalDurationMs), returns null (exited completely)
  const exitData = getArrowRenderData(track, track.totalDurationMs);
  assert.equal(exitData, null);
});

test('L-shaped arrow smoothly straightens in Phase 1 before translating off-board in Phase 2', () => {
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
  assert.ok(track.straightenDurationMs > 0);

  // 1. At rest (elapsed = 0):
  const restData = getArrowRenderData(track, 0);
  assert.ok(restData !== null);
  // Corner at x=150, y=210 is present in resting polyline
  assert.ok(restData.pathD.includes('150.0 210.0'));
  assert.equal(restData.tangent.x, 0);
  assert.equal(restData.tangent.y, -1);

  // 2. End of Phase 1 (straightening complete, elapsed = track.straightenDurationMs):
  const straightData = getArrowRenderData(track, track.straightenDurationMs);
  assert.ok(straightData !== null);
  // Arrowhead tangent still strictly UP
  assert.equal(straightData.tangent.x, 0);
  assert.equal(straightData.tangent.y, -1);
  // Head anchor position is unchanged during Phase 1
  assert.equal(straightData.tip.x, track.headAnchor.x);
  assert.equal(straightData.tip.y, track.headAnchor.y - track.arrowHeadSize);

  // In straightened state, path is a straight vertical line:
  // Head is at x=150, tail is collinear at x=150 behind head!
  const straightPoints = straightData.pathD
    .replace('M ', '')
    .split(' L ')
    .map((s) => s.split(' ').map(Number));
  // All points share the same X coordinate (x = 150)
  for (const [px] of straightPoints) {
    assert.ok(Math.abs(px - track.headAnchor.x) < 0.2, `Expected collinear X ~150, got ${px}`);
  }

  // 3. Phase 2 (translating off-board):
  const exitMidData = getArrowRenderData(
    track,
    track.straightenDurationMs + track.exitDurationMs * 0.5
  );
  assert.ok(exitMidData !== null);
  assert.equal(exitMidData.tangent.x, 0);
  assert.equal(exitMidData.tangent.y, -1);
  // Head has moved upward along Y
  assert.ok(exitMidData.tip.y < straightData.tip.y, 'Arrow should translate upward');

  // 4. Completed exit:
  const doneData = getArrowRenderData(track, track.totalDurationMs);
  assert.equal(doneData, null, 'Should return null when completely exited');
});

test('All four directions with bent arrows straighten into their respective exit directions', () => {
  const cases: Array<{
    dir: 'up' | 'down' | 'left' | 'right';
    points: Array<{ x: number; y: number }>;
    expectedTangent: { x: number; y: number };
  }> = [
    {
      dir: 'up',
      points: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 1 }],
      expectedTangent: { x: 0, y: -1 },
    },
    {
      dir: 'down',
      points: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 3 }],
      expectedTangent: { x: 0, y: 1 },
    },
    {
      dir: 'left',
      points: [{ x: 3, y: 1 }, { x: 3, y: 2 }, { x: 1, y: 2 }],
      expectedTangent: { x: -1, y: 0 },
    },
    {
      dir: 'right',
      points: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 3, y: 2 }],
      expectedTangent: { x: 1, y: 0 },
    },
  ];

  const cellSize = 60;

  for (const { dir, points, expectedTangent } of cases) {
    const arrow: Arrow = {
      id: `bent-${dir}`,
      x: points[points.length - 1].x,
      y: points[points.length - 1].y,
      direction: dir,
      points,
    };

    const track = buildArrowTrack(arrow, cellSize, 5, 5);
    assert.equal(track.isBent, true, `Arrow ${dir} should be bent`);

    // Rest check
    const rest = getArrowRenderData(track, 0);
    assert.ok(rest !== null);
    assert.equal(rest.tangent.x, expectedTangent.x, `Rest tangent X for ${dir}`);
    assert.equal(rest.tangent.y, expectedTangent.y, `Rest tangent Y for ${dir}`);

    // Straightened check at Phase 1 end
    const straight = getArrowRenderData(track, track.straightenDurationMs);
    assert.ok(straight !== null);
    assert.equal(straight.tangent.x, expectedTangent.x, `Straightened tangent X for ${dir}`);
    assert.equal(straight.tangent.y, expectedTangent.y, `Straightened tangent Y for ${dir}`);

    // Mid-exit check
    const mid = getArrowRenderData(track, track.straightenDurationMs + 100);
    assert.ok(mid !== null);
    assert.equal(mid.tangent.x, expectedTangent.x, `Exit tangent X for ${dir}`);
    assert.equal(mid.tangent.y, expectedTangent.y, `Exit tangent Y for ${dir}`);
  }
});

test('Multi-segment U-shaped arrow straightens completely and exits', () => {
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

  // At rest
  const r0 = getArrowRenderData(track, 0);
  assert.ok(r0 !== null);

  // At straightened state
  const rStraight = getArrowRenderData(track, track.straightenDurationMs);
  assert.ok(rStraight !== null);
  assert.equal(rStraight.tangent.x, 0);
  assert.equal(rStraight.tangent.y, -1);

  // At end of exit
  const rExit = getArrowRenderData(track, track.totalDurationMs);
  assert.equal(rExit, null);
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
