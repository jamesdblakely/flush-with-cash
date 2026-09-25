import test from 'node:test';
import assert from 'node:assert/strict';
import { economy, sites } from '../src/content/theme.js';
import { createInitialState, getPlacementCost, selectSite, placeUnit, advanceMinute,
  buySignage, buyReinforced, buySurgePricing, buyAirFreshener, buyVentilationFan,
  nextDay, serviceUnit, getServiceCost, getResult } from '../src/simulation/state.js';

const planning = overrides => ({ ...createInitialState(), phase: 'planning', bank: 1000, ...overrides });
const running = overrides => ({ ...placeUnit(selectSite(planning(), 'market')), seed: 1, ...overrides });
const purchases = [
  [buySignage, economy.signageCost], [buyReinforced, economy.reinforcedCost],
  [buySurgePricing, economy.surgeCost], [buyAirFreshener, economy.airFreshenerCost],
  [buyVentilationFan, economy.ventilationFanCost],
];

test('reputation changes permit and customer prices at low, neutral and high levels', () => {
  const canal = sites.find(site => site.id === 'canal');
  for (const [reputation, permit, price] of [[0, 60, 9], [50, 40, 12], [100, 20, 15]]) {
    assert.equal(getPlacementCost(planning({ reputation }), canal), permit);
    const before = running({ reputation });
    const after = advanceMinute(before);
    assert.equal(after.activity.type, 'served');
    assert.equal(after.activity.amount, price);
    assert.equal(after.bank - before.bank, price);
  }
});

test('reputation-gated locations unlock exactly at their required reputation', () => {
  for (const site of sites.filter(site => site.minimumReputation)) {
    const base = planning({ day: site.days?.[0] ?? 1, reputation: site.minimumReputation - 1 });
    const selected = selectSite(base, site.id);
    assert.equal(placeUnit(selected), selected);
    assert.equal(placeUnit({ ...selected, reputation: site.minimumReputation }).phase, 'running');
  }
});

test('placement accepts exact funds and rejects insufficient funds and wrong phases', () => {
  const selected = selectSite(planning(), 'canal');
  assert.equal(placeUnit({ ...selected, bank: 40 }).bank, 0);
  for (const override of [{ bank: 39 }, { phase: 'result' }, { selectedSite: 'missing' }]) {
    const state = { ...selected, ...override };
    assert.equal(placeUnit(state), state);
  }
});

test('reinforcement reduces wear by 15% without changing the customer charge', () => {
  const ordinary = advanceMinute(running());
  const reinforced = advanceMinute(running({ reinforced: true }));
  assert.equal(ordinary.activity.type, 'served');
  assert.ok(Math.abs((100 - reinforced.condition) / (100 - ordinary.condition) - 0.85) < 1e-10);
  assert.equal(reinforced.revenue, ordinary.revenue);
});

test('surge pricing starts on a turnaway and expires at the window boundary', () => {
  const rejected = advanceMinute(running({ surgePricing: true, occupiedUntil: 2 }));
  assert.equal(rejected.activity.type, 'occupied');
  const sale = advanceMinute({ ...rejected, seed: 1 });
  assert.equal(sale.activity.amount, 13);
  const expired = advanceMinute({ ...rejected, seed: 1, minute: rejected.recentTurnawayUntil - 1 });
  assert.equal(expired.activity.amount, 12);
  const disabled = advanceMinute({ ...rejected, seed: 1, surgePricing: false });
  assert.equal(disabled.activity.amount, 12);
});

test('condition-related turnaways also start the surge window', () => {
  const rejected = advanceMinute(running({ condition: 1, surgePricing: true }));
  assert.equal(rejected.activity.type, 'turnedAway');
  assert.equal(rejected.recentTurnawayUntil, rejected.minute + economy.surgeWindow);
});

