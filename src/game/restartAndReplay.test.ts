import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelById, cloneArrows, cloneLevel, ALL_LEVELS } from './levels';
import { Arrow } from './types';

test('cloneArrows produces independent deep copies of arrow array', () => {
  const originalArrows: Arrow[] = [
    { id: 'a1', x: 2, y: 1, direction: 'up', points: [{ x: 2, y: 3 }, { x: 2, y: 1 }] },
    { id: 'a2', x: 0, y: 0, direction: 'right' },
  ];

  const cloned = cloneArrows(originalArrows);

  assert.equal(cloned.length, originalArrows.length);
  assert.notEqual(cloned, originalArrows);
  assert.notEqual(cloned[0], originalArrows[0]);
  assert.notEqual(cloned[0].points, originalArrows[0].points);

  // Mutation in clone does not touch original
  cloned[0].x = 99;
  cloned[0].points![0].x = 88;
  assert.equal(originalArrows[0].x, 2);
  assert.equal(originalArrows[0].points![0].x, 2);
});

test('getLevelById always returns fresh pristine level for Level 1 and Level 31', () => {
  const l1_first = getLevelById(1);
  const l1_arrows_count = l1_first.arrows.length;
  assert.ok(l1_arrows_count > 0, 'Level 1 must have arrows');

  // Simulate solving/emptying level 1 arrows
  l1_first.arrows.length = 0;
  assert.equal(l1_first.arrows.length, 0);

  // Replay: fetch Level 1 again
  const l1_replayed = getLevelById(1);
  assert.equal(
    l1_replayed.arrows.length,
    l1_arrows_count,
    'Replaying Level 1 must restore all original arrows'
  );

  // Level 31 check
  const l31_first = getLevelById(31);
  const l31_count = l31_first.arrows.length;
  assert.ok(l31_count > 0, 'Level 31 must have arrows');

  // Simulate mutation
  l31_first.arrows.pop();

  // Replay: fetch Level 31 again
  const l31_replayed = getLevelById(31);
  assert.equal(
    l31_replayed.arrows.length,
    l31_count,
    'Replaying Level 31 must restore all original arrows'
  );
});

test('Sequential restarts preserve identical arrow configurations', () => {
  const first = getLevelById(1);
  assert.ok(first.arrows.length >= 6, 'Level 1 must have at least 6 arrows in Hard Pro Max');

  for (let i = 0; i < 5; i++) {
    const lvl = getLevelById(1);
    assert.equal(lvl.arrows.length, first.arrows.length);
    assert.equal(lvl.arrows[0].id, first.arrows[0].id);
    assert.equal(lvl.arrows[0].direction, first.arrows[0].direction);
    assert.equal(lvl.arrows[0].points?.length, first.arrows[0].points?.length);
  }
});

