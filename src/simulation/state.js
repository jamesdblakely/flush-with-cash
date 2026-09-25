import { sites, economy } from '../content/theme.js';

export function createInitialState() {
  return { phase: 'title', day: 1, bank: economy.startingCash,
    selectedSite: null, site: null,
    minute: 0, uses: 0, revenue: 0, costs: 0, condition: 100, satisfaction: 72,
    reputation: 50, dayStartReputation: 50, signage: false, reinforced: false, surgePricing: false, airFreshener: false, ventilationFan: false,
    visitors: 0, passers: 0, turnedAway: 0, outOfServiceToday: false, occupiedUntil: 0, recentTurnawayUntil: 0, weekStart: false,
    activity: null, events: [], history: [], seed: 1847 };
}

export function canAffordNextDay(state) {
  return state.bank >= Math.min(...sites.map(site => site.cost));
}

export function getAvailableSites(state) {
  const dayOfWeek = ((state.day - 1) % 7) + 1;
  return sites.filter(site => !site.days || site.days.includes(dayOfWeek));
}

export function getServiceCost(state) {
  const damageCost = Math.ceil((100 - state.condition) / 100 * economy.serviceDamageCost);
  return economy.serviceBaseCost + damageCost + (state.reinforced ? economy.reinforcedServiceCost : 0);
}

export function getPlacementCost(state, site) {
  return Math.max(1, Math.round(site.cost * (1 - (state.reputation - 50) / 100)));
}

export function nextDay(state) {
  if (!['result', 'upgrades'].includes(state.phase) || !canAffordNextDay(state)) return state;
  const day = state.day + 1;
  const weekStart = (day - 1) % 7 === 0;
  return { ...state, phase: 'planning', day, weekStart, signage: weekStart ? false : state.signage,
    selectedSite: null, site: null, minute: 0, uses: 0, revenue: 0, costs: 0,
    satisfaction: 72, dayStartReputation: state.reputation,
    visitors: 0, passers: 0, turnedAway: 0, outOfServiceToday: false, occupiedUntil: 0, recentTurnawayUntil: 0, activity: null, events: [] };
}

export function serviceUnit(state) {
  const serviceCost = getServiceCost(state);
  if (state.phase !== 'planning' || state.condition >= 100 ||
    state.bank - serviceCost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - serviceCost,
    costs: state.costs + serviceCost, condition: 100,
    events: [`Unit serviced: -$${serviceCost}.`] };
}

export function buySignage(state) {
  if (!['planning', 'upgrades'].includes(state.phase) || state.signage ||
    state.bank - economy.signageCost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - economy.signageCost,
    costs: state.costs + economy.signageCost, signage: true,
    events: [`Bought a town sign: -$${economy.signageCost}.`] };
}

export function buyReinforced(state) {
  if (state.phase !== 'upgrades' || state.reinforced ||
    state.bank - economy.reinforcedCost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - economy.reinforcedCost, reinforced: true,
    events: ['Reinforced structure installed: -$' + economy.reinforcedCost + '.'] };
}

export function buySurgePricing(state) {
  if (state.phase !== 'upgrades' || state.surgePricing ||
    state.bank - economy.surgeCost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - economy.surgeCost, surgePricing: true,
    events: ['Surge pricing enabled: -$' + economy.surgeCost + '.'] };
}

function buyReputationUpgrade(state, property, cost, name) {
  if (state.phase !== 'upgrades' || state[property] ||
    state.bank - cost < Math.min(...sites.map(site => site.cost))) return state;
  return { ...state, bank: state.bank - cost, [property]: true, events: [name + ' installed: -$' + cost + '.'] };
}

export const buyAirFreshener = state => buyReputationUpgrade(state, 'airFreshener', economy.airFreshenerCost, 'Air freshener');
export const buyVentilationFan = state => buyReputationUpgrade(state, 'ventilationFan', economy.ventilationFanCost, 'Ventilation fan');

