import Phaser from 'phaser';
import { theme, sites, economy } from '../content/theme.js';
import { advanceMinute } from '../simulation/state.js';
import { saveGame } from '../simulation/storage.js';
import portableToilet from '../assets/themes/flush-with-cash/street/portable-toilet-v1.png';
import walker0 from '../assets/themes/flush-with-cash/street/walker-0-v1.png';
import walker1 from '../assets/themes/flush-with-cash/street/walker-1-v1.png';
import walker2 from '../assets/themes/flush-with-cash/street/walker-2-v1.png';
import walker3 from '../assets/themes/flush-with-cash/street/walker-3-v1.png';
import walker4 from '../assets/themes/flush-with-cash/street/walker-4-v1.png';
import walker5 from '../assets/themes/flush-with-cash/street/walker-5-v1.png';
import pedestrianRefusal from '../assets/themes/flush-with-cash/street/pedestrian-refusal-v1.png';
import canalWalkBackground from '../assets/themes/flush-with-cash/street/canal-walk-v1.png';

const ink = '#193a40';
const cream = '#fff4ce';
const styles = {
  station: [0x8aa9b2, 0x6c7d80, 'STATION STEPS'],
  market: [0xe7b47b, 0x9b7059, 'MARKET LANE'],
  park: [0x8ec5d2, 0x739d6a, 'PIGEON PARK'],
  office: [0xa8bdca, 0x778691, 'OFFICE ROW'],
  canal: [0x9ecad1, 0x5c908f, 'CANAL WALK'],
  festival: [0x40285e, 0x8a4f75, 'WEEKEND FESTIVAL'],
};

export class OperatingScene extends Phaser.Scene {
  constructor() { super('operating'); }
  init(data) { this.state = data.state; }

  preload() {
    this.load.image('portable-toilet', portableToilet);
    [walker0, walker1, walker2, walker3, walker4, walker5].forEach((walker, persona) => {
      this.load.spritesheet(`pedestrian-walker-${persona}`, walker, { frameWidth: 512, frameHeight: 512 });
    });
    this.load.spritesheet('pedestrian-refusal', pedestrianRefusal, { frameWidth: 256, frameHeight: 256 });
    this.load.image('street-canal-walk', canalWalkBackground);
  }

