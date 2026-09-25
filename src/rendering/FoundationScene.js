import Phaser from 'phaser';
import { theme, sites, economy } from '../content/theme.js';
import { createInitialState, selectSite, placeUnit, advanceMinute, getResult,
  nextDay, serviceUnit, canAffordNextDay } from '../simulation/state.js';

const ink = '#193a40';
const cream = '#fff4ce';

export class FoundationScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    this.state = createInitialState();
    this.lastTick = 0;
    this.paint();
  }

  update(_time, delta) {
    if (this.state.phase !== 'running') return;
    this.lastTick += delta;
    if (this.lastTick >= 125) {
      this.lastTick -= 125;
      this.state = advanceMinute(this.state);
      this.updateHud();
      if (this.state.activity) this.spawnCustomer(this.state.activity);
      if (this.state.phase === 'result') this.time.delayedCall(1250, () => this.paint());
    }
  }

  label(x, y, value, size = 18, color = cream, options = {}) {
    return this.add.text(x, y, value, { fontFamily: 'monospace', fontSize: `${size}px`,
      color, ...options });
  }

  button(x, y, width, value, action, enabled = true) {
    const box = this.add.rectangle(x, y, width, 42, enabled ? 0xf4ca72 : 0x617272)
      .setStrokeStyle(2, 0x193a40);
    this.label(x, y, value, 15, ink).setOrigin(0.5);
    if (enabled) box.setInteractive({ useHandCursor: true }).on('pointerdown', action);
    return box;
  }

  polygon(graphics, points, color) {
    graphics.fillStyle(color).fillPoints(points.map(([x, y]) => ({ x, y })), true);
  }

  town() {
    const g = this.add.graphics();
    const c = theme.colors;
    this.polygon(g, [[80, 260], [480, 455], [880, 260], [480, 65]], c.groundEdge);
    this.polygon(g, [[80, 244], [480, 439], [880, 244], [480, 49]], c.ground);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const x = 480 + (col - row) * 50;
      const y = 49 + (col + row) * 24.4;
      const points = [[x, y], [x + 50, y + 24.4], [x, y + 48.8], [x - 50, y + 24.4]];
      this.polygon(g, points, (row + col) % 2 ? c.ground : c.groundAlternate);
      g.lineStyle(1, c.outline, 0.3).strokePoints(points.map(([px, py]) => ({ x: px, y: py })), true);
    }
    // Cross-town pavement gives pedestrians a clear visual route.
    this.polygon(g, [[132, 261], [470, 407], [827, 255], [487, 110]], 0xd7d0a4);
    this.polygon(g, [[170, 264], [470, 386], [789, 255], [487, 131]], 0xbfc49b);
    sites.forEach((site, index) => {
      const { x, y } = site;
      g.fillStyle(0x325d5b, 0.45).fillEllipse(x, y + 13, 86, 26);
      if (this.state.site === site.id) this.drawUnit(g, x, y);
      else {
        this.polygon(g, [[x, y - 12], [x + 29, y], [x, y + 12], [x - 29, y]], 0xf1d685);
        g.lineStyle(2, 0x33595a).strokeEllipse(x, y, 60, 25);
      }
      if (this.state.phase === 'planning') {
        const marker = this.add.circle(x, y - 29, 15,
          this.state.selectedSite === site.id ? 0xf4ca72 : 0x244f55)
          .setStrokeStyle(2, 0xfff4ce);
        this.label(x, y - 29, String(index + 1), 14).setOrigin(0.5);
        // One generous hit area covers the number and the yellow placement pad.
        this.add.zone(x, y - 9, 80, 76).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => { this.state = selectSite(this.state, site.id); this.paint(); });
      }
    });
  }

  drawUnit(g, x, y) {
    const c = theme.colors;
    this.polygon(g, [[x - 23, y - 43], [x, y - 33], [x, y + 12], [x - 23, y + 1]], c.assetFront);
    this.polygon(g, [[x, y - 33], [x + 22, y - 43], [x + 22, y + 1], [x, y + 12]], c.assetSide);
    this.polygon(g, [[x - 26, y - 45], [x, y - 58], [x + 25, y - 45], [x, y - 31]], c.assetRoof);
    g.fillStyle(0xeef6d1).fillRect(x - 17, y - 30, 10, 12);
    g.fillStyle(0x193a40).fillCircle(x - 5, y - 3, 2);
  }

  spawnCustomer(activity) {
    const site = sites.find(item => item.id === this.state.site);
    const direction = activity.visitor % 2 === 0 ? 1 : -1;
    const x = site.x - direction * 110;
    const y = site.y + 35;
    const color = [0xd97767, 0x346b91, 0xf5cb6a, 0x745c90][activity.visitor % 4];
    const person = this.add.container(x, y, [
      this.add.ellipse(0, 5, 15, 5, 0x24443a, 0.3),
      this.add.rectangle(0, -3, 7, 12, color),
      this.add.circle(0, -13, 5, 0xffd4aa),
    ]);
    const passing = activity.type === 'pass';
    const targetX = passing ? site.x - direction * 40 : site.x - direction * 10;
    const targetY = passing ? site.y + 27 : site.y + 11;
    this.tweens.add({ targets: person, x: targetX, y: targetY,
      duration: 520, ease: 'Linear', onComplete: () => {
        if (!person.active) return;
        if (activity.type === 'served') {
          this.flashRevenue();
          person.setAlpha(0);
          this.time.delayedCall(220, () => {
            if (!person.active) return;
            person.setAlpha(1);
            this.walkAway(person, direction);
          });
        } else {
          if (activity.type === 'turnedAway') this.flashOutcome(person.x, person.y - 28, 'NO SALE', '#f59b82');
          this.walkAway(person, direction);
        }
      } });
  }

  walkAway(person, direction) {
    this.tweens.add({ targets: person, x: person.x + direction * 115,
      y: person.y + 30, alpha: 0, duration: 660,
      onComplete: () => person.destroy() });
  }

  flashOutcome(x, y, message, color) {
    const pop = this.label(x, y, message, 16, color).setOrigin(0.5);
    this.tweens.add({ targets: pop, y: y - 23, alpha: 0, duration: 700,
      onComplete: () => pop.destroy() });
  }

  paint() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor(theme.colors.background);
    this.town();
    this.add.rectangle(480, 24, 960, 48, 0x193a40, 0.9);
    this.label(24, 12, theme.title, 24, '#f4ca72');
    if (this.state.phase === 'title') this.titleScreen();
    if (this.state.phase === 'planning') this.planningScreen();
    if (this.state.phase === 'running') this.runningScreen();
    if (this.state.phase === 'result') this.resultScreen();
  }

  titleScreen() {
    this.add.rectangle(480, 280, 580, 280, 0x193a40, 0.95).setStrokeStyle(4, 0xf4ca72);
    this.label(480, 175, 'ONE THRONE. ONE TOWN. MANY DAYS.', 20, '#f4ca72').setOrigin(0.5);
    this.label(480, 222, theme.tagline, 15).setOrigin(0.5);
    this.label(480, 259, `Inherited: ${theme.unitName}  •  Cash: $${this.state.bank}`, 16).setOrigin(0.5);
    this.button(480, 336, 230, 'START YOUR EMPIRE', () => {
      this.state = { ...this.state, phase: 'planning' }; this.paint();
    });
  }

  planningScreen() {
    const selected = sites.find(site => site.id === this.state.selectedSite);
    const canService = this.state.condition < 100 &&
      this.state.bank - economy.serviceCost >= Math.min(...sites.map(site => site.cost));
    this.add.rectangle(480, 472, 960, 136, 0x193a40, 0.96);
    this.label(22, 410, `DAY ${this.state.day}  •  CHOOSE A SITE`, 18, '#f4ca72');
    this.label(22, 438, selected ? `${selected.name}  •  Permit $${selected.cost}` : 'Tap a site pad, number, or name below.', 16);
    this.label(22, 464, `Bank $${this.state.bank}  •  Condition ${Math.round(this.state.condition)}%  •  Reputation ${this.state.reputation}`, 14);
    this.label(22, 488, selected ? `${selected.clue}  •  Footfall ${selected.traffic}/hr  •  Need ${Math.round(selected.demand * 100)}%` : `Service restores condition to 100% for $${economy.serviceCost}.`, 13);
    const serviceLabel = this.state.condition >= 100 ? 'UNIT READY' :
      canService ? `SERVICE UNIT $${economy.serviceCost}` : 'NEED CASH TO SERVICE';
    this.button(815, 432, 255, serviceLabel, () => {
      this.state = serviceUnit(this.state); this.paint();
    }, canService);
    this.button(815, 483, 255, selected ? `PLACE FOR $${selected.cost}` : 'PICK A SITE', () => {
      this.state = placeUnit(this.state); this.paint();
    }, Boolean(selected && this.state.bank >= selected.cost));
    sites.forEach((site, i) => {
      const text = this.label(20 + i * 190, 520, `${i + 1} ${site.name}`, 12,
        this.state.selectedSite === site.id ? '#f4ca72' : cream);
      text.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.state = selectSite(this.state, site.id); this.paint();
      });
    });
  }

  runningScreen() {
    this.add.rectangle(480, 474, 960, 132, 0x193a40, 0.96);
    this.hud = this.label(22, 424, '', 16, '#f4ca72');
    this.details = this.label(22, 454, '', 15);
    this.eventText = this.label(22, 488, '', 14, '#b8d4bf');
    this.progress = this.add.rectangle(480, 529, 920, 6, 0x3b6260).setOrigin(0.5);
    this.progressFill = this.add.rectangle(20, 529, 1, 6, 0xf4ca72).setOrigin(0, 0.5);
    this.updateHud();
  }

  updateHud() {
    if (!this.hud?.active) return;
    const s = this.state;
    const clock = `${String(8 + Math.floor(s.minute / 30)).padStart(2, '0')}:${s.minute % 30 < 15 ? '00' : '30'}`;
    this.hud.setText(`DAY ${s.day}  ${clock}     BANK $${s.bank}     REVENUE $${s.revenue}     COSTS $${s.costs}`);
    this.details.setText(`Served ${s.uses}  Walked by ${s.passers}  Turned away ${s.turnedAway}     Condition ${Math.round(s.condition)}%     Satisfaction ${Math.round(s.satisfaction)}%`);
    this.eventText.setText(s.events.at(-1) || 'Waiting for the first customer…');
    this.progressFill.width = 920 * s.minute / economy.dayMinutes;
  }

  flashRevenue() {
    const site = sites.find(item => item.id === this.state.site);
    this.flashOutcome(site.x, site.y - 72, `+$${economy.price}`, '#f4ca72');
  }

  resultScreen() {
    const s = this.state;
    const result = getResult(s);
    const canContinue = canAffordNextDay(s);
    this.add.rectangle(480, 275, 620, 395, 0x193a40, 0.97).setStrokeStyle(5, 0xf4ca72);
    // A tiny illustrated newspaper-style result: crown or rain cloud above the unit.
    const g = this.add.graphics();
    this.drawUnit(g, 480, 188);
    if (result.success) {
      this.polygon(g, [[446, 106], [457, 91], [470, 105], [480, 86], [491, 105], [503, 91], [514, 106], [508, 117], [452, 117]], 0xf4ca72);
    } else {
      g.fillStyle(0x8caeb3).fillEllipse(480, 104, 70, 27);
      g.lineStyle(3, 0x8caeb3).lineBetween(458, 126, 451, 140).lineBetween(482, 126, 475, 140);
    }
    this.label(480, 236, result.success ? theme.successTitle : theme.failureTitle, 26, '#f4ca72').setOrigin(0.5);
    this.label(480, 274, canContinue ? `Day ${s.day} is in the books.` : 'The business needs a fresh start.', 16).setOrigin(0.5);
    this.label(480, 311, `Site: ${sites.find(site => site.id === s.site).name}   Uses: ${s.uses} / ${s.visitors} visitors`, 15).setOrigin(0.5);
    this.label(480, 340, `Revenue $${s.revenue}   Costs $${s.costs}   Profit $${result.profit}`, 15).setOrigin(0.5);
    this.label(480, 369, `Bank $${s.bank}   Condition ${Math.round(s.condition)}%   Reputation ${s.reputation} (${s.reputation - s.dayStartReputation >= 0 ? '+' : ''}${s.reputation - s.dayStartReputation})`, 15).setOrigin(0.5);
    this.button(480, 427, 230, canContinue ? `PLAN DAY ${s.day + 1}` : 'START OVER', () => {
      this.state = canContinue ? nextDay(this.state) : { ...createInitialState(), phase: 'planning' };
      this.paint();
    });
  }
}
