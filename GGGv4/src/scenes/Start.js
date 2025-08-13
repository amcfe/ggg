import { SLOT_CONFIG, PAYLINES, PAYTABLE } from '../config/SlotConfig.js';
import { setupScaleAndCamera } from "../systems/visual.js";
import { createZeusAnimation, createThunderAnimation, createImpactAnimation, createTilebreakAnimation } from "../systems/visual.js";
import { generateReelStrips, createSlotMachine } from '../systems/reels.js';
import { startSpin, forceSkipStop } from "../systems/gameplay.js"
import { BannerController } from "../systems/visual.js";

class Start extends Phaser.Scene {
  constructor() {
    super('Start');
    this.config = SLOT_CONFIG;
    this.GAME_WIDTH = this.config.dimensions.gameWidth;
    this.GAME_HEIGHT = this.config.dimensions.gameHeight;
    this.reels = [];
    this.spinButton = null;
    this.reelStrips = [];
    this.reelPositions = [];
    this.spinningTweens = [];
    this.stopTimers = [];
    this.layout = null;
    this.spinState = 'ready';
    this.isReelStopping = [];
    this.freeSpins = 0;
    this.winAnims = [];
    this.isSkipping = false;
    this.symbolsToReveal = [];
    this.banner = null;
    this.winLock = false;
  }

  preload() {}

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    setupScaleAndCamera(this);

    createZeusAnimation(this, this.config);
    createThunderAnimation(this, this.config);
    createImpactAnimation(this, this.config.fakeSymbolFeature);
    createTilebreakAnimation(this);

    this.reelStrips = generateReelStrips(this.config);
    const { reels, reelPositions } = createSlotMachine(this, this.config, this.reelStrips);
    this.reels = reels;
    this.reelPositions = reelPositions;

    if (this.config.banner) {
      this.banner = new BannerController(this, this.config.banner);
    }

    this.spinButton = this.add.image(this.GAME_WIDTH / 2, this.GAME_HEIGHT - 100, 'spin_button')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.spin());

    this.input.keyboard.on('keydown-SPACE', this.spin, this);
    this.sys.events.once('shutdown', () => { try { this.banner && this.banner.destroy && this.banner.destroy(); } catch(_){} });
  
  }

  spin() {
    if (this.winLock) return;

    if (this.spinState === 'ready') {
      this.banner?.setGoodLuck?.();
      return startSpin(this, this.config);
    }
    if (this.spinState === 'spinning') {
      this.isSkipping = true;
      this.spinState = 'stopping';
      return forceSkipStop(this, this.config);
    }
  }
}

export default Start;
