export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    for (let i = 1; i <= 10; i++) {
      this.load.image(`symbol_${i}`, `assets/symbol_${i}.png`);
    }
    this.load.image('symbol_w', 'assets/symbol_w.png');
    this.load.image('symbol_s', 'assets/symbol_s.png');
    this.load.image('spin_button', 'assets/spin_button.png');
    this.load.image('reel_container', 'assets/reelcontainer.png');
    this.load.image('spinstop', 'assets/spinstop.png');
    this.load.image('flare', 'assets/white-flare.png');
    this.load.multiatlas('zeus', 'assets/anim/zeus.json', 'assets/anim');
    this.load.multiatlas('thunder', 'assets/anim/thunder.json', 'assets/anim');
    this.load.multiatlas('thunderimpact', 'assets/anim/thunderimpact.json', 'assets/anim');
    this.load.atlas('tilebreak', 'assets/anim/tilebreak-0.png', 'assets/anim/tilebreak.json');
    this.load.image('topreelcontainer', 'assets/topreelcontainer.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('stairs', 'assets/stairs.png');
    this.load.image('zeus_cast', 'assets/zeuscast.png');

    this.load.image('background', 'assets/background.png');
    this.load.image('banner', 'assets/banner.png');
    this.load.atlas('fire', 'assets/anim/fire.png', 'assets/anim/fire.json');
    try {
      const woff2 = 'assets/fonts/dioge.woff2';
      const woff = 'assets/fonts/dioge.woff';
      const face = new FontFace('Dioge', `url(${woff2}) format('woff2'), url(${woff}) format('woff')`);
      face.load().then(f => document.fonts.add(f)).catch(() => {});
    } catch (_) {}
  
  }

  create() {
    this.scene.start('BackgroundScene');
  }
}
