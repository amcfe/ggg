// src/main.js
import BootScene from './scenes/BootScene.js';
import BackgroundScene from './scenes/BackgroundScene.js';
import Start from './scenes/Start.js';

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: { mode: Phaser.Scale.RESIZE, parent: 'game-container', width: 800, height: 600 },
  scene: [BootScene, BackgroundScene, Start]
};

new Phaser.Game(config);
