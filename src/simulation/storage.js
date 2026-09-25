import { sites } from '../content/theme.js';

const key = 'flush-with-cash-save';

export function loadGame(storage) {
  try {
    const saved = JSON.parse(storage.getItem(key));
    const state = saved?.state;
    if (saved?.version !== 1 || !state ||
      !['planning', 'running', 'result'].includes(state.phase) ||
      !Number.isInteger(state.day) || state.day < 1 ||
      !Number.isFinite(state.bank) || !Number.isFinite(state.condition) ||
      !Number.isFinite(state.reputation) || !Number.isFinite(state.minute) ||
      !Number.isInteger(state.seed) || typeof state.signage !== 'boolean' ||
      !Array.isArray(state.events) ||
      (state.site !== null && !sites.some(site => site.id === state.site)) ||
      (state.selectedSite !== null && !sites.some(site => site.id === state.selectedSite)) ||
      (state.phase !== 'planning' && state.site === null)) return null;
    return state;
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
