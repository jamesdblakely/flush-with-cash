# Flush with Cash

*Flush with Cash* is a browser tycoon game about running one inherited porta-potty. Choose a location, survive a short operating day, pay for repairs and permits, improve the unit, and build enough reputation to reach the busiest sites.

Play the deployed build at [jamesdblakely.github.io/flush-with-cash](https://jamesdblakely.github.io/flush-with-cash/).

## Documentation

- [How to play](docs/HOW_TO_PLAY.md) — a practical guide to the screens, goals, and decisions.
- [Game systems reference](docs/GAME_SYSTEMS.md) — current numbers, formulas, conditions, upgrades, saving, and visual behavior.

## Run locally

Requires Node.js 22.12 or newer.

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. Use `npm.cmd run build` for the full automated check: it runs the test suite and creates a production build in `dist/`.

## Project layout

- `src/content/theme.js` — locations, economy values, traffic tiers, theme copy, and balance data.
- `src/simulation/state.js` — deterministic game rules and daily accounting.
- `src/simulation/storage.js` — local save validation and recovery.
- `src/rendering/` — Phaser scenes for the map, calendar, street operation, upgrades, and shared ledger UI.
- `tests/` — unit tests for rules, accounting, weeks, upgrades, and save recovery.

The game uses Phaser for rendering and Vite for development and production builds. Progress is saved in the browser’s local storage on the current device.
