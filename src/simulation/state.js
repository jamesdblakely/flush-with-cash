import { sites, economy } from '../content/theme.js';

export function createInitialState() {
  return { phase: 'title', day: 1, bank: economy.startingCash,
    selectedSite: null, site: null,
    minute: 0, uses: 0, revenue: 0, costs: 0, condition: 100, satisfaction: 72,
    reputation: 50, dayStartReputation: 50, signage: false,
    visitors: 0, passers: 0, turnedAway: 0,
    activity: null, events: [], history: [], seed: 1847 };
}

export function canAffordNextDay(state) {
  return state.bank >= Math.min(...sites.map(site => site.cost));
}

export function nextDay(state) {
  if (state.phase !== 'result' || !canAffordNextDay(state)) return state;
  return { ...state, phase: 'planning', day: state.day + 1,
    selectedSite: null, site: null, minute: 0, uses: 0, revenue: 0, costs: 0,
    satisfaction: 72, dayStartReputation: state.reputation,
    visitors: 0, passers: 0, turnedAway: 0, activity: null, events: [] };
}

export function serviceUnit(state) {
  if (state.phase !== 'planning' || state.condition >= 100 ||
    state.bank - economy.serviceCost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - economy.serviceCost,
    costs: state.costs + economy.serviceCost, condition: 100,
    events: [`Unit serviced: -$${economy.serviceCost}.`] };
}

export function buySignage(state) {
  if (state.phase !== 'planning' || state.signage ||
    state.bank - economy.signageCost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - economy.signageCost,
    costs: state.costs + economy.signageCost, signage: true,
    events: [`Bought a town sign: -$${economy.signageCost}.`] };
}

export function selectSite(state, id) {
  if (state.phase !== 'planning' || !sites.some(site => site.id === id)) return state;
  return { ...state, selectedSite: id };
}

export function placeUnit(state) {
  const site = sites.find(item => item.id === state.selectedSite);
  if (state.phase !== 'planning' || !site || state.bank < site.cost) return state;
  return { ...state, phase: 'running', site: site.id, bank: state.bank - site.cost,
    costs: state.costs + site.cost,
    events: [...state.events, `Opened at ${site.name}. Placement: $${site.cost}.`] };
}

function random(seed) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 4294967296];
}

export function advanceMinute(state) {
  if (state.phase !== 'running') return state;
  const site = sites.find(item => item.id === state.site);
  const minute = state.minute + 1;
  let { seed, bank, uses, revenue, costs, condition, satisfaction, reputation,
    visitors, passers, turnedAway } = state;
  let roll; [seed, roll] = random(seed);
  const traffic = site.traffic * (state.signage ? economy.signageTrafficBoost : 1);
  const arrival = roll < Math.min(1, traffic / 60);
  const events = [...state.events];
  let activity = null;
  if (arrival) {
    visitors++;
    [seed, roll] = random(seed);
    if (roll >= site.demand) {
      passers++;
      activity = { type: 'pass', visitor: visitors };
      if (passers % 3 === 1) events.push('A passerby kept walking.');
    } else {
      [seed, roll] = random(seed);
      if (condition > 15 && roll < 0.45 + condition / 200) {
        uses++;
        bank += economy.price;
        revenue += economy.price;
        condition = Math.max(0, condition - economy.wear);
        satisfaction = Math.min(100, satisfaction + 0.6);
        activity = { type: 'served', visitor: visitors };
        events.push(`Customer served. +$${economy.price}`);
      } else {
        turnedAway++;
        satisfaction = Math.max(0, satisfaction - 1.4);
        activity = { type: 'turnedAway', visitor: visitors };
        events.push('A customer turned away from the unit.');
      }
    }
  }
  if (minute % 12 === 0) {
    bank -= economy.upkeep;
    costs += economy.upkeep;
    events.push(`Cleaning and supplies: -$${economy.upkeep}.`);
  }
  const phase = minute >= economy.dayMinutes ? 'result' : 'running';
  if (phase === 'result') {
    const change = Math.round((satisfaction - 72) / 8) - Math.floor(turnedAway / 5);
    reputation = Math.max(0, Math.min(100, reputation + Math.max(-5, Math.min(5, change))));
  }
  const history = phase === 'result' ? [...(state.history || []), {
    day: state.day, site: state.site, profit: revenue - costs,
  }] : state.history;
  return { ...state, phase, minute, bank, uses, revenue, costs, condition, satisfaction,
    reputation, visitors, passers, turnedAway, activity, seed, history,
    events: events.slice(-4) };
}

export function getResult(state) {
  const profit = state.revenue - state.costs;
  return { profit, success: profit >= economy.successProfit && state.satisfaction >= 55 };
}

export function getHistorySummary(state) {
  const history = state.history || [];
  return {
    totalProfit: history.reduce((total, day) => total + day.profit, 0),
    bestDay: history.reduce((best, day) => !best || day.profit > best.profit ? day : best, null),
  };
}
