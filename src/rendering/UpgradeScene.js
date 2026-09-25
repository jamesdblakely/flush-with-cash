import Phaser from 'phaser';
import { drawLedgerHeader } from './ledger.js';
import { economy } from '../content/theme.js';
import { buySignage, buyReinforced, buySurgePricing, buyAirFreshener, buyVentilationFan, nextDay } from '../simulation/state.js';
import { saveGame } from '../simulation/storage.js';

const ink = '#193a40';
const cream = '#fff4ce';

export class UpgradeScene extends Phaser.Scene {
  constructor() { super('upgrades'); }
  init(data) {
    this.returnPhase = data.state.phase;
    this.state = { ...data.state, phase: 'upgrades', upgradeReturnPhase: this.returnPhase };
  }
  label(x, y, text, size = 18, color = cream, options = {}) {
    return this.add.text(x, y, text, { fontFamily: 'DM Sans', fontSize: size + 'px', color, align: 'center', ...options });
  }
  displayLabel(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'Bungee', fontSize: size + 'px', color, align: 'center' });
  }
  create() { this.paint(); }
  paint() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor(ink);
    drawLedgerHeader(this, 'THE EQUIPMENT YARD',
      'Build a better throne before you open the route.', `AVAILABLE CASH  ·  $${this.state.bank}`);
    this.label(70, 148, 'WEEKLY IMPROVEMENTS', 12, '#b8d4bf').setOrigin(0, 0.5);
    this.label(890, 148, 'TOWN SIGN EXPIRES WEEKLY · EQUIPMENT STAYS', 10, '#b8d4bf').setOrigin(1, 0.5);
    this.add.rectangle(480, 168, 840, 2, 0x587660);
    this.tile(110, 'MARKETING', 'TOWN SIGN', '30% more visitors this week.', economy.signageCost, this.state.signage, buySignage);
    this.tile(295, 'STRUCTURE', 'REINFORCED', '15% less wear.', economy.reinforcedCost, this.state.reinforced, buyReinforced);
    this.tile(480, 'PRICING', 'SURGE', '10% more after turnaways.', economy.surgeCost, this.state.surgePricing, buySurgePricing);
    this.tile(665, 'REPUTATION', 'FRESHENER', 'Improves reputation gains.', economy.airFreshenerCost, this.state.airFreshener, buyAirFreshener);
    this.tile(850, 'REPUTATION', 'FAN', 'Slows reputation losses.', economy.ventilationFanCost, this.state.ventilationFan, buyVentilationFan);
    this.add.rectangle(480, 431, 830, 2, 0x587660);
    this.label(480, 449, 'Pick carefully. Every dollar left in the bank helps cover tomorrow’s permit.', 12, '#b8d4bf').setOrigin(0.5);
    const button = this.add.rectangle(480, 483, 300, 44, 0xf4ca72).setStrokeStyle(3, ink).setInteractive({ useHandCursor: true });
    this.displayLabel(480, 483, this.returnPhase === 'planning' ? 'BACK TO PLANNING' : 'PLAN DAY ' + (this.state.day + 1), 13, ink).setOrigin(0.5);
    button.on('pointerdown', () => {
      this.state = this.returnPhase === 'planning' ? { ...this.state, phase: 'planning' } : nextDay(this.state);
      saveGame(localStorage, this.state);
      this.scene.start('game', { state: this.state });
    });
  }
  tile(x, category, title, description, cost, owned, purchase) {
    const affordable = !owned && purchase(this.state) !== this.state;
    const fill = owned ? 0x4f8468 : affordable ? 0x365d61 : 0x3d4a4c;
    const box = this.add.rectangle(x, 292, 166, 244, fill).setStrokeStyle(3, owned ? 0xf4ca72 : 0x6d4c2c);
    this.add.rectangle(x, 193, 144, 26, owned ? 0xf4ca72 : 0xffe1a0).setStrokeStyle(1, 0x6d4c2c);
    this.displayLabel(x, 193, category, 9, ink).setOrigin(0.5);
    this.displayLabel(x, 228, title, 13, owned ? '#f4ca72' : cream).setOrigin(0.5);
    this.add.rectangle(x, 247, 126, 1, 0x587660);
    this.label(x, 268, description, 11, cream, { wordWrap: { width: 138 } }).setOrigin(0.5);
    this.add.rectangle(x, 328, 130, 31, owned ? 0xf4ca72 : 0xffe1a0).setStrokeStyle(1, 0x6d4c2c);
    this.displayLabel(x, 328, owned ? 'INSTALLED' : 'COST $' + cost, 11, ink).setOrigin(0.5);
    if (!owned && affordable) {
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.state = purchase(this.state);
        saveGame(localStorage, this.state);
        this.paint();
      });
      this.add.rectangle(x, 377, 126, 34, 0xf4ca72).setStrokeStyle(2, ink);
      this.displayLabel(x, 377, 'BUY UPGRADE', 10, ink).setOrigin(0.5);
    } else if (!owned) {
      this.add.rectangle(x, 377, 126, 34, 0x674545).setStrokeStyle(2, 0x3d2929);
      this.displayLabel(x, 377, 'NEED CASH', 10, '#fff4ce').setOrigin(0.5);
    } else {
      this.displayLabel(x, 377, 'READY FOR ROUTE', 10, '#f4ca72').setOrigin(0.5);
    }
  }
}
