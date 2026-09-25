import Phaser from 'phaser';
import { economy } from '../content/theme.js';
import { buySignage, buyReinforced, buySurgePricing, buyAirFreshener, buyVentilationFan, nextDay } from '../simulation/state.js';
import { saveGame } from '../simulation/storage.js';

const ink = '#193a40';
const cream = '#fff4ce';

export class UpgradeScene extends Phaser.Scene {
  constructor() { super('upgrades'); }
  init(data) {
    this.returnPhase = data.state.phase;
    this.state = { ...data.state, phase: 'upgrades' };
  }
  label(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'DM Sans', fontSize: size + 'px', color, align: 'center' });
  }
  displayLabel(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'Bungee', fontSize: size + 'px', color, align: 'center' });
  }
  create() { this.paint(); }
  paint() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor(ink);
    this.displayLabel(480, 65, 'THE EQUIPMENT YARD', 22, '#f4ca72').setOrigin(0.5);
    this.label(480, 96, 'BANK $' + this.state.bank + '  •  Buy improvements before choosing a site.', 14, '#b8d4bf').setOrigin(0.5);
    this.tile(110, 'MARKETING', 'TOWN SIGN', '30% more visitors this week.', economy.signageCost, this.state.signage, buySignage);
    this.tile(295, 'STRUCTURE', 'REINFORCED', '15% less wear.', economy.reinforcedCost, this.state.reinforced, buyReinforced);
    this.tile(480, 'PRICING', 'SURGE', '10% more after turnaways.', economy.surgeCost, this.state.surgePricing, buySurgePricing);
    this.tile(665, 'REPUTATION', 'FRESHENER', 'Improves reputation gains.', economy.airFreshenerCost, this.state.airFreshener, buyAirFreshener);
    this.tile(850, 'REPUTATION', 'FAN', 'Slows reputation losses.', economy.ventilationFanCost, this.state.ventilationFan, buyVentilationFan);
    const button = this.add.rectangle(480, 460, 270, 46, 0xf4ca72).setStrokeStyle(3, ink).setInteractive({ useHandCursor: true });
    this.displayLabel(480, 460, this.returnPhase === 'planning' ? 'BACK TO PLANNING' : 'PLAN DAY ' + (this.state.day + 1), 13, ink).setOrigin(0.5);
    button.on('pointerdown', () => {
      this.state = this.returnPhase === 'planning' ? { ...this.state, phase: 'planning' } : nextDay(this.state);
      saveGame(localStorage, this.state);
      this.scene.start('game', { state: this.state });
    });
  }
  tile(x, category, title, description, cost, owned, purchase) {
    const affordable = this.state.bank - cost >= 40;
    const fill = owned ? 0x4f8468 : affordable ? 0x526b6d : 0x3d4a4c;
    const box = this.add.rectangle(x, 265, 170, 260, fill).setStrokeStyle(3, owned ? 0xf4ca72 : ink);
    this.displayLabel(x, 148, category, 9, '#b8d4bf').setOrigin(0.5);
    this.displayLabel(x, 175, title, 13, owned ? '#f4ca72' : cream).setOrigin(0.5);
    this.label(x, 222, description, 11).setOrigin(0.5);
    this.label(x, 276, owned ? 'INSTALLED' : 'COST $' + cost, 16, owned ? '#f4ca72' : cream).setOrigin(0.5);
    if (!owned && affordable) {
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.state = purchase(this.state);
        saveGame(localStorage, this.state);
        this.paint();
      });
      this.displayLabel(x, 335, 'BUY', 13, '#f4ca72').setOrigin(0.5);
    } else if (!owned) this.label(x, 335, 'NEED CASH', 13, '#f59b82').setOrigin(0.5);
  }
}