  create() {
    this.lastTick = 0;
    this.site = sites.find(site => site.id === this.state.site);
    for (let persona = 0; persona < 6; persona++) {
      const key = `walk-persona-${persona}`;
      if (!this.anims.exists(key)) {
        this.anims.create({ key, frames: this.anims.generateFrameNumbers(`pedestrian-walker-${persona}`, { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
      }
    }
    this.drawStreet();
    this.drawHud();
  }

  label(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: size + 'px', color });
  }

  drawStreet() {
    const style = styles[this.site.id];
    if (this.site.id === 'canal') {
      this.add.image(480, 270, 'street-canal-walk').setDisplaySize(960, 540);
    }
    const g = this.add.graphics();
    if (this.site.id !== 'canal') {
      g.fillStyle(style[0]).fillRect(0, 0, 960, 540);
      g.fillStyle(style[1]).fillRect(0, 180, 960, 175);
      g.fillStyle(0xd7cfab).fillRect(0, 330, 960, 100);
      g.fillStyle(0x486064).fillRect(0, 430, 960, 110);
      g.lineStyle(3, 0xf1d685, 0.7);
      for (let x = 20; x < 960; x += 70) g.lineBetween(x, 486, x + 38, 486);
      if (this.site.id === 'park') {
        [110, 230, 740, 860].forEach((x, i) => g.fillStyle(0x476c48).fillCircle(x, 220 + (i % 2) * 18, 48));
      } else {
        [120, 170, 135, 200, 150].forEach((height, i) => g.fillStyle(i % 2 ? 0x526c70 : 0x6d7e7e).fillRect(38 + i * 195, 180 - height, 145, height));
      }
    }
    this.drawUnit(g, 455, 325);
    if (this.state.signage) this.drawSign(g, 455, 325);
    if (this.state.reinforced) this.drawReinforcement(g, 455, 325);
    if (this.state.surgePricing) this.drawSurgeSign(g, 455, 325);
    this.outOfServiceLabel = this.label(455, 266, 'OUT OF SERVICE', 13, '#f59b82')
      .setOrigin(0.5).setVisible(false);
    this.occupiedLabel = this.label(455, 266, 'IN USE', 13, '#f59b82').setOrigin(0.5).setVisible(false);
    this.label(480, 146, style[2], 20, '#f4ca72').setOrigin(0.5);
    this.label(480, 170, this.site.clue, 14).setOrigin(0.5);
  }

  drawUnit(g, x, y) {
    this.add.image(x, y - 47, 'portable-toilet').setDisplaySize(105, 140);
  }

  drawSign(g, x, y) {
    g.fillStyle(ink).fillRect(x + 44, y - 70, 5, 58);
    g.fillStyle(0xf4ca72).fillRect(x + 30, y - 85, 38, 22);
    this.label(x + 49, y - 79, 'WC', 12, ink).setOrigin(0.5);
  }

  drawReinforcement(g, x, y) {
    g.lineStyle(3, 0xf4ca72).lineBetween(x - 30, y - 50, x - 30, y + 12)
      .lineBetween(x + 29, y - 50, x + 29, y + 12);
    g.fillStyle(0xf4ca72).fillCircle(x - 30, y - 18, 3).fillCircle(x + 29, y - 18, 3);
  }

  drawSurgeSign(g, x, y) {
    g.fillStyle(0xf0786d).fillRect(x - 61, y - 67, 25, 18);
    this.label(x - 49, y - 63, '$$', 11, ink).setOrigin(0.5);
  }

  drawHud() {
    this.add.rectangle(480, 30, 960, 60, ink, 0.94);
    this.hud = this.label(22, 14, '', 16, '#f4ca72');
    this.details = this.label(22, 38, '', 14);
    this.upgradeText = this.label(720, 38, '', 12, '#b8d4bf');
    this.add.rectangle(480, 516, 960, 48, ink, 0.94);
    this.eventText = this.label(22, 498, '', 14, '#b8d4bf');
    this.progress = this.add.rectangle(20, 530, 1, 5, 0xf4ca72).setOrigin(0, 0.5);
    this.updateHud();
  }

  update(_time, delta) {
    this.lastTick += delta;
    if (this.lastTick < 125 || this.state.phase !== 'running') return;
    this.lastTick -= 125;
    this.state = advanceMinute(this.state);
    saveGame(localStorage, this.state);
    this.updateHud();
    if (this.state.activity) this.spawnCustomer(this.state.activity);
    if (this.state.phase === 'result') this.time.delayedCall(1250, () => this.scene.start('game', { state: this.state }));
  }

  updateHud() {
    const s = this.state;
    this.hud.setText('DAY ' + s.day + '  BANK $' + s.bank + '  REVENUE $' + s.revenue + '  COSTS $' + s.costs);
    this.details.setText('Served ' + s.uses + '  Walked by ' + s.passers + '  Turned away ' + s.turnedAway + '  Condition ' + Math.round(s.condition) + '%');
    this.eventText.setText(s.events.at(-1) || 'Waiting for the first customer...');
    const upgrades = [s.signage && 'SIGN', s.reinforced && 'REINFORCED', s.surgePricing && 'SURGE',
      s.airFreshener && 'FRESHENER', s.ventilationFan && 'FAN'].filter(Boolean);
    this.upgradeText?.setText(upgrades.length ? 'ACTIVE: ' + upgrades.join(' • ') : 'ACTIVE: NONE');
    this.progress.width = 920 * s.minute / economy.dayMinutes;
    this.occupiedLabel.setVisible(s.minute < s.occupiedUntil);
    this.outOfServiceLabel.setVisible(s.condition <= 0);
  }

  spawnCustomer(activity) {
    const direction = activity.visitor % 2 ? 1 : -1;
    const persona = activity.visitor % 6;
    const person = this.add.sprite(direction > 0 ? -20 : 980, 370, `pedestrian-walker-${persona}`, 0)
      .setScale(0.2)
      .setFlipX(direction < 0)
      .play(`walk-persona-${persona}`);
    person.persona = persona;
    const pass = activity.type === 'pass';
    if (pass) {
      this.tweens.add({ targets: person, x: direction > 0 ? 990 : -30, duration: 1100,
        onComplete: () => person.destroy() });
      return;
    }
    const entranceX = 455 - direction * 42;
    this.tweens.add({ targets: person, x: entranceX, duration: 480, onComplete: () => {
      this.tweens.add({ targets: person, y: 347, duration: 300, onComplete: () => {
        this.interactWithUnit(person, activity, direction);
      } });
    } });
  }

  interactWithUnit(person, activity, direction) {
    if (!person.active) return;
    person.anims.pause();
    this.time.delayedCall(150, () => this.resolveInteraction(person, activity, direction));
  }

  resolveInteraction(person, activity, direction) {
    if (!person.active) return;
    if (activity.type === 'served') {
      this.flash(person.x, 320, '+$' + activity.amount, '#f4ca72');
      person.setVisible(false);
      this.time.delayedCall(400, () => {
        if (person.active) {
          person.setVisible(true);
          this.exitCustomer(person, direction);
        }
      });
      return;
    }
    this.playRefusal(person, activity, direction);
  }

  playRefusal(person, activity, direction) {
    person.anims.stop();
    person.setTint(0xff7777);
    const fist = this.add.text(person.x + direction * 30, person.y - 45, '✊', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#f59b82',
    }).setOrigin(0.5);
    this.tweens.add({ targets: fist, x: fist.x + direction * 5, angle: direction * 10,
      duration: 110, yoyo: true, repeat: 5 });
    this.flash(person.x, 320, activity.type === 'occupied' ? 'OCCUPIED' :
      activity.type === 'outOfService' ? 'OUT OF SERVICE' : 'NO SALE', '#f59b82');
    const bubble = this.add.container(person.x, person.y - 68, [
      this.add.ellipse(0, 0, 62, 30, 0xfff4ce).setStrokeStyle(2, 0x193a40),
      this.label(0, -8, '%#!#@', 13, ink).setOrigin(0.5),
    ]).setAlpha(0);
    this.time.delayedCall(340, () => bubble.setAlpha(1));
    this.time.delayedCall(950, () => {
      fist.destroy();
      bubble.destroy();
      if (!person.active) return;
      person.clearTint().play(`walk-persona-${person.persona}`);
      this.exitCustomer(person, direction);
    });
  }

  exitCustomer(person, direction) {
    if (person.texture.key.startsWith('pedestrian-walker-')) person.play(`walk-persona-${person.persona}`);
    this.tweens.add({ targets: person, y: 402, duration: 300, onComplete: () => {
      if (!person.active) return;
      this.tweens.add({ targets: person, x: direction > 0 ? 990 : -30, duration: 650,
        onComplete: () => person.destroy() });
    } });
  }

  flash(x, y, text, color) {
    const label = this.label(x, y, text, 16, color).setOrigin(0.5);
    this.tweens.add({ targets: label, y: y - 24, alpha: 0, duration: 650, onComplete: () => label.destroy() });
  }
}
