import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArrowTrack, getPointAndTangentAtDistance, getSlicedArrowRenderData } from './pathAnimation';
import { Arrow } from './types';

test('Straight arrow track builds correct exit extension', () => {
  const straight: Arrow = { id: 's1', x: 2, y: 2, direction: 'up' };
  const cellSize = 60;
  const track = buildArrowTrack(straight, cellSize, 5, 5);

  assert.equal(track.direction, 'up');
  assert.equal(track.vertices.length, 3); // tail, head base, exit
  assert.ok(track.initialArrowLength > 0);
  assert.ok(track.totalLength > track.initialArrowLength);

  // At progress 0, render data matches initial rest position
  const restData = getSlicedArrowRenderData(track, 0);
  assert.ok(restData !== null);
  assert.ok(restData.pathD.startsWith('M'));
  assert.equal(restData.tangent.x, 0);
  assert.equal(restData.tangent.y, -1);

  // At progress 1, completely exited
  const exitData = getSlicedArrowRenderData(track, 1);
  assert.equal(exitData, null);
});

test('L-shaped arrow track preserves corner at t=0 and turns smoothly around corner', () => {
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

  // Track should have: tail, corner, head, exit point
  assert.equal(track.vertices.length, 4);

  // Initial state (progress = 0):
  const renderAt0 = getSlicedArrowRenderData(track, 0);
  assert.ok(renderAt0 !== null);
  // Corner vertex (x: 2*60+30=150, y: 3*60+30=210) should be included in polyline
  assert.ok(renderAt0.pathD.includes('150.0 210.0'), 'Corner must be in initial path');

  // Early in animation (e.g. progress = 0.05):
  // Tail has started moving towards corner, but has NOT reached corner yet
  const renderEarly = getSlicedArrowRenderData(track, 0.05);
  assert.ok(renderEarly !== null);
  assert.ok(renderEarly.pathD.includes('150.0 210.0'), 'Corner must still be in path while tail has not reached corner');

  // Later in animation (e.g. progress = 0.4):
  // Tail has passed the corner (150, 210).
  // The path must now be straight along the vertical segment, and corner (150, 210) is no longer in path!
  const renderLate = getSlicedArrowRenderData(track, 0.4);
  assert.ok(renderLate !== null);
  assert.ok(!renderLate.pathD.includes('150.0 210.0'), 'Corner must be removed once tail turns past it');

  // Arrowhead tangent should continuously point UP (dx=0, dy=-1)
  assert.equal(renderLate.tangent.x, 0);
  assert.equal(renderLate.tangent.y, -1);
});

test('Multi-segment U-shaped arrow follows every segment in order', () => {
  // Multi-turn arrow: (1, 1) -> (1, 3) -> (3, 3) -> (3, 1) pointing up
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
  assert.equal(track.vertices.length, 5); // 4 points + 1 exit point

  // At progress 0, both corners are present
  const r0 = getSlicedArrowRenderData(track, 0);
  assert.ok(r0 !== null);
  // Check that path has 3 'L ' commands (4 vertices total)
  const lMatches0 = r0.pathD.match(/ L /g);
  assert.equal(lMatches0?.length, 3);

  // Later in animation, corners drop off sequentially as tail traverses them
  const rEnd = getSlicedArrowRenderData(track, 0.99);
  assert.ok(rEnd !== null);
  // Near the end, it's just a straight exit segment off the board
  const lMatchesEnd = rEnd.pathD.match(/ L /g);
  assert.equal(lMatchesEnd?.length, 1);
});
