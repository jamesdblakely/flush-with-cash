import Phaser from 'phaser';
import { sites } from '../content/theme.js';

const cream = '#fff4ce';
const ink = '#193a40';
const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export class CalendarScene extends Phaser.Scene {
  constructor() { super('calendar'); }

  init(data) { this.state = data.state; }

  label(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'DM Sans', fontSize: size + 'px', color });
  }
  displayLabel(x, y, text, size = 18, color = cream) {
    return this.add.text(x, y, text, { fontFamily: 'Bungee', fontSize: size + 'px', color });
  }

  button(x, y, width, text, action) {
    const box = this.add.rectangle(x, y, width, 44, 0xf4ca72).setStrokeStyle(3, ink)
      .setInteractive({ useHandCursor: true });
    this.displayLabel(x, y, text, 14, ink).setOrigin(0.5);
    box.on('pointerdown', action);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x193a40);
    const week = Math.floor((this.state.day - 1) / 7) + 1;
    const firstDay = (week - 1) * 7 + 1;
    const weekHistory = (this.state.history || []).filter(day =>
      day.day >= firstDay && day.day < firstDay + 7);
    const weekRevenue = weekHistory.reduce((total, day) => total + day.profit, 0);
    const site = sites.find(item => item.id === this.state.site);

    // A printed weekly ledger keeps the calendar consistent with the map's parchment labels.
    this.add.rectangle(480, 270, 918, 498, 0x244f55).setStrokeStyle(3, 0xf4ca72);
    this.add.rectangle(480, 64, 890, 62, 0x193a40).setStrokeStyle(2, 0x6d4c2c);
    this.add.rectangle(480, 113, 860, 25, 0xffe1a0).setStrokeStyle(1, 0x6d4c2c);
    this.displayLabel(38, 42, 'FLUSH WITH CASH', 14, '#f4ca72');
    this.displayLabel(480, 52, `WEEK ${week} · FIELD LEDGER`, 22, '#f4ca72').setOrigin(0.5);
    this.label(480, 89, 'Seven days to keep the books in the black.', 13, '#b8d4bf').setOrigin(0.5);
    this.displayLabel(480, 113, `TODAY: ${site.name.toUpperCase()}  ·  PERMIT PAID $${site.cost}`, 11, ink).setOrigin(0.5);

    const profitFill = weekRevenue >= 0 ? 0x4f8468 : 0x965655;
    this.add.rectangle(780, 148, 250, 34, profitFill).setStrokeStyle(2, 0xfff4ce);
    this.displayLabel(780, 148, `WEEKLY LEDGER  ${weekRevenue >= 0 ? '+' : ''}$${weekRevenue}`, 11, cream).setOrigin(0.5);
    this.label(180, 148, 'MONDAY → SUNDAY', 12, '#b8d4bf').setOrigin(0.5);
    this.add.rectangle(480, 168, 840, 2, 0x587660);

    weekDays.forEach((name, index) => {
      const x = 115 + index * 122;
      const calendarDay = firstDay + index;
      const prior = weekHistory.find(day => day.day === calendarDay);
      const today = calendarDay === this.state.day;
      const fill = prior ? (prior.profit >= 0 ? 0x4f8468 : 0x965655) : today ? 0xf4ca72 : 0x365d61;
      const textColor = today ? ink : cream;
      this.add.rectangle(x, 272, 110, 182, fill)
        .setStrokeStyle(today ? 4 : 2, today ? 0xfff4ce : 0x6d4c2c);
      this.add.rectangle(x, 195, 110, 28, today ? 0xffe1a0 : 0x193a40)
        .setStrokeStyle(1, today ? 0x6d4c2c : 0x587660);
      this.displayLabel(x, 195, name, 12, today ? ink : '#f4ca72').setOrigin(0.5);
      this.label(x, 218, 'DAY ' + calendarDay, 10, textColor).setOrigin(0.5);
      if (prior) {
        this.displayLabel(x, 250, prior.profit >= 0 ? 'CASH IN' : 'ROUGH DAY', 10, textColor).setOrigin(0.5);
        this.displayLabel(x, 282, (prior.profit >= 0 ? '+' : '') + '$' + prior.profit, 21, textColor).setOrigin(0.5);
        const priorSite = sites.find(item => item.id === prior.site);
        this.label(x, 320, priorSite.name, 10, textColor).setOrigin(0.5);
        this.label(x, 341, 'DAY CLOSED', 9, textColor).setOrigin(0.5);
      } else if (today) {
        this.displayLabel(x, 250, 'TODAY', 12, ink).setOrigin(0.5);
        this.label(x, 281, site.name, 11, ink).setOrigin(0.5);
        this.label(x, 309, 'OPEN FOR BUSINESS', 9, ink).setOrigin(0.5);
        this.add.circle(x, 334, 6, 0x4f8468).setStrokeStyle(2, ink);
      } else {
        this.displayLabel(x, 275, 'UP NEXT', 10, '#b8d4bf').setOrigin(0.5);
        this.label(x, 307, 'KEEP IT CLEAN.', 9, '#b8d4bf').setOrigin(0.5);
        this.label(x, 326, 'KEEP IT EARNING.', 9, '#b8d4bf').setOrigin(0.5);
      }
    });

    this.add.rectangle(480, 399, 830, 2, 0x587660);
    this.displayLabel(480, 424, `DAY ${this.state.day} IS READY`, 14, '#f4ca72').setOrigin(0.5);
    this.label(480, 446, 'Open the route, serve the crowd, then bring the earnings back to this ledger.', 13, '#b8d4bf').setOrigin(0.5);
    this.button(480, 484, 300, 'OPEN DAY ' + this.state.day, () => {
      this.scene.start('operating', { state: this.state });
    });
  }
}
