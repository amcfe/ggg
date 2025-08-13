export function createZeusAnimation(scene, config) {
  const zeusConfig = config?.decorations?.zeus || {};
  if (!zeusConfig.visible) return;
  const zeusFrames = scene.anims.generateFrameNames('zeus', {
    prefix: 'frame_', suffix: '.png', start: 1, end: 151, zeroPad: 5
  });
  scene.anims.create({ key: 'zeus_idle', frames: zeusFrames, frameRate: zeusConfig.frameRate ?? 12, repeat: -1 });
  const zeusSprite = scene.add.sprite(zeusConfig.x ?? 0, zeusConfig.y ?? 0, 'zeus');
  zeusSprite.setScale(zeusConfig.scale ?? 1).setDepth(-2).play('zeus_idle');
}

export function createThunderAnimation(scene, config) {
  const thunderConfig = config?.decorations?.thunder || {};
  const thunderFrames = scene.anims.generateFrameNames('thunder', { prefix: 'thunder.', suffix: '.png', start: 0, end: 59 });
  scene.anims.create({ key: 'thunder_play', frames: thunderFrames, frameRate: thunderConfig.frameRate ?? 12, repeat: 0 });
}

export function createImpactAnimation(scene, featureConfig) {
  const tex = scene.textures?.get('thunderimpact');
  if (!tex) return;
  const names = tex.getFrameNames();
  const filtered = names
    .map(n => ({ n, i: parseInt(String(n).split('.')[1] || '0', 10) }))
    .filter(o => o.i >= 1 && o.i <= 57)
    .sort((a,b) => a.i - b.i)
    .map(o => o.n);
  scene.anims.create({
    key: (featureConfig && featureConfig.impactAnimationKey) || 'impact_play',
    frames: filtered.map(name => ({ key: 'thunderimpact', frame: name })),
    frameRate: 60, repeat: 0
  });
}

export function createTilebreakAnimation(scene) {
  const tex = scene.textures?.get('tilebreak');
  if (!tex) return;
  const names = tex.getFrameNames();
  const ordered = names
    .map(n => ({ name: n, num: parseInt(String(n).split('__')[1]?.split('.')[0] || '0', 10) }))
    .sort((a,b) => a.num - b.num)
    .map(o => o.name);
  scene.anims.create({
    key: 'tilebreak_play',
    frames: ordered.map(n => ({ key: 'tilebreak', frame: n })),
    frameRate: 60, repeat: 0
  });
}

export class BannerController {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg || {};
    this.rotationTimer = null;
    this.state = 'idle';
    this.messages = this.cfg.messagesIdle || [];
    this.currentIdx = 0;
    const reel = scene.children.list.find(c => c.texture && c.texture.key === 'reel_container');
    const depth = this.cfg.depth ?? (reel ? reel.depth : 0);
    const baseX = reel ? reel.x : scene.GAME_WIDTH / 2;
    const baseY = reel ? reel.y : scene.GAME_HEIGHT / 2;
    const x = baseX + (this.cfg.offsetX ?? 0);
    const y = baseY + (this.cfg.offsetY ?? 0);
    this.bannerImg = scene.add.image(x, y, 'banner').setDepth(depth).setScale(this.cfg.scale ?? 1);
    const fontFamily = this.cfg.fontFamily || 'Dioge';
    const fontSize = this.cfg.fontSize || 34;
    this.text = scene.add.text(x, y, '', { fontFamily, fontSize: `${fontSize}px`, color: this.cfg.color || '#fff', align: 'center' }).setOrigin(0.5).setDepth(depth + 1).setAlpha(0);
    this.fadeMs = this.cfg.fadeMs ?? 250;
    this.startRotation();
  }
  startRotation() {
    this.stopRotation();
    if (!this.messages.length) return;
    this.state = 'idle';
    this._transitionTo(this.messages[this.currentIdx], true);
    this.rotationTimer = this.scene.time.addEvent({
      delay: this.cfg.rotateMs || 3000,
      loop: true,
      callback: () => {
        if (this.state !== 'idle') return;
        this.currentIdx = (this.currentIdx + 1) % this.messages.length;
        this._transitionTo(this.messages[this.currentIdx], false);
      }
    });
  }
  stopRotation() { if (this.rotationTimer) { this.rotationTimer.remove(); this.rotationTimer = null; } }
  setIdle() { this.state = 'idle'; this.startRotation(); }
  setGoodLuck() { this.state = 'spinning'; this.stopRotation(); this._transitionTo(this.cfg.msgGoodLuck || 'Good Luck', false); }
  setWin(amount) { this.state = 'win'; this.stopRotation(); this._transitionTo((this.cfg.msgWinPrefix || 'Win: $') + amount, false); }
  destroy() { this.stopRotation(); this.text?.destroy?.(); this.bannerImg?.destroy?.(); }
  _transitionTo(msg, instant) {
    if (instant) { this.text.setText(msg).setAlpha(1); return; }
    const d = this.fadeMs;
    this.scene.tweens.add({ targets: this.text, alpha: 0, duration: d, onComplete: () => {
      this.text.setText(msg);
      this.scene.tweens.add({ targets: this.text, alpha: 1, duration: d });
    }});
  }
}

export function setupScaleAndCamera(scene) {
  const { width, height } = scene.scale;
  scene.parent = new Phaser.Structs.Size(width, height);
  scene.sizer = new Phaser.Structs.Size(scene.GAME_WIDTH, scene.GAME_HEIGHT, Phaser.Structs.Size.FIT, scene.parent);
  scene.parent.setSize(width, height);
  scene.sizer.setSize(width, height);
  scene.scale.on('resize', (gs) => resize(scene, gs), scene);
  updateCamera(scene);
}

export function resize(scene, gameSize) {
  scene.parent.setSize(gameSize.width, gameSize.height);
  scene.sizer.setSize(gameSize.width, gameSize.height);
  updateCamera(scene);
}

export function updateCamera(scene) {
  const cam = scene.cameras.main;
  const x = Math.ceil((scene.parent.width - scene.sizer.width) * 0.5);
  const y = Math.ceil((scene.parent.height - scene.sizer.height) * 0.5);
  const zx = scene.sizer.width / scene.GAME_WIDTH;
  const zy = scene.sizer.height / scene.GAME_HEIGHT;
  cam.setViewport(x, y, scene.sizer.width, scene.sizer.height);
  cam.setZoom(Math.max(zx, zy));
  cam.centerOn(scene.GAME_WIDTH/2, scene.GAME_HEIGHT/2);
  const bg = scene.scene.get('BackgroundScene');
  if (bg && bg.updateCamera) bg.updateCamera();
}

export function getZoom(scene) { return scene.cameras.main.zoom; }