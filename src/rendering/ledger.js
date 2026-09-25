// Shared frame for the weekly ledger and equipment yard.
export function drawLedgerHeader(scene, title, subtitle, strip) {
  scene.add.rectangle(480, 270, 918, 498, 0x244f55).setStrokeStyle(3, 0xf4ca72);
  scene.add.rectangle(480, 64, 890, 62, 0x193a40).setStrokeStyle(2, 0x6d4c2c);
  scene.add.rectangle(480, 113, 860, 25, 0xffe1a0).setStrokeStyle(1, 0x6d4c2c);
  scene.displayLabel(480, 52, title, 22, '#f4ca72').setOrigin(0.5);
  scene.label(480, 89, subtitle, 13, '#b8d4bf').setOrigin(0.5);
  scene.displayLabel(480, 113, strip, 11, '#193a40').setOrigin(0.5);
}
