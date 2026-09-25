import test from 'node:test';
import assert from 'node:assert/strict';
import { sites, economy } from '../src/content/theme.js';
import { createInitialState, selectSite, placeUnit, advanceMinute, getResult, getHistorySummary, getServiceCost, getPlacementCost,
  nextDay, serviceUnit, buySignage, canAffordNextDay, getAvailableSites } from '../src/simulation/state.js';
import { loadGame, saveGame } from '../src/simulation/storage.js';
import { buyReinforced, buySurgePricing, buyAirFreshener, buyVentilationFan } from '../src/simulation/state.js';

test('every upgrade records its expense once and preserves purchases across reload', () => {
  for (const purchase of [buySignage, buyReinforced, buySurgePricing, buyAirFreshener, buyVentilationFan]) {
    const before = { ...createInitialState(), phase: 'upgrades', bank: 500, upgradeReturnPhase: 'planning' };
    const bought = purchase(before);
    assert.ok(bought.bank < before.bank);
    assert.equal(bought.costs - before.costs, before.bank - bought.bank);
    assert.equal(purchase(bought), bought);
    let serialized;
    const storage = { setItem: (_key, value) => { serialized = value; }, getItem: () => serialized };
    saveGame(storage, bought);
    const resumed = loadGame(storage);
    assert.equal(resumed.phase, 'planning');
    assert.equal(resumed.bank, bought.bank);
    assert.equal(resumed.costs, bought.costs);
    assert.equal(purchase({ ...resumed, phase: 'upgrades' }).bank, bought.bank);
    let day = placeUnit(selectSite(resumed, 'canal'));
    while (day.phase === 'running') day = advanceMinute(day);
    assert.equal(day.bank - before.bank, getResult(day).profit);
  }
});

test('old upgrade saves recover to planning and result-origin saves preserve the day', () => {
  let serialized;
  const storage = { setItem: (_key, value) => { serialized = value; }, getItem: () => serialized };
  saveGame(storage, { ...createInitialState(), phase: 'upgrades' });
  assert.equal(loadGame(storage).phase, 'planning');
  saveGame(storage, { ...openAt('canal'), phase: 'upgrades', upgradeReturnPhase: 'result' });
  assert.equal(loadGame(storage).phase, 'result');
});

function openAt(siteId) {
  let state = createInitialState();
  state = { ...state, phase: 'planning' };
  return placeUnit(selectSite(state, siteId));
}

test('visible visitor outcomes account for every arrival and sale', () => {
  for (const site of sites) {
    let state = { ...createInitialState(), phase: 'planning', day: site.days?.[0] ?? 1, bank: 500, reputation: 100 };
    state = placeUnit(selectSite(state, site.id));
    let observedVisitors = 0;
    let observedSales = 0;
    while (state.phase === 'running') {
      const previous = state;
      state = advanceMinute(state);
      if (state.activity) {
        observedVisitors++;
        assert.equal(state.activity.visitor, state.visitors);
        assert.ok(['pass', 'served', 'occupied', 'turnedAway', 'outOfService'].includes(state.activity.type));
        if (state.activity.type === 'served') observedSales++;
      }
      assert.equal(state.visitors - previous.visitors, state.activity ? 1 : 0);
      assert.equal(state.uses - previous.uses, state.activity?.type === 'served' ? 1 : 0);
    }
    assert.equal(state.minute, economy.dayMinutes);
    assert.equal(state.visitors, observedVisitors);
    assert.equal(state.uses, observedSales);
    assert.equal(state.visitors, state.uses + state.passers + state.turnedAway);
    assert.equal(state.revenue, state.uses * Math.round((site.price ?? economy.price) * 1.25));
    assert.equal(getResult(state).profit, state.revenue - state.costs);
  }
});

test('customers needing an occupied unit turn away until the visit ends', () => {
  let state = { ...openAt('park'), occupiedUntil: 10, minute: 1, seed: 1 };
  let foundOccupied = false;
  while (state.minute < 10) {
    state = advanceMinute(state);
    if (state.activity?.type === 'occupied') foundOccupied = true;
  }
  assert.equal(foundOccupied, true);
  assert.ok(state.turnedAway > 0);
});

test('an out-of-service unit loses customers who need it but does not charge them', () => {
  let state = { ...openAt('market'), condition: 0 };
  while (state.phase === 'running') state = advanceMinute(state);
  assert.ok(state.turnedAway > 0);
  assert.equal(state.uses, 0);
  assert.equal(state.revenue, 0);
  assert.equal(state.visitors, state.passers + state.turnedAway);
  assert.ok(state.costs > sites.find(site => site.id === 'market').cost + economy.upkeep * 10);
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
  assert.equal(state.bank, endOfDay.bank - getServiceCost({ ...state, condition: endOfDay.condition, bank: endOfDay.bank }));
  assert.equal(state.costs, getServiceCost({ ...state, condition: endOfDay.condition, bank: endOfDay.bank }));
  state = placeUnit(selectSite(state, 'park'));
  assert.equal(state.phase, 'running');
  assert.equal(state.costs, getServiceCost({ ...state, condition: endOfDay.condition, bank: endOfDay.bank }) + getPlacementCost(state, sites.find(site => site.id === 'park')));
  while (state.phase === 'running') state = advanceMinute(state);
  assert.equal(state.day, 2);
  assert.equal(getResult(state).profit, state.revenue - state.costs);
});

