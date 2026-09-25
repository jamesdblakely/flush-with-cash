import test from 'node:test';
import assert from 'node:assert/strict';
import { sites, economy } from '../src/content/theme.js';
import { createInitialState, selectSite, placeUnit, advanceMinute, getResult,
  nextDay, serviceUnit, canAffordNextDay } from '../src/simulation/state.js';

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

test('day two carries resources forward and accounts for service as a cost', () => {
  let state = openAt('market');
  while (state.phase === 'running') state = advanceMinute(state);
  const endOfDay = state;
  assert.ok(canAffordNextDay(state));
  state = nextDay(state);
  assert.equal(state.day, 2);
  assert.equal(state.phase, 'planning');
  assert.equal(state.bank, endOfDay.bank);
  assert.equal(state.condition, endOfDay.condition);
  assert.equal(state.reputation, endOfDay.reputation);
  assert.equal(state.seed, endOfDay.seed);
  assert.equal(state.uses, 0);
  assert.equal(state.revenue, 0);
  assert.equal(state.costs, 0);
  state = serviceUnit(state);
  assert.equal(state.condition, 100);
  assert.equal(state.bank, endOfDay.bank - economy.serviceCost);
  assert.equal(state.costs, economy.serviceCost);
  state = placeUnit(selectSite(state, 'park'));
  assert.equal(state.phase, 'running');
  assert.equal(state.costs, economy.serviceCost + sites.find(site => site.id === 'park').cost);
  while (state.phase === 'running') state = advanceMinute(state);
  assert.equal(state.day, 2);
  assert.equal(getResult(state).profit, state.revenue - state.costs);
});

test('a business that cannot afford any site must restart', () => {
  const state = { ...createInitialState(), phase: 'result', bank: 0 };
  assert.equal(canAffordNextDay(state), false);
  assert.equal(nextDay(state), state);
});
