function applyFakeWild(scene, symbol, featureConfig) {
  if (symbol.texture.key === 'symbol_w' && Math.random() < featureConfig.probability) {
    const fakeSymbolKey = Phaser.Utils.Array.GetRandom(featureConfig.fakeSymbols);
    symbol.setTexture(fakeSymbolKey);
    scene.symbolsToReveal.push(symbol);
  }
}

export function maybeApplyFakeWildsOnReelStop(scene, col, config) {
  const feature = config.fakeSymbolFeature;
  if (!feature || !feature.enabled) return;

  const reel = scene.reels[col];
  for (let r = 1; r <= config.grid.rows; r++) {
    applyFakeWild(scene, reel[r], feature);
  }
}

export function maybeApplyFakeWildsOnSkip(scene, config) {
  const feature = config.fakeSymbolFeature;
  if (!feature || !feature.enabled) return;

  for (let col = 0; col < config.grid.reels; col++) {
    for (let row = 1; row <= config.grid.rows; row++) {
      applyFakeWild(scene, scene.reels[col][row], feature);
    }
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function playRevealSequence(scene, config, onComplete) {
  const feature = config.fakeSymbolFeature;

  // Cláusulas de guarda iniciales
  if (!feature || !feature.enabled) {
    onComplete?.();
    return;
  }
  const symbols = scene.symbolsToReveal || [];
  if (!symbols.length) {
    onComplete?.();
    return;
  }

  const {
    cameraShake,
    impactOffsetX,
    impactOffsetY,
    impactDepth,
    impactScale,
    impactAnimationKey,
    revealFadeMs,
    revealWildDelay,
  } = feature;
  
  await Promise.all(symbols.map(async (symbol) => {

    const impact = scene.add.sprite(symbol.x + impactOffsetX, symbol.y + impactOffsetY, 'thunderimpact')
      .setDepth(impactDepth)
      .setScale(impactScale);
    scene.activeImpactFX = scene.activeImpactFX || [];
    scene.activeImpactFX.push(impact);
    impact.play(impactAnimationKey);
    impact.on('animationcomplete', () => { try { impact.destroy(); } catch (_) {} });
    
    const tilebreak = scene.add.sprite(symbol.x, symbol.y, 'tilebreak');
    if (symbol.mask) tilebreak.setMask(symbol.mask);
    scene.activeImpactFX.push(tilebreak);
    tilebreak.play('tilebreak_play');
    tilebreak.on('animationcomplete', () => { try { tilebreak.destroy(); } catch (_) {} });

    try { scene.cameras.main.shake(cameraShake.duration, cameraShake.intensity); } catch (_) {}

    const underWild = scene.add.image(symbol.x, symbol.y, 'symbol_w')
      .setDisplaySize(config.dimensions.symbolSize, config.dimensions.symbolSize)
      .setAlpha(0);
    if (symbol.mask) underWild.setMask(symbol.mask);

    await new Promise(resolve => {
      scene.tweens.add({
        targets: symbol,
        alpha: 0,
        duration: revealFadeMs,
        ease: 'Linear',
        onComplete: resolve
      });
    });

    await sleep(revealWildDelay);
    
    underWild.setAlpha(1);
    
    await sleep(revealWildDelay);
    
    symbol.setTexture('symbol_w').setAlpha(1);
    try { underWild.destroy(); } catch (_) {}
  }));

  await sleep(200);
  onComplete?.();
}