test('a business that cannot afford any site must restart', () => {
  const state = { ...createInitialState(), phase: 'result', bank: 0 };
  assert.equal(canAffordNextDay(state), false);
  assert.equal(nextDay(state), state);
});

test('the high-capacity festival is offered only on Friday and Saturday', () => {
  const monday = { ...createInitialState(), phase: 'planning', day: 1 };
  const friday = { ...monday, day: 5 };
  const sunday = { ...monday, day: 7 };
  assert.equal(getAvailableSites(monday).some(site => site.id === 'festival'), false);
  assert.equal(getAvailableSites(friday).some(site => site.id === 'festival'), true);
  assert.equal(getAvailableSites(sunday).some(site => site.id === 'festival'), false);
  assert.equal(selectSite(monday, 'festival'), monday);
});

test('one unit must be serviced between Friday and Saturday festival days', () => {
  let state = { ...createInitialState(), phase: 'planning', day: 5, bank: 500, reputation: 70 };
  state = placeUnit(selectSite(state, 'festival'));
  while (state.phase === 'running') state = advanceMinute(state);
  state = nextDay(state);
  const selected = selectSite(state, 'festival');
  assert.ok(selected.condition < 80);
  assert.equal(placeUnit(selected), selected);
  state = serviceUnit(selected);
  assert.equal(state.condition, 100);
  assert.equal(placeUnit(selectSite(state, 'festival')).phase, 'running');
});

test('repair estimates rise with damage and reinforced structure maintenance', () => {
  const nearlyClean = { ...createInitialState(), condition: 90 };
  const broken = { ...nearlyClean, condition: 0 };
  assert.ok(getServiceCost(broken) > getServiceCost(nearlyClean));
  assert.equal(getServiceCost({ ...broken, reinforced: true }),
    getServiceCost(broken) + economy.reinforcedServiceCost);
});

test('a new week keeps the business but requires 80% condition before placement', () => {
  let state = { ...createInitialState(), phase: 'result', day: 7, bank: 300, condition: 55,
    signage: true, reputation: 57 };
  state = nextDay(state);
  assert.equal(state.day, 8);
  assert.equal(state.weekStart, true);
  assert.equal(state.signage, false);
  assert.equal(state.reputation, 57);
  const selected = selectSite(state, 'canal');
  assert.equal(placeUnit(selected), selected);
  state = serviceUnit(selected);
  state = placeUnit(selectSite(state, 'canal'));
  assert.equal(state.phase, 'running');
  assert.equal(state.weekStart, false);
});

test('town sign costs cash once, brings more visitors, and carries into later days', () => {
  const planning = { ...createInitialState(), phase: 'planning' };
  const signed = buySignage(planning);
  assert.equal(signed.bank, planning.bank - economy.signageCost);
  assert.equal(signed.costs, economy.signageCost);
  assert.equal(signed.signage, true);
  assert.equal(buySignage(signed), signed);

  let normalDay = placeUnit(selectSite(planning, 'market'));
  let signedDay = placeUnit(selectSite(signed, 'market'));
  while (normalDay.phase === 'running') normalDay = advanceMinute(normalDay);
  while (signedDay.phase === 'running') signedDay = advanceMinute(signedDay);
  assert.ok(signedDay.visitors > normalDay.visitors);
  assert.equal(signedDay.costs - normalDay.costs, economy.signageCost);
  assert.equal(nextDay(signedDay).signage, true);
  assert.equal(nextDay(signedDay).costs, 0);
});

test('a saved business resumes mid-day and rejects damaged saves', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(loadGame(storage), null);
  let state = placeUnit(selectSite(buySignage({ ...createInitialState(), phase: 'planning' }), 'market'));
  state = advanceMinute(state);
  saveGame(storage, state);
  assert.deepEqual(loadGame(storage), state);
  values.set('flush-with-cash-save', '{broken');
  assert.equal(loadGame(storage), null);
});

test('the daily ledger records each result once and totals profit across days', () => {
  let state = openAt('market');
  while (state.phase === 'running') state = advanceMinute(state);
  assert.equal(state.history.length, 1);
  assert.equal(state.history[0].profit, getResult(state).profit);
  assert.equal(advanceMinute(state), state);
  state = placeUnit(selectSite(nextDay(state), 'park'));
  while (state.phase === 'running') state = advanceMinute(state);
  assert.equal(state.history.length, 2);
  const ledger = getHistorySummary(state);
  assert.equal(ledger.totalProfit, state.history[0].profit + state.history[1].profit);
  assert.equal(ledger.bestDay.profit, Math.max(...state.history.map(day => day.profit)));
});
