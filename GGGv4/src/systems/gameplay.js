import { playAnticipationAndStartSpin } from './reels.js';
import { maybeApplyFakeWildsOnReelStop, maybeApplyFakeWildsOnSkip, playRevealSequence } from './featureFakeWild.js';
import { PAYLINES, PAYTABLE } from '../config/SlotConfig.js';

function cancelTimers(scene) {
  if (scene.stopTimers && scene.stopTimers.length) {
    scene.stopTimers.forEach(t => { try { t.remove(false); } catch(_){} });
    scene.stopTimers = [];
  }
}

function clearWinFX(scene) {
  if (!scene.winAnims || !scene.winAnims.length) return;
  scene.winAnims.forEach(({ tween, symbol, glow, glowTween, thunderSprite, updateCb }) => {
    try { tween?.stop?.(); } catch(_){}
    try { glowTween?.stop?.(); } catch(_){}
    try { thunderSprite?.destroy?.(); } catch(_){}
    try { glow?.destroy?.(); } catch(_){}
    if (updateCb) { try { scene.events.off('update', updateCb); } catch(_){ } }
    if (symbol) {
      const base = symbol.width > 0 ? (scene.config.dimensions.symbolSize / symbol.width) : 1;
      symbol.setAlpha(1).setVisible(true).setScale(base);
      symbol.skewX = 0;
      symbol.postFX?.clear?.();
      symbol.setBlendMode?.(Phaser.BlendModes.NORMAL);
    }
  });
  scene.winAnims = [];
}

function clearRevealFX(scene) {
  if (scene.activeImpactFX && scene.activeImpactFX.length) {
    scene.activeImpactFX.forEach(s => { try { s?.destroy?.(); } catch(_){ } });
    scene.activeImpactFX = [];
  }
}

function clearStoppingFX(scene) {
  if (scene.stoppingTweens && scene.stoppingTweens.length) {
    scene.stoppingTweens.forEach(t => { try { t.stop(); } catch(_){ } });
    scene.stoppingTweens = [];
  }
}

export function startSpin(scene, config) {
  scene.spinNonce = (scene.spinNonce || 0) + 1;
  const nonce = scene.spinNonce;
  scene.winLock = false; 

  clearStoppingFX(scene);
  cancelTimers(scene);
  clearWinFX(scene);
  clearRevealFX(scene);

  for (let c = 0; c < scene.reels.length; c++) {
    for (let r = 1; r <= config.grid.rows; r++) {
      const s = scene.reels[c][r];
      scene.tweens.killTweensOf(s);
      s.setAlpha(1).setVisible(true);
      s.setBlendMode?.(Phaser.BlendModes.NORMAL);
    }
  }

  scene.isSkipping = false;
  scene.symbolsToReveal = [];
  scene.stoppingTweens = [];

  scene.spinState = 'starting';
  scene.spinButton.setAlpha(0.5).disableInteractive();
  scene.isReelStopping = Array(config.grid.reels).fill(false);
  scene.stopTimers = [];

  for (let col = 0; col < scene.reels.length; col++) {
    playAnticipationAndStartSpin(scene, col, config);
    const stopTimer = scene.time.delayedCall(
      config.timing.spinDelayBase + col * config.timing.spinDelayStagger,
      () => triggerReelStop(scene, col, config, nonce)
    );
    scene.stopTimers.push(stopTimer);
  }

  scene.time.delayedCall(500, () => {
    if (scene.spinState === 'starting') {
      scene.spinState = 'spinning';
      scene.spinButton.setTexture('spinstop').setAlpha(1).setInteractive();
    }
  });
}

export function triggerReelStop(scene, col, config, nonce) {
  if (scene.isSkipping) return;
  if (scene.isReelStopping[col]) return;
  scene.isReelStopping[col] = true;
  animateReelStop(scene, col, config, nonce);
}

export function forceSkipStop(scene, config) {
  if (scene.winLock) return;
  const nonce = scene.spinNonce;
  if (scene.spinState === 'ready') return;

  scene.isSkipping = true;
  scene.spinButton.setAlpha(0.5).disableInteractive();
  clearStoppingFX(scene);
  cancelTimers(scene);

  const { SYMBOL_STEP_Y, startY } = scene.layout;
  if (scene.reels) {
    scene.reels.forEach((reel, col) => {
      if (scene.spinningTweens && scene.spinningTweens[col]) {
        try { scene.spinningTweens[col].stop(); } catch(_){}
        scene.spinningTweens[col] = null;
      }
      reel.forEach((symbol, row) => {
        symbol.y = startY + row * SYMBOL_STEP_Y;
        symbol.setAlpha(1).setVisible(true);
      });
    });
  }

  clearRevealFX(scene);
  maybeApplyFakeWildsOnSkip(scene, config);
  
  playRevealSequence(scene, config, () => {
    finishSpin(scene, config, nonce);
  });
}

