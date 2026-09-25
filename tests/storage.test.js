import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/simulation/state.js';
import { loadGame, saveGame } from '../src/simulation/storage.js';

const state = () => ({ ...createInitialState(), phase: 'planning' });
const load = (value, version = 1) => loadGame({ getItem: () => JSON.stringify({ version, state: value }) });

test('save validation rejects missing or invalid simulation numbers', () => {
  for (const field of ['day', 'bank', 'condition', 'reputation', 'minute', 'seed',
    'uses', 'revenue', 'costs', 'satisfaction', 'visitors', 'passers', 'turnedAway']) {
    for (const value of [undefined, null, '12', NaN, Infinity]) {
      assert.equal(load({ ...state(), [field]: value }), null, `${field}: ${value}`);
    }
  }
  for (const [field, value] of [['day', 0], ['day', 1.5], ['condition', -1], ['condition', 101],
    ['reputation', 101], ['minute', 121], ['uses', -1], ['satisfaction', -1]]) {
    assert.equal(load({ ...state(), [field]: value }), null, `${field}: ${value}`);
  }
});

test('save validation rejects invalid sites, phases and malformed history', () => {
  for (const patch of [{ phase: 'missing' }, { site: 'missing' }, { selectedSite: 'missing' },
    { phase: 'running', site: null }, { events: null }, { history: {} },
    { history: [null] }, { history: [{ day: 1, site: 'missing', profit: 10 }] },
    { history: [{ day: 1, site: 'canal', profit: '10' }] }]) {
    assert.equal(load({ ...state(), ...patch }), null);
  }
  assert.equal(load(state(), 99), null);
});

test('older saves default optional upgrades and recover missing result history', () => {
  const older = state();
  for (const field of ['reinforced', 'surgePricing', 'airFreshener', 'ventilationFan', 'history', 'occupiedUntil']) delete older[field];
  const restored = load(older);
  assert.equal(restored.reinforced, false);
  assert.equal(restored.surgePricing, false);
  assert.equal(restored.airFreshener, false);
  assert.equal(restored.ventilationFan, false);
  assert.equal(restored.occupiedUntil, 0);
  assert.deepEqual(restored.history, []);
  assert.deepEqual(load({ ...older, phase: 'result', site: 'canal', revenue: 60, costs: 40 }).history,
    [{ day: 1, site: 'canal', profit: 20 }]);
});

test('unavailable browser storage never prevents play', () => {
  const storage = { getItem() { throw new Error('unavailable'); }, setItem() { throw new Error('quota'); } };
  assert.equal(loadGame(storage), null);
  assert.doesNotThrow(() => saveGame(storage, state()));
});
