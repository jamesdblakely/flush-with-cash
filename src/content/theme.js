// Copy, site clues, and balance values live outside the simulation and renderer.
export const economy = { startingCash: 185, price: 12, upkeep: 4, wear: 2.4,
  dayMinutes: 120, successProfit: 5 };

export const sites = [
  { id: 'station', name: 'Station Steps', clue: 'Crowded commuters, expensive permit', cost: 125, traffic: 25, demand: 0.48, x: 270, y: 218 },
  { id: 'market', name: 'Market Lane', clue: 'Hungry shoppers linger here', cost: 75, traffic: 17, demand: 0.75, x: 470, y: 161 },
  { id: 'park', name: 'Pigeon Park', clue: 'Long walks, few alternatives', cost: 55, traffic: 12, demand: 0.91, x: 665, y: 217 },
  { id: 'office', name: 'Office Row', clue: 'Steady suits, short breaks', cost: 95, traffic: 19, demand: 0.56, x: 348, y: 350 },
  { id: 'canal', name: 'Canal Walk', clue: 'Pretty view, wandering crowds', cost: 40, traffic: 10, demand: 0.63, x: 603, y: 355 },
];

export const theme = {
  title: 'FLUSH WITH CASH', tagline: 'Build a tiny empire, one urgent decision at a time.',
  unitName: 'The Throne', successTitle: 'ROYAL FLUSH!', failureTitle: 'BACK TO THE DRAWING BOARD',
  colors: { background: 0x193a40, ground: 0x9fbc86, groundAlternate: 0xaac691,
    groundEdge: 0x587660, outline: 0x547761, assetFront: 0x48b3ba,
    assetSide: 0x287d8b, assetRoof: 0xb9e3da },
};