// Seed 1 at Canal Walk produces no arrival, isolating the end-of-day reputation calculation.
const finish = overrides => advanceMinute(running({ site: 'canal', minute: 119, ...overrides }));
test('comfort upgrades improve reputation gains and soften losses', () => {
  assert.equal(finish({ satisfaction: 80 }).reputation, 51);
  for (const upgrade of ['airFreshener', 'ventilationFan']) {
    assert.equal(finish({ satisfaction: 80, [upgrade]: true }).reputation, 52);
    assert.equal(finish({ satisfaction: 40, [upgrade]: true }).reputation, 47);
  }
  assert.equal(finish({ satisfaction: 80, airFreshener: true, ventilationFan: true }).reputation, 53);
  assert.equal(finish({ satisfaction: 40, airFreshener: true, ventilationFan: true }).reputation, 48);
});

test('out-of-service reputation penalties bypass comfort protection and stay in bounds', () => {
  const base = { satisfaction: 72, outOfServiceToday: true };
  assert.equal(finish(base).reputation, 45);
  assert.equal(finish({ ...base, airFreshener: true, ventilationFan: true }).reputation, 45);
  assert.equal(finish({ ...base, reputation: 2 }).reputation, 0);
  assert.equal(finish({ satisfaction: 100, reputation: 99 }).reputation, 100);
});

test('all purchases preserve permit funds and reject duplicates or invalid phases', () => {
  for (const [purchase, cost] of purchases) {
    const exact = planning({ phase: 'upgrades', bank: cost + 40 });
    const bought = purchase(exact);
    assert.equal(bought.bank, 40);
    assert.equal(purchase(bought), bought);
    for (const overrides of [{ bank: cost + 39 }, { bank: 0 }, { phase: 'running' }, { phase: 'result' }]) {
      const blocked = { ...exact, ...overrides };
      assert.equal(purchase(blocked), blocked);
    }
  }
});

test('service preserves permit funds and cannot be repeated or bought mid-day', () => {
  const state = planning({ condition: 0, reinforced: true });
  const cost = getServiceCost(state);
  const fixed = serviceUnit({ ...state, bank: cost + 40 });
  assert.equal(fixed.bank, 40);
  assert.equal(fixed.condition, 100);
  assert.equal(serviceUnit(fixed), fixed);
  for (const overrides of [{ bank: cost + 39 }, { phase: 'running' }]) {
    const blocked = { ...state, ...overrides };
    assert.equal(serviceUnit(blocked), blocked);
  }
});

test('weekly rollover preserves permanent upgrades, money and history but expires the sign', () => {
  const before = planning({ phase: 'result', day: 7, signage: true, reinforced: true,
    surgePricing: true, airFreshener: true, ventilationFan: true,
    history: [{ day: 7, site: 'canal', profit: 42 }] });
  const after = nextDay(before);
  assert.equal(after.day, 8);
  assert.equal(after.signage, false);
  for (const field of ['bank', 'reinforced', 'surgePricing', 'airFreshener', 'ventilationFan', 'history']) {
    assert.deepEqual(after[field], before[field]);
  }
  const selected = selectSite(after, 'canal');
  const blocked = { ...selected, condition: 79.99 };
  assert.equal(placeUnit(blocked), blocked);
  assert.equal(placeUnit({ ...selected, condition: 80 }).phase, 'running');
  assert.equal(nextDay({ ...before, day: 6 }).signage, true);
});

test('ledger balances service, upgrades, permits, sales, upkeep and individual outage fines', () => {
  let state = planning({ condition: 0 });
  const openingBank = state.bank;
  state = serviceUnit(state);
  for (const [purchase] of purchases) state = purchase({ ...state, phase: 'upgrades' });
  state = placeUnit(selectSite({ ...state, phase: 'planning' }, 'market'));
  let fines = 0;
  let upkeep = 0;
  while (state.phase === 'running') {
    if (state.minute === 60) state = { ...state, condition: 0 };
    const before = state;
    state = advanceMinute(state);
    const fine = state.activity?.type === 'outOfService' ? economy.outOfServiceFine : 0;
    const supplies = state.minute % 12 === 0 ? economy.upkeep : 0;
    assert.equal(state.costs - before.costs, fine + supplies);
    assert.equal(state.bank - before.bank, state.revenue - before.revenue - fine - supplies);
    fines += fine;
    upkeep += supplies;
  }
  assert.ok(fines > 0);
  assert.equal(upkeep, 40);
  assert.equal(state.bank - openingBank, getResult(state).profit);
  assert.equal(state.history.at(-1).profit, getResult(state).profit);
});
