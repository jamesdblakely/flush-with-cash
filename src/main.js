import Phaser from 'phaser';
import { FoundationScene } from './rendering/FoundationScene.js';
import { OperatingScene } from './rendering/OperatingScene.js';
import { CalendarScene } from './rendering/CalendarScene.js';
import { UpgradeScene } from './rendering/UpgradeScene.js';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#193a40',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [FoundationScene, CalendarScene, OperatingScene, UpgradeScene],
});
