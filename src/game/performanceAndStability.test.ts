import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProgress, saveProgress, loadSettings, saveSettings } from '../utils/storage';
import { buildArrowTrack, getArrowRenderData } from './pathAnimation';
import { Arrow } from './types';

test('Non-blocking storage cache provides synchronous read and async persistence', async () => {
  const initial = loadProgress();
  assert.ok(typeof initial.coins === 'number', 'Coins must be loaded');

  // Update progress
  const updated = { ...initial, coins: initial.coins + 150 };
  saveProgress(updated);

  // In-memory read should be instantaneous
  const cached = loadProgress();
  assert.equal(cached.coins, initial.coins + 150, 'Cached read must reflect updated coins immediately');
});

test('Arrow animation track and resting render data calculate without NaN or infinite values', () => {
  const bentArrow: Arrow = {
    id: 'test_arrow_1',
    x: 2,
    y: 2,
    direction: 'up',
    points: [
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  };

  const track = buildArrowTrack(bentArrow, 64, 6, 6);
  assert.ok(track.totalLength > 0, 'Total length must be positive');
  assert.ok(track.totalDurationMs > 0, 'Duration must be positive');
  assert.equal(track.isBent, true, 'Arrow must be recognized as bent');

  // Resting data (0ms elapsed)
  const restingData = getArrowRenderData(track, 0);
  assert.ok(restingData !== null, 'Resting data must exist');
  assert.ok(restingData.pathD.startsWith('M '), 'Path must start with M');
  assert.ok(!restingData.pathD.includes('NaN'), 'Path must not contain NaN');
  assert.ok(!restingData.arrowHeadPoints.includes('NaN'), 'Arrowhead points must not contain NaN');

  // Mid-flight data (150ms elapsed)
  const midFlight = getArrowRenderData(track, 150);
  assert.ok(midFlight !== null, 'Mid-flight render data must be generated');
  assert.ok(!midFlight.pathD.includes('NaN'), 'Mid-flight path must not contain NaN');

  // Completed exit (at total duration)
  const exited = getArrowRenderData(track, track.totalDurationMs + 10);
  assert.equal(exited, null, 'Must return null once completely exited off-board');
});

test('Settings cache safely handles partial updates without undefined values', () => {
  const current = loadSettings();
  saveSettings({ ...current, soundEnabled: false });

  const updated = loadSettings();
  assert.equal(updated.soundEnabled, false, 'Sound must be disabled');
  assert.equal(typeof updated.theme, 'string', 'Theme must remain valid string');
});
