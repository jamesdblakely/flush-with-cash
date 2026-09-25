// Copy, site clues, and balance values live outside the simulation and renderer.
export const economy = { startingCash: 185, price: 12, upkeep: 4, wear: 2.4, visitDuration: 4,
  serviceBaseCost: 8, serviceDamageCost: 40, reinforcedServiceCost: 12,
  outOfServiceFine: 10,
  signageCost: 60, signageTrafficBoost: 1.3, reinforcedCost: 85, reinforcedWearReduction: 0.15,
  surgeCost: 75, surgeMultiplier: 1.1, surgeWindow: 8,
  airFreshenerCost: 45, ventilationFanCost: 55,
  dayMinutes: 120, successProfit: 5 };

// Shared by map markers now and future sprite/animation variants later.
export const trafficTiers = {
  quiet: { label: 'Quiet', color: 0x7bb9c7 },
  steady: { label: 'Steady', color: 0xaacb72 },
  busy: { label: 'Busy', color: 0xf4ca72 },
  crush: { label: 'Crush', color: 0xf0786d },
};

export const sites = [
  { id: 'station', name: 'Station Steps', clue: 'Crowded commuters, expensive permit', signal: 'Very busy • urgent need • crush risk • premium rate', trafficTier: 'crush', minimumReputation: 55, cost: 125, price: 18, traffic: 25, demand: 0.82, wear: 1.9, x: 270, y: 218 },
  { id: 'market', name: 'Market Lane', clue: 'Hungry shoppers linger here', signal: 'Busy • strong need', trafficTier: 'busy', minimumReputation: 30, cost: 75, traffic: 17, demand: 0.75, wear: 1.1, x: 470, y: 161 },
  { id: 'park', name: 'Pigeon Park', clue: 'Long walks, few alternatives', signal: 'Steady • urgent need', trafficTier: 'steady', cost: 55, traffic: 12, demand: 0.91, wear: 1, x: 665, y: 217 },
  { id: 'office', name: 'Office Row', clue: 'Steady suits, short breaks', signal: 'Busy • moderate need', trafficTier: 'busy', cost: 95, traffic: 19, demand: 0.56, wear: 0.9, x: 363, y: 350 },
  { id: 'canal', name: 'Canal Walk', clue: 'Pretty view, wandering crowds', signal: 'Quiet • solid need', trafficTier: 'quiet', cost: 40, traffic: 10, demand: 0.63, wear: 0.85, x: 588, y: 355 },
  { id: 'festival', name: 'Weekend Festival', clue: 'A packed crowd with nowhere else to go', signal: 'Massive crowd • premium rate • daily service required', trafficTier: 'crush', minimumReputation: 65, cost: 225, price: 28, traffic: 55, demand: 0.98, wear: 2.4, minimumCondition: 80, days: [5, 6], x: 480, y: 275 },
];

export const theme = {
  title: 'FLUSH WITH CASH', tagline: 'Build a tiny empire, one urgent decision at a time.',
  unitName: 'The Throne', successTitle: 'ROYAL FLUSH!', failureTitle: 'BACK TO THE DRAWING BOARD',
  colors: { background: 0x193a40, ground: 0x9fbc86, groundAlternate: 0xaac691,
    groundEdge: 0x587660, outline: 0x547761, assetFront: 0x48b3ba,
    assetSide: 0x287d8b, assetRoof: 0xb9e3da },
};
