import { sites, economy } from '../content/theme.js';

export function createInitialState() {
  return { phase: 'title', bank: economy.startingCash, selectedSite: null, site: null,
    minute: 0, uses: 0, revenue: 0, costs: 0, condition: 100, satisfaction: 72,
    reputation: 50, visitors: 0, misses: 0, events: [], seed: 1847 };
}

export function selectSite(state, id) {
  if (state.phase !== 'planning' || !sites.some(site => site.id === id)) return state;
  return { ...state, selectedSite: id };
}

export function placeUnit(state) {
  const site = sites.find(item => item.id === state.selectedSite);
  if (state.phase !== 'planning' || !site || state.bank < site.cost) return state;
  return { ...state, phase: 'running', site: site.id, bank: state.bank - site.cost,
    costs: site.cost, events: [`Opened at ${site.name}. Placement: $${site.cost}.`] };
}

function random(seed) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 4294967296];
}

export function advanceMinute(state) {
  if (state.phase !== 'running') return state;
  const site = sites.find(item => item.id === state.site);
  const minute = state.minute + 1;
  let { seed, bank, uses, revenue, costs, condition, satisfaction, reputation, visitors, misses } = state;
  let roll; [seed, roll] = random(seed);
  const arrival = roll < site.traffic / 60;
  const events = [...state.events];
  if (arrival) {
    visitors++;
    [seed, roll] = random(seed);
    const chance = site.demand * (0.45 + condition / 200);
    if (roll < chance && condition > 15) {
      uses++;
      bank += economy.price;
      revenue += economy.price;
      condition = Math.max(0, condition - economy.wear);
      satisfaction = Math.min(100, satisfaction + 0.6);
      if (uses % 3 === 1) events.push(`Customer served. +$${economy.price}`);
    } else {
      misses++;
      satisfaction = Math.max(0, satisfaction - 1.4);
      if (misses % 3 === 1) events.push('A passerby kept walking.');
    }
  }
  if (minute % 12 === 0) {
    bank -= economy.upkeep;
    costs += economy.upkeep;
    events.push(`Cleaning and supplies: -$${economy.upkeep}.`);
  }
  reputation = Math.max(0, Math.min(100, Math.round(50 + (satisfaction - 72) * 0.55)));
  const phase = minute >= economy.dayMinutes ? 'result' : 'running';
  return { ...state, phase, minute, bank, uses, revenue, costs, condition, satisfaction,
    reputation, visitors, misses, seed, events: events.slice(-4) };
}

export function getResult(state) {
  const profit = state.revenue - state.costs;
  return { profit, success: profit >= economy.successProfit && state.satisfaction >= 55 };
}
