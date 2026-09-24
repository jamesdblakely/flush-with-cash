import Phaser from 'phaser';
import { theme } from '../content/theme.js';
import { createInitialState } from '../simulation/state.js';

export class FoundationScene extends Phaser.Scene {
  constructor() {
    super('foundation');
  }

  create() {
    this.state = createInitialState();
    const colors = theme.colors;
    const graphics = this.add.graphics();
    const polygon = (points, color) => {
      graphics.fillStyle(color, 1);
      graphics.fillPoints(points.map(([x, y]) => ({ x, y })), true);
    };

    // A tiny isometric display plinth, not the future playable town map.
    polygon([[288, 300], [480, 396], [480, 414], [288, 318]], colors.groundEdge);
    polygon([[480, 396], [672, 300], [672, 318], [480, 414]], 0x466859);
    for (let row = 0; row < 4; row++) {
      for (let column = 0; column < 4; column++) {
        const x = 480 + (column - row) * 48;
        const y = 204 + (column + row) * 24;
        const points = [[x, y], [x + 48, y + 24], [x, y + 48], [x - 48, y + 24]];
        polygon(points, (row + column) % 2 ? colors.ground : colors.groundAlternate);
        graphics.lineStyle(1, colors.outline, 0.45);
        graphics.strokePoints(points.map(([px, py]) => ({ x: px, y: py })), true);
      }
    }

    graphics.fillStyle(0x18383c, 0.18);
    graphics.fillEllipse(493, 302, 116, 40);
    // Temporary vector art; replace with theme sprites when artwork is needed.
    polygon([[439, 204], [488, 224], [488, 313], [439, 290]], colors.assetFront);
    polygon([[488, 224], [525, 204], [525, 290], [488, 313]], colors.assetSide);
    polygon([[434, 201], [474, 179], [530, 201], [489, 226]], colors.assetRoof);
    graphics.lineStyle(2, 0x247582);
    graphics.strokeRect(448, 225, 28, 58);
    graphics.fillStyle(0xe6f5dd);
    graphics.fillRect(455, 232, 14, 12);
    graphics.fillStyle(0x18383c);
    graphics.fillCircle(471, 260, 2);

    this.add.text(480, 92, theme.foundationLabel, {
      fontFamily: 'monospace', fontSize: '15px', color: '#a9c7bb', letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.text(480, 455, theme.assetLabel, {
      fontFamily: 'Arial', fontSize: '22px', color: '#f4f0d9',
    }).setOrigin(0.5);
    const beacon = this.add.circle(480, 150, 4, 0xf3ca70);
    this.tweens.add({ targets: beacon, alpha: 0.25, duration: 1000, yoyo: true, repeat: -1 });
  }
}
