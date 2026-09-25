import test from 'node:test';
import assert from 'node:assert/strict';
import { sites, economy } from '../src/content/theme.js';
import { createInitialState, selectSite, placeUnit, advanceMinute, getResult } from '../src/simulation/state.js';

function openAt(siteId) {
  let state = createInitialState();
  state = { ...state, phase: 'planning' };
  return placeUnit(selectSite(state, siteId));
}

test('visible visitor outcomes account for every arrival and sale', () => {
  for (const site of sites) {
    let state = openAt(site.id);
    let observedVisitors = 0;
    let observedSales = 0;
    while (state.phase === 'running') {
      const previous = state;
      state = advanceMinute(state);
      if (state.activity) {
        observedVisitors++;
        assert.equal(state.activity.visitor, state.visitors);
        assert.ok(['pass', 'served', 'turnedAway'].includes(state.activity.type));
        if (state.activity.type === 'served') observedSales++;
      }
      assert.equal(state.visitors - previous.visitors, state.activity ? 1 : 0);
      assert.equal(state.uses - previous.uses, state.activity?.type === 'served' ? 1 : 0);
    }
    assert.equal(state.minute, economy.dayMinutes);
    assert.equal(state.visitors, observedVisitors);
    assert.equal(state.uses, observedSales);
    assert.equal(state.visitors, state.uses + state.passers + state.turnedAway);
    assert.equal(state.revenue, state.uses * economy.price);
    assert.equal(getResult(state).profit, state.revenue - state.costs);
  }
});

test('a worn-out unit loses customers who need it but does not charge them', () => {
  let state = { ...openAt('market'), condition: 10 };
  while (state.phase === 'running') state = advanceMinute(state);
  assert.ok(state.turnedAway > 0);
  assert.equal(state.uses, 0);
  assert.equal(state.revenue, 0);
  assert.equal(state.visitors, state.passers + state.turnedAway);
});