export function selectSite(state, id) {
  if (state.phase !== 'planning' || !getAvailableSites(state).some(site => site.id === id)) return state;
  return { ...state, selectedSite: id };
}

export function placeUnit(state) {
  const site = getAvailableSites(state).find(item => item.id === state.selectedSite);
  const placementCost = site ? getPlacementCost(state, site) : 0;
  if (state.phase !== 'planning' || !site || state.bank < placementCost ||
    state.reputation < (site.minimumReputation ?? 0) ||
    state.condition < (site.minimumCondition ?? 0) ||
    (state.weekStart && state.condition < 80)) return state;
  return { ...state, phase: 'running', site: site.id, bank: state.bank - placementCost,
    costs: state.costs + placementCost, weekStart: false,
    events: [...state.events, `Opened at ${site.name}. Placement: $${placementCost}.`] };
}

function random(seed) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return [next, next / 4294967296];
}

export function advanceMinute(state) {
  if (state.phase !== 'running') return state;
  const site = sites.find(item => item.id === state.site);
  const salePrice = site.price ?? economy.price;
  const minute = state.minute + 1;
  let { seed, bank, uses, revenue, costs, condition, satisfaction, reputation,
    visitors, passers, turnedAway, outOfServiceToday = false, occupiedUntil = 0, recentTurnawayUntil = 0 } = state;
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
      if (condition <= 0) {
        turnedAway++;
        bank -= economy.outOfServiceFine;
        costs += economy.outOfServiceFine;
        satisfaction = Math.max(0, satisfaction - 2);
        activity = { type: 'outOfService', visitor: visitors };
        outOfServiceToday = true;
        recentTurnawayUntil = minute + economy.surgeWindow;
        events.push('Out-of-service fine: -$' + economy.outOfServiceFine + '.');
      } else if (minute < occupiedUntil) {
        turnedAway++;
        satisfaction = Math.max(0, satisfaction - 0.7);
        activity = { type: 'occupied', visitor: visitors };
        recentTurnawayUntil = minute + economy.surgeWindow;
        events.push('A customer found the unit occupied and turned away.');
      } else if (roll < 0.45 + condition / 200) {
        uses++;
        const reputationRate = 0.75 + state.reputation / 200;
        const chargedPrice = Math.round(salePrice * reputationRate * (state.surgePricing && minute < recentTurnawayUntil ? economy.surgeMultiplier : 1));
        bank += chargedPrice;
        revenue += chargedPrice;
        condition = Math.max(0, condition - economy.wear * (site.wear ?? 1) * (state.reinforced ? 1 - economy.reinforcedWearReduction : 1));
        satisfaction = Math.min(100, satisfaction + 0.6);
        occupiedUntil = minute + economy.visitDuration;
        activity = { type: 'served', visitor: visitors, amount: chargedPrice };
        events.push(condition === 0 ? 'The last customer wore the unit out: out of service.' : 'Customer served. +$' + chargedPrice + (chargedPrice > salePrice ? ' (surge)' : ''));
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
    let change = Math.round((satisfaction - 72) / 8) - Math.floor(turnedAway / 5);
    if (outOfServiceToday) change -= 8;
    else if (change >= 0) change += (state.airFreshener ? 1 : 0) + (state.ventilationFan ? 1 : 0);
    else change = Math.ceil(change * (1 - (state.airFreshener ? 0.25 : 0) - (state.ventilationFan ? 0.25 : 0)));
    reputation = Math.max(0, Math.min(100, reputation + Math.max(-5, Math.min(5, change))));
  }
  const history = phase === 'result' ? [...(state.history || []), {
    day: state.day, site: state.site, profit: revenue - costs,
  }] : state.history;
  return { ...state, phase, minute, bank, uses, revenue, costs, condition, satisfaction,
    reputation, visitors, passers, turnedAway, outOfServiceToday, occupiedUntil, recentTurnawayUntil, activity, seed, history,
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
