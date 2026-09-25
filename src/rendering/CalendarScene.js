import Phaser from 'phaser';
import { sites } from '../content/theme.js';

const cream = '#fff4ce';
const ink = '#193a40';
const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export class CalendarScene extends Phaser.Scene {
  constructor() { super('calendar'); }

  init(data) { this.state = data.state; }

  label(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'monospace', fontSize: size + 'px', color });
  }

  button(x, y, width, text, action) {
    const box = this.add.rectangle(x, y, width, 44, 0xf4ca72).setStrokeStyle(3, ink)
      .setInteractive({ useHandCursor: true });
    this.label(x, y, text, 15, ink).setOrigin(0.5);
    box.on('pointerdown', action);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x193a40);
    this.add.rectangle(480, 270, 810, 430, 0x244f55).setStrokeStyle(5, 0xf4ca72);
    const week = Math.floor((this.state.day - 1) / 7) + 1;
    const firstDay = (week - 1) * 7 + 1;
    const weekHistory = (this.state.history || []).filter(day =>
      day.day >= firstDay && day.day < firstDay + 7);
    const weekRevenue = weekHistory.reduce((total, day) => total + day.profit, 0);
    const site = sites.find(item => item.id === this.state.site);

    this.label(480, 92, 'THE WEEK AHEAD', 28, '#f4ca72').setOrigin(0.5);
    this.label(480, 126, 'WEEK ' + week + '  •  WEEKLY PROFIT SO FAR: $' + weekRevenue, 15).setOrigin(0.5);
    this.label(480, 158, 'TODAY: ' + site.name + '  •  PERMIT PAID: $' + site.cost, 14, '#b8d4bf').setOrigin(0.5);

    weekDays.forEach((name, index) => {
      const x = 150 + index * 110;
      const calendarDay = firstDay + index;
      const prior = weekHistory.find(day => day.day === calendarDay);
      const today = calendarDay === this.state.day;
      const fill = prior ? (prior.profit >= 0 ? 0x4f8468 : 0x965655) : today ? 0xf4ca72 : 0x526b6d;
      this.add.rectangle(x, 280, 94, 158, fill).setStrokeStyle(today ? 4 : 2, today ? 0xfff4ce : ink);
      this.label(x, 220, name, 14, today ? '#f4ca72' : cream).setOrigin(0.5);
      this.label(x, 247, 'DAY ' + calendarDay, 11, ink).setOrigin(0.5);
      if (prior) {
        this.label(x, 282, prior.profit >= 0 ? 'CASH IN' : 'ROUGH DAY', 11, ink).setOrigin(0.5);
        this.label(x, 312, (prior.profit >= 0 ? '+' : '') + '$' + prior.profit, 20, ink).setOrigin(0.5);
        const priorSite = sites.find(item => item.id === prior.site);
        this.label(x, 344, priorSite.name, 10, ink).setOrigin(0.5);
      } else if (today) {
        this.label(x, 283, 'TODAY', 13, ink).setOrigin(0.5);
        this.label(x, 315, site.name, 11, ink).setOrigin(0.5);
        this.label(x, 345, 'OPEN FOR BUSINESS', 9, ink).setOrigin(0.5);
      } else {
        this.label(x, 301, 'UP NEXT', 11, '#dce5d6').setOrigin(0.5);
      }
    });

    this.label(480, 398, 'One throne. Seven chances to keep the books in the black.', 14, '#b8d4bf').setOrigin(0.5);
    this.button(480, 448, 260, 'START DAY ' + this.state.day, () => {
      this.scene.start('operating', { state: this.state });
    });
  }
}