function animateReelStop(scene, col, config, nonce) {
  if (scene.spinningTweens && scene.spinningTweens[col]) {
    scene.spinningTweens[col].stop();
    scene.spinningTweens[col].remove?.();
    scene.spinningTweens[col] = null;
  }

  const reel = scene.reels[col];
  const { SYMBOL_STEP_Y, startY } = scene.layout;
  const OVERSHOOT = config.animation.reelStop.overshoot;

  maybeApplyFakeWildsOnReelStop(scene, col, config);

  reel.forEach((symbol) => {
    const finalY = startY + reel.indexOf(symbol) * SYMBOL_STEP_Y;
    scene.tweens.add({
      targets: symbol,
      y: finalY,
      duration: 500,
      ease: 'Back.out',
      easeParams: [OVERSHOOT]
    });
  });

  if (col === scene.reels.length - 1) {
    scene.time.delayedCall(550,
      () => playRevealSequence(scene, config, () => finishSpin(scene, config, nonce))
    );
  }
}

function finishSpin(scene, config, nonce) {
  if (nonce != null && scene.spinNonce !== nonce) return;

  const result = evaluateWinsScene(scene, config);
  const totalWin = result.totalWin || 0;
  const winningLines = result.winningLines || [];
  const scatterCount = result.scatterCount || 0;

  if (scatterCount >= 4) {
    scene.freeSpins = (scene.freeSpins || 0) + 10;
  }

  const lockMs = (scene.config?.timing?.winLockMs ?? 1500);

  if (totalWin > 0) {
    scene.banner?.setWin?.(totalWin);
    animateWins(scene, config, winningLines, totalWin);
    scene.winLock = true;
    scene.spinState = 'ready';
    scene.spinButton.setTexture('spin_button').setAlpha(0.6).disableInteractive();

    scene.time.delayedCall(lockMs, () => {
      if (nonce != null && scene.spinNonce !== nonce) return;
      scene.winLock = false;
      scene.spinButton.setAlpha(1).setInteractive();
    });
    scene.symbolsToReveal = [];
    return;
  }

  scene.banner?.setIdle?.();
  scene.spinState = 'ready';
  scene.spinButton.setTexture('spin_button').setAlpha(1).setInteractive();
  scene.symbolsToReveal = [];
}

export function buildFinalGrid(reels, rows) {
  const final = [];
  reels.forEach((colReel, c) => {
    final[c] = [];
    for (let r = 0; r < rows; r++) {
      const s = colReel[r + 1];
      final[c][r] = s.texture.key;
    }
  });
  return final;
}

export function evaluateWinsGrid(reels, config) {
  const rows = config.grid.rows;
  const finalGrid = buildFinalGrid(reels, rows);
  let scatterCount = 0;
  let totalWin = 0;
  const winningLines = [];

  for (let c = 0; c < finalGrid.length; c++) {
    for (let r = 0; r < rows; r++) {
      if (finalGrid[c][r] === 'symbol_s') scatterCount++;
    }
  }

  PAYLINES.forEach((line, i) => {
    const lineSymbols = line.map((row, c) => finalGrid[c][row]);
    let match = lineSymbols[0];
    if (match === 'symbol_w') match = lineSymbols.find(s => s !== 'symbol_w') || match;
    if (['symbol_w', 'symbol_s'].includes(match)) return;
    let count = 0;
    for (const s of lineSymbols) {
      if (s === match || s === 'symbol_w') count++; else break;
    }
    if (count >= 3) {
      const paytableLine = PAYTABLE[match];
      if (paytableLine) {
        const payout = paytableLine[count - 3];
        if (payout > 0) {
          winningLines.push({ lineIndex: i + 1, symbol: match, count, payout });
          totalWin += payout;
        }
      }
    }
  });

  return { totalWin, winningLines, scatterCount };
}

export function evaluateWinsScene(scene, config) {
  return evaluateWinsGrid(scene.reels, config);
}

