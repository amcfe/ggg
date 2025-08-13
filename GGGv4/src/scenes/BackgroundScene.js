import { SLOT_CONFIG, PAYLINES, PAYTABLE } from '../config/SlotConfig.js';

export default class BackgroundScene extends Phaser.Scene {
  constructor() { 
    super('BackgroundScene'); 
    this.treeCfg = [
      { offsetX: -220, offsetY:  500, scale: 0.46 },
      { offsetX: -420, offsetY:  550, scale: 0.8 },
      { offsetX:  220, offsetY:  500, scale: 0.44 },
      { offsetX:  420, offsetY:  550, scale: 0.82 },
    ];
  }

  create() {
    const cx = 960, cy = 640;
    this.bg = this.add.image(cx, cy, 'background').setDepth(0);

    const src = this.textures.get('background').getSourceImage();
    const bgW = src.width, bgH = src.height;
    this.trees = Array.from({ length: 4 }, () =>
      this.add.image(cx, cy, 'tree').setDepth(2).setOrigin(0.5, 1).setDisplaySize(bgW, bgH)
    );

    this.stairs = this.add.image(cx, cy, 'stairs').setDepth(3).setDisplaySize(bgW, bgH);

    this.trees.forEach((img, i) => {
      const t = this.treeCfg[i] || {};
      img.setPosition(cx + (t.offsetX || 0), cy + (t.offsetY || 0))
         .setScale(t.scale || 1);
    });

    this.createFireAnimation();
    this.createFireSprites();
    this.children.list
      .filter(o => o.texture && o.texture.key === 'fire')
      .forEach((o, i) => o.setDepth(4 + i));
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    this.scene.launch('Start');

    this.startWindSkew();
  }

  startWindSkew() {
    const treeAngles = [4, 3, 5, 2];
    const treeDur    = [2200, 3200, 3000, 2800];
    this.trees.forEach((t, i) => {
      t.setOrigin(0.5, 1);
      t.setAngle(-treeAngles[i]);
      this.tweens.add({
        targets: t,
        angle: treeAngles[i],
        duration: treeDur[i],
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: i * 180
      });
    });
  }

  createFireAnimation() {
    const fireConfig = SLOT_CONFIG.decorations.fire;
    const frameNames = this.textures.get('fire').getFrameNames()
      .map(n => ({ n, i: parseInt(String(n).replace(/\D+/g, ''), 10) || 0 }))
      .sort((a, b) => a.i - b.i)
      .map(o => ({ key: 'fire', frame: o.n }));
    this.anims.create({ key: 'fire_loop', frames: frameNames, frameRate: fireConfig.frameRate, repeat: -1 });
  }

  createFireSprites() {
    const fireConfig = SLOT_CONFIG.decorations.fire;
    if (fireConfig.instance1.visible) {
      const f1 = this.add.sprite(fireConfig.instance1.x, fireConfig.instance1.y, 'fire');
      f1.setScale(fireConfig.instance1.scale).play('fire_loop');
    }
    if (fireConfig.instance2.visible) {
      const f2 = this.add.sprite(fireConfig.instance2.x, fireConfig.instance2.y, 'fire');
      f2.setScale(fireConfig.instance2.scale).play('fire_loop');
    }
  }
  
  updateCamera() {
    const start = this.scene.get('Start');
    if (!start?.cameras?.main) return;
    this.cameras.main.setZoom(start.cameras.main.zoom);
    this.cameras.main.centerOn(960, 640);
  }
}
