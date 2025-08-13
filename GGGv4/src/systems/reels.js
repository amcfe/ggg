export function generateReelStrips(config) {
  const count = config.grid.reels;
  const perReel = config.reels.symbolsPerReel;
  const symbolKeys = Array.from({ length: 10 }, (_, i) => `symbol_${i + 1}`).concat(['symbol_w', 'symbol_s']);
  
  return Array.from({ length: count }, () => 
    Array.from({ length: perReel }, () => Phaser.Utils.Array.GetRandom(symbolKeys))
  );
}

function _calculateLayout(scene, config) {
  const { grid, dimensions, layout } = config;
  const { symbolSize } = dimensions;
  const { symbolSpacing, symbolPaddingX, symbolOffsetY, mask: maskConfig } = layout;

  const symbolStepY = symbolSize + symbolSpacing;
  const symbolStepX = symbolSize + symbolPaddingX;

  const totalGridWidth = grid.reels * symbolStepX - symbolPaddingX;
  const visibleGridHeight = grid.rows * symbolStepY - symbolSpacing;
  
  const gridCenterX = scene.GAME_WIDTH / 2;
  const gridCenterY = scene.GAME_HEIGHT / 2;

  const startX = (scene.GAME_WIDTH - totalGridWidth) / 2 + symbolSize / 2;
  const topVisibleCenterY = gridCenterY - visibleGridHeight / 2 + symbolSize / 2;
  const startY = topVisibleCenterY - symbolStepY + symbolOffsetY;

  const maskHeight = visibleGridHeight + (maskConfig.extraHeight || 0) + maskConfig.heightAdjustment;
  const maskWidth = totalGridWidth + maskConfig.widthAdjustment;
  const maskY = gridCenterY - maskHeight / 2 + maskConfig.offsetY;
  const maskX = startX - symbolSize / 2 + maskConfig.offsetX;

  return { 
    symbolStepY, symbolStepX, totalGridWidth, visibleGridHeight, 
    gridCenterX, gridCenterY, startX, startY, 
    maskX, maskY, maskWidth, maskHeight
  };
}

function _createContainers(scene, config, layout) {
  const { container: containerConfig } = config.layout;
  const { gridCenterX, gridCenterY } = layout;
  const frameWidth = scene.GAME_WIDTH - containerConfig.frameSideMargin * 2;
  const containerX = gridCenterX + containerConfig.offsetX;
  const containerY = gridCenterY + containerConfig.offsetY;

  const reelContainer = scene.add.image(containerX, containerY, 'reel_container');
  reelContainer.displayWidth = frameWidth * containerConfig.scaleX;
  reelContainer.scaleY = reelContainer.scaleX * containerConfig.scaleY;
  reelContainer.setDepth(-1);

  const topConfig = containerConfig.top;
  const topReelContainer = scene.add.image(containerX + topConfig.offsetX, containerY + topConfig.offsetY, 'topreelcontainer');
  topReelContainer.displayWidth = reelContainer.displayWidth * topConfig.scale;
  topReelContainer.scaleY = topReelContainer.scaleX;
  topReelContainer.setDepth(2);
}

function _createMask(scene, layout) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(layout.maskX, layout.maskY, layout.maskWidth, layout.maskHeight);
  return g.createGeometryMask();
}

function _createSymbols(scene, config, layout, reelStrips, mask) {
  const { grid, dimensions } = config;
  const { startX, startY, symbolStepX, symbolStepY } = layout;
  const reels = [];
  const reelPositions = [];

  for (let col = 0; col < grid.reels; col++) {
    reels[col] = [];
    reelPositions[col] = 0;
    
    for (let row = 0; row < grid.rows + 2; row++) {
      const x = startX + col * symbolStepX;
      const y = startY + row * symbolStepY;
      const key = reelStrips[col][row];
      const symbol = scene.add.image(x, y, key).setDisplaySize(dimensions.symbolSize, dimensions.symbolSize);
      symbol.setMask(mask);
      reels[col].push(symbol);
    }
  }
  return { reels, reelPositions };
}

export function createSlotMachine(scene, config, reelStrips) {
  const layout = _calculateLayout(scene, config);
  _createContainers(scene, config, layout);
  const mask = _createMask(scene, layout);
  const { reels, reelPositions } = _createSymbols(scene, config, layout, reelStrips, mask);

  scene.layout = { SYMBOL_STEP_Y: layout.symbolStepY, startY: layout.startY };
  return { reels, reelPositions };
}

export function playAnticipationAndStartSpin(scene, col, config) {
  const reel = scene.reels[col];
  const { kickUpAmount, duration } = config.animation.anticipation;
  scene.tweens.add({ 
    targets: reel, 
    y: `-=${kickUpAmount}`, 
    duration, 
    ease: 'Cubic.easeOut', 
    yoyo: true, 
    onComplete: () => startReelSpin(scene, col) 
  });
}

export function startReelSpin(scene, col) {
  const reel = scene.reels[col];
  const { SYMBOL_STEP_Y } = scene.layout;
  const spinSpeed = 40;

  if (scene.spinningTweens && scene.spinningTweens[col]) {
    scene.spinningTweens[col].stop();
    if (scene.spinningTweens[col].remove) scene.spinningTweens[col].remove();
  }

  scene.spinningTweens[col] = scene.tweens.add({
    targets: reel,
    y: `+=${SYMBOL_STEP_Y}`,
    duration: spinSpeed,
    ease: 'Linear',
    onComplete: () => {
      scene.reelPositions[col] = (scene.reelPositions[col] + 1) % scene.reelStrips[col].length;
      const bottomSymbol = reel.pop();
      reel.unshift(bottomSymbol);
      
      bottomSymbol.y -= SYMBOL_STEP_Y * reel.length;
      bottomSymbol.setTexture(scene.reelStrips[col][scene.reelPositions[col]]);
      
      startReelSpin(scene, col);
    }
  });
}

export function playJellyEffect(scene, symbol) {
  const baseScale = symbol.scaleX;
  scene.tweens.chain({ 
    targets: symbol, 
    tweens: [
      { scaleY: baseScale * 0.8, scaleX: baseScale * 1.2, duration: 80, ease: 'Sine.easeInOut' },
      { scaleY: baseScale * 1.1, scaleX: baseScale * 0.9, duration: 120, ease: 'Sine.easeInOut' },
      { scaleY: baseScale, scaleX: baseScale, duration: 150, ease: 'Sine.easeInOut' }
    ]
  });
}