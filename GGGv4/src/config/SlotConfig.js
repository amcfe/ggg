export const PAYLINES = [
  [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2],
  [0,1,2,1,0], [2,1,0,1,2],
  [0,0,1,0,0], [2,2,1,2,2],
  [1,0,0,0,1], [1,2,2,2,1],
  [0,1,1,1,0], [2,1,1,1,2],
  [0,1,0,1,2], [2,1,2,1,0],
  [1,0,1,2,1], [1,2,1,0,1]
];

export const PAYTABLE = {
  symbol_1:  [5, 25, 100],
  symbol_2:  [5, 25, 100],
  symbol_3:  [5, 25, 125],
  symbol_4:  [10, 50, 250],
  symbol_5:  [10, 50, 250],
  symbol_6:  [15, 75, 400],
  symbol_7:  [15, 75, 400],
  symbol_8:  [20, 100, 500],
  symbol_9:  [25, 125, 750],
  symbol_10: [50, 200, 1000],
  symbol_w:  [],
  symbol_s:  []
};

export const SLOT_CONFIG = {
  grid: { reels: 5, rows: 3 },
  dimensions: { gameWidth: 640, gameHeight: 960, symbolSize: 110 },
  layout: {
    symbolSpacing: 15,
    symbolPaddingX: 2,
    symbolOffsetY: -45,
    mask: { offsetY: -45, heightAdjustment: -5, offsetX: 0, widthAdjustment: 0, extraHeight: 10},
    container: {
      offsetY: -45, offsetX: 0, scaleX: 1, scaleY: 1, frameSideMargin: 0,
      top: { offsetX: 0, offsetY: 0, scale: 1 }
    }
  },
  timing: { spinDelayBase: 1500, spinDelayStagger: 250, winLockMs: 1500 },
  animation: { anticipation: { kickUpAmount: 25, duration: 120 }, reelStop: { overshoot: 2.5 } },
  reels: { symbolsPerReel: 20 },
  wins: { minShowMs: 900 },
  fakeSymbolFeature: {
    enabled: true,
    probability: 0.5,
    fakeSymbols: ['symbol_1','symbol_2','symbol_3','symbol_4'],
    revealFadeMs: 200,      // <--- NUEVO
    revealWidlDelay: 15,   // <--- NUEVO
    impactAnimationKey: 'thunder_impact_play',
    cameraShake: { duration: 200, intensity: 0.01, delay: 15 },
    impactOffsetX: -8, impactOffsetY: -155, impactScale: 4, impactDepth: 10
  },
  decorations: {
    zeus: { visible: true, x: 115, y: 125, scale: 1, castScale: 0.45, frameRate: 40 },
    thunder: { offsetX: 0, offsetY: 0, scale: 0.6, frameRate: 60, depth: 5 },
    fire: {
      frameRate: 50,
      instance1: { visible: true, x: 698, y: 890, scale: 1.5 },
      instance2: { visible: true, x: 1255, y: 891, scale: 1.5 }
    }
  }
,
  banner: {
    offsetX: 0,
    offsetY: 230,
    scale: 0.6,
    depth: null,
    fontFamily: 'Dioge',
    fontSize: 32,
    color: '#ffffff',
    rotateMs: 3000,
    msgGoodLuck: 'Good Luck',
    msgWinPrefix: 'Win: $',
    messagesIdle: [
      'Win up to x5000',
      'Get 4 Scatters to win free spins',
      'Symbols can turn into wilds!'
    ]
  }
};

SLOT_CONFIG.rules = SLOT_CONFIG.rules ?? {
  wildSubstitutesScatter: false,
    scatterSymbol: 'SCATTER',
    wildSymbol: 'WILD',
    scatterPays: {3: 2, 4: 10, 5: 50}
};
SLOT_CONFIG.reels = Object.assign({}, {"visible":3,"columns":5}, SLOT_CONFIG.reels);

// Enlaces
SLOT_CONFIG.paylines = PAYLINES;
SLOT_CONFIG.paytable = PAYTABLE;

export default SLOT_CONFIG;