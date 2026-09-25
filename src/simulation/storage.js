import { sites, economy } from '../content/theme.js';

const key = 'flush-with-cash-save';

export function loadGame(storage) {
  try {
    const saved = JSON.parse(storage.getItem(key));
    let state = saved?.state;
    // The yard is a UI overlay; resume its underlying planning/result day.
    if (state?.phase === 'upgrades') {
      const { upgradeReturnPhase, ...rest } = state;
      state = { ...rest, phase: upgradeReturnPhase === 'result' ? 'result' : 'planning' };
    }
    if (saved?.version !== 1 || !state ||
      !['planning', 'running', 'result'].includes(state.phase) ||
      !Number.isInteger(state.day) || state.day < 1 ||
      !Number.isFinite(state.bank) || !Number.isFinite(state.condition) ||
      !Number.isFinite(state.reputation) || !Number.isFinite(state.minute) ||
      !['condition', 'reputation', 'satisfaction'].every(field =>
        Number.isFinite(state[field]) && state[field] >= 0 && state[field] <= 100) ||
      !['uses', 'visitors', 'passers', 'turnedAway', 'minute'].every(field =>
        Number.isInteger(state[field]) && state[field] >= 0) ||
      state.minute > economy.dayMinutes ||
      !['revenue', 'costs'].every(field => Number.isFinite(state[field]) && state[field] >= 0) ||
      !Number.isInteger(state.seed) || typeof state.signage !== 'boolean' ||
      !Array.isArray(state.events) ||
      (state.site !== null && !sites.some(site => site.id === state.site)) ||
      (state.selectedSite !== null && !sites.some(site => site.id === state.selectedSite)) ||
      (state.phase !== 'planning' && state.site === null)) return null;
    if (state.history !== undefined && (!Array.isArray(state.history) ||
      !state.history.every(entry => entry && Number.isInteger(entry.day) && entry.day >= 1 &&
        entry.day <= state.day && Number.isFinite(entry.profit) && sites.some(site => site.id === entry.site)))) return null;
    const history = Array.isArray(state.history) ? state.history :
      state.phase === 'result' ? [{ day: state.day, site: state.site,
        profit: state.revenue - state.costs }] : [];
    return { ...state, occupiedUntil: Number.isInteger(state.occupiedUntil) ? state.occupiedUntil : 0,
      weekStart: typeof state.weekStart === 'boolean' ? state.weekStart : false,
      reinforced: typeof state.reinforced === 'boolean' ? state.reinforced : false,
      surgePricing: typeof state.surgePricing === 'boolean' ? state.surgePricing : false,
      airFreshener: typeof state.airFreshener === 'boolean' ? state.airFreshener : false,
      ventilationFan: typeof state.ventilationFan === 'boolean' ? state.ventilationFan : false,
      outOfServiceToday: typeof state.outOfServiceToday === 'boolean' ? state.outOfServiceToday : false,
      recentTurnawayUntil: Number.isInteger(state.recentTurnawayUntil) ? state.recentTurnawayUntil : 0, history };
  } catch {
    return null;
  }
}

export function saveGame(storage, state) {
  try {
    storage.setItem(key, JSON.stringify({ version: 1, state }));
  } catch {
    // Browsers may disable storage; play still works for this session.
  }
}
