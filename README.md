# Flush with Cash

A small, silly browser tycoon experiment. Choose one of five sites for an inherited unit, watch the town through a short operating day, and see a retro result card. Then plan another day with the bank balance, unit condition, and reputation you earned.

Design source: [Game Design & Development Handoff](https://app.notion.com/p/3e517b179e488181b31de3e6de473c6f).

## Run locally

Use Node.js 22.12+ (Node 24 LTS recommended). In VS Code, open this folder and open Terminal → New Terminal:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed in the terminal. Keep that terminal running; edits refresh the browser automatically. Stop it with Ctrl+C. On Windows, `npm.cmd` avoids PowerShell script-policy issues; `npm` also works in other shells.

```powershell
npm.cmd run build
npm.cmd run preview
```

Build produces `dist/`; preview serves that production build locally. No backend or deployment is configured.

## Where things live

- `src/main.js`: starts Phaser and sets up a responsive canvas.
- `src/rendering/FoundationScene.js`: draws the isometric town, moving pedestrians, controls, HUD, and result card.
- `src/content/theme.js`: theme-specific copy, colors, site clues, and balance values.
- `src/simulation/state.js`: plain JavaScript placement and day rules, independent of Phaser and browser APIs.
- `src/style.css`: the HTML shell around the game.

Only two packages are needed: Phaser for the game, Vite for serving/building it. Placeholder art is drawn directly with Phaser. A complete day lasts about 15 seconds. Each of its 120 simulation minutes can bring a visitor. Visitors visibly walk by, use the unit for a sale, or turn away when its condition discourages them. Demand, condition, and site cost make the busiest location an imperfect choice. Revenue is earned per use, while placement and regular cleaning are costs. The result needs at least $5 profit and 55% satisfaction. After results, **Plan Day** carries the bank, condition, reputation, and permanent town sign into the next day. Service the unit for a fee before choosing a site when condition is low, or buy a town sign to attract 30% more visitors. The result card tracks total profit and the best day. If the bank can no longer cover even the cheapest permit, start a new business. Progress saves automatically in browser local storage. After a refresh, choose **Continue** on the title screen to resume; **New Game** replaces that save. Run `npm.cmd test` to check visitor accounting, carryover, ledger, and saves.

## Small Git workflow

Work on `main` initially. Review changes in VS Code Source Control or with `git diff`, build, then commit a small working step. Dependencies and generated builds are ignored; the lockfile is tracked for repeatable installs (`npm.cmd ci`).

If Git asks for your identity, configure it **for this repository** using your personal GitHub name and private/noreply email:

```powershell
git config user.name "YOUR NAME"
git config user.email "YOUR GITHUB NOREPLY EMAIL"
git add .
git commit -m "Set up Milestone 0 foundation"
```

For GitHub, sign in to the intended personal account, create an empty **private** repository named `flush-with-cash` (no README, license, or gitignore), then use its actual URL:

```powershell
git remote add origin https://github.com/YOUR-ACCOUNT/flush-with-cash.git
git push -u origin main
```

## Next milestone

Make the town map the site-selection view only. Once the player places the unit, switch to a separate, closer street-level scene focused on the chosen site. Show the unit and pedestrians there during the operating day, with site-specific surroundings so each location feels distinct. Keep the existing customer and economy simulation connected to that street scene. Plan the camera, backgrounds, character sprites, and unit sprites together before replacing the vector placeholders. Then improve customer feedback and playtest site and upgrade balance. The simulation still covers one unit. Saves are local to one browser and device.