export function animateWins(scene, config, winningLines) {
  scene.winAnims = scene.winAnims || [];
  const symSize = config.dimensions.symbolSize;
  const thunderCfg = config.decorations?.thunder || { offsetX: 0, offsetY: 0, scale: 0.6, depth: 5 };
  const lineGap = 200, perSymGap = 110, popUp = 1.18, dimAlpha = 0.35;

  const winners = new Set();
  winningLines.forEach(win => {
    const line = PAYLINES[win.lineIndex - 1];
    for (let c = 0; c < win.count; c++) winners.add(scene.reels[c][line[c] + 1]);
  });

  const dimTweens = [];
  for (let c = 0; c < config.grid.reels; c++) {
    for (let r = 1; r <= config.grid.rows; r++) {
      const s = scene.reels[c][r];
      if (winners.has(s)) continue;
      const tw = scene.tweens.add({ targets: s, alpha: dimAlpha, duration: 150, ease: 'Linear' });
      dimTweens.push(tw);
      scene.winAnims.push({ tween: tw, symbol: s });
  } }

  const linesSorted = [...winningLines].sort((a, b) => b.payout - a.payout);

  linesSorted.forEach((win, idx) => {
    const line = PAYLINES[win.lineIndex - 1];
    const baseDelay = idx * lineGap;

    scene.time.delayedCall(baseDelay, () => {
      const segH = 6, segInMs = 90, segOutMs = 180;
      for (let c = 0; c < win.count - 1; c++) {
        const s0 = scene.reels[c][line[c] + 1];
        const s1 = scene.reels[c + 1][line[c + 1] + 1];
        const len = Phaser.Math.Distance.Between(s0.x, s0.y, s1.x, s1.y);
        const angle = Phaser.Math.Angle.Between(s0.x, s0.y, s1.x, s1.y);
        const seg = scene.add.rectangle(s0.x, s0.y, len, segH, 0xffffff)
          .setOrigin(0, 0.5).setRotation(angle).setAlpha(0).setDepth(9998);
        const segTw = scene.tweens.chain({
          targets: seg,
          tweens: [
            { alpha: 1, duration: segInMs, ease: 'Linear' },
            { alpha: 0, duration: segOutMs, ease: 'Sine.in' }
          ],
          onComplete: () => { try { seg.destroy(); } catch(_){} }
        });
        scene.winAnims.push({ tween: segTw });
      }
    });

    for (let c = 0; c < win.count; c++) {
      const symbol = scene.reels[c][line[c] + 1];
      const s0 = symbol.scaleX;

      scene.time.delayedCall(baseDelay + c * perSymGap, () => {
        const popTw = scene.tweens.chain({
          targets: symbol,
          tweens: [
            { scaleX: s0 * popUp, scaleY: s0 * popUp, duration: 120, ease: 'Cubic.out' },
            { scaleX: s0 * 1.05, scaleY: s0 * 1.05, duration: 140, ease: 'Sine.inOut' },
            { scaleX: s0,        scaleY: s0,        duration: 140, ease: 'Sine.inOut' }
          ]
        });

        const glow = scene.add.image(symbol.x, symbol.y, symbol.texture.key)
          .setDisplaySize(symSize, symSize)
          .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
          .setDepth((symbol.depth ?? 0) + 1);

        const updateCb = () => {
          if (!glow.active) return;
          glow.x = symbol.x; glow.y = symbol.y;
          glow.scaleX = symbol.scaleX; glow.scaleY = symbol.scaleY;
        };
        scene.events.on('update', updateCb);

        const glowTween = scene.tweens.chain({
          targets: glow,
          tweens: [
            { alpha: 0.9, duration: 120, ease: 'Cubic.out' },
            { alpha: 0.0, duration: 180, ease: 'Sine.in' }
          ],
          onComplete: () => { try { glow.destroy(); } catch(_){} }
        });

        let thunderSprite = null;
        if (symbol.texture.key === 'symbol_w') {
          thunderSprite = scene.add
            .sprite(symbol.x + (thunderCfg.offsetX || 0), symbol.y + (thunderCfg.offsetY || 0), 'thunder')
            .setScale(thunderCfg.scale || 0.6).setDepth(thunderCfg.depth || 5).play('thunder_play');
          thunderSprite.on('animationcomplete', () => { try { thunderSprite.destroy(); } catch(_){} });
        }

        const flare = scene.add.image(symbol.x, symbol.y, 'flare')
          .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)
          .setDepth((symbol.depth ?? 0) + 2).setScale(0.3);

        const flareTween = scene.tweens.chain({
          targets: flare,
          tweens: [
            { alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 100, ease: 'Cubic.out' },
            { alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 180, ease: 'Sine.in' }
          ],
          onComplete: () => { try { flare.destroy(); } catch(_){} }
        });

        scene.winAnims.push({ tween: popTw, glow, glowTween, thunderSprite, updateCb, symbol, flare, flareTween });
      });
    }
  });

  const maxCount = Math.max(0, ...winningLines.map(l => l.count));
  const totalDuration = (linesSorted.length - 1) * lineGap + (maxCount - 1) * perSymGap + 700;

  scene.time.delayedCall(totalDuration, () => {
    dimTweens.forEach(t => { try { t.stop(); } catch(_){} });
    for (let c = 0; c < config.grid.reels; c++) {
      for (let r = 1; r <= config.grid.rows; r++) {
        const s = scene.reels[c][r];
        if (winners.has(s)) continue;
        const tw = scene.tweens.add({ targets: s, alpha: 1, duration: 180, ease: 'Linear' });
        scene.winAnims.push({ tween: tw, symbol: s });
      }
    }
  });
}