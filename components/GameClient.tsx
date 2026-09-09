'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Engine, GameState } from '@/game/Engine';
import { CONFIG } from '@/game/config';
import { loadSave, saveGame, SurftSave } from '@/lib/storage';
import { TitleScreen } from './TitleScreen';
import { GameOverCard } from './GameOverCard';
import { PauseOverlay } from './PauseOverlay';
import { TouchControls } from './TouchControls';
import { OrientationHint } from './OrientationHint';
import { Hud } from './Hud';

export function GameClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef = useRef<Engine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [saveData, setSaveData] = useState<SurftSave>(() => loadSave());
  const [pulses, setPulses] = useState<number>(CONFIG.PLAYER.START_PULSES);
  const [finalScore, setFinalScore] = useState(0);
  const [finalBest, setFinalBest] = useState(0);
  const [finalSector, setFinalSector] = useState(1);
  const [showOptionsFromTitle, setShowOptionsFromTitle] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [isPortrait, setIsPortrait] = useState(false);
  const [stats, setStats] = useState({ fps: 60, frameTime: 0, show: false });

  // Update canvas sizing and integer scaling
  const handleResize = useCallback(() => {
    if (!containerRef.current || !gameCanvasRef.current || !hudCanvasRef.current) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = vh > vw;
    setIsPortrait(portrait);

    const intW = portrait ? CONFIG.PORTRAIT_WIDTH : CONFIG.LANDSCAPE_WIDTH;
    const intH = portrait ? CONFIG.PORTRAIT_HEIGHT : CONFIG.LANDSCAPE_HEIGHT;

    // Calculate maximum integer scale that fits
    const scale = Math.max(1, Math.min(6, Math.floor(Math.min(vw / intW, vh / intH)) || 1));
    setCanvasScale(scale);

    const pixelW = intW * scale;
    const pixelH = intH * scale;

    const gCanvas = gameCanvasRef.current;
    const hCanvas = hudCanvasRef.current;

    // Set internal backing store
    gCanvas.width = intW;
    gCanvas.height = intH;
    hCanvas.width = intW;
    hCanvas.height = intH;

    // Set CSS display size
    gCanvas.style.width = `${pixelW}px`;
    gCanvas.style.height = `${pixelH}px`;
    hCanvas.style.width = `${pixelW}px`;
    hCanvas.style.height = `${pixelH}px`;

    if (engineRef.current) {
      engineRef.current.world.setDimensions(intW, intH, portrait);
      engineRef.current.renderer.onResize(intW, intH);
      engineRef.current.renderer.drawHUD(engineRef.current.world);
    }
  }, []);

  // Initialize engine on mount
  useEffect(() => {
    const loaded = loadSave();
    setSaveData(loaded);

    if (!gameCanvasRef.current || !hudCanvasRef.current) return;

    const engine = new Engine(gameCanvasRef.current, hudCanvasRef.current, loaded.best);
    engineRef.current = engine;

    // Apply saved preferences
    engine.audioBus.setMuted(loaded.muted);
    engine.touch.scheme = loaded.controlScheme;
    engine.world.camera.reducedMotion = !!loaded.reducedMotion;
    engine.world.camera.slowMode = loaded.slowMode;
    engine.renderer.highContrast = loaded.highContrast;
    engine.renderer.showHitboxes = loaded.showHitboxes;

    // Attach touch handler to container
    if (containerRef.current) {
      engine.touch.attach(containerRef.current);
    }

    // Connect callbacks
    engine.callbacks.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.callbacks.onMuteChange = (muted) => {
      setSaveData((prev) => {
        const next = { ...prev, muted };
        saveGame(next);
        return next;
      });
    };

    engine.world.callbacks.onPulsesChange = (p) => {
      setPulses(p);
    };

    engine.world.callbacks.onGameOver = (score, best, sector) => {
      setFinalScore(score);
      setFinalBest(best);
      setFinalSector(sector);
      setSaveData((prev) => {
        const next = {
          ...prev,
          best,
          runs: prev.runs + 1,
        };
        saveGame(next);
        return next;
      });
    };

    handleResize();
    engine.setState('TITLE');
    engine.start();

    // Stats polling interval
    const statsInterval = window.setInterval(() => {
      if (engineRef.current) {
        setStats({
          fps: engineRef.current.fps,
          frameTime: Math.round(engineRef.current.frameTime * 10) / 10,
          show: engineRef.current.showDebug,
        });
      }
    }, 250);

    let resizeTimer: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.clearInterval(statsInterval);
      window.removeEventListener('resize', debouncedResize);
      engine.destroy();
    };
  }, [handleResize]);

  const handleStart = () => {
    setShowOptionsFromTitle(false);
    if (engineRef.current) {
      engineRef.current.startNewGame();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const handleQuitToTitle = () => {
    setShowOptionsFromTitle(false);
    if (engineRef.current) {
      engineRef.current.setState('TITLE');
    }
  };

  const handleTriggerPulse = () => {
    if (engineRef.current && gameState === 'PLAYING') {
      engineRef.current.world.triggerPulse();
    }
  };

  const handleUpdateSettings = (updates: Partial<SurftSave>) => {
    const updated = saveGame(updates);
    setSaveData(updated);

    if (engineRef.current) {
      if (typeof updates.muted === 'boolean') {
        engineRef.current.audioBus.setMuted(updates.muted);
      }
      if (updates.controlScheme) {
        engineRef.current.touch.scheme = updates.controlScheme;
      }
      if (typeof updates.reducedMotion === 'boolean') {
        engineRef.current.world.camera.reducedMotion = updates.reducedMotion;
      }
      if (typeof updates.slowMode === 'boolean') {
        engineRef.current.world.camera.slowMode = updates.slowMode;
      }
      if (typeof updates.highContrast === 'boolean') {
        engineRef.current.renderer.highContrast = updates.highContrast;
      }
      if (typeof updates.showHitboxes === 'boolean') {
        engineRef.current.renderer.showHitboxes = updates.showHitboxes;
      }
    }
  };

  return (
    <div ref={containerRef} className="playfield">
      {/* CRT Scanline and vignette overlay */}
      <div className="crt-overlay pointer-events-none" />

      {/* Screen container */}
      <div className="canvas-wrapper">
        <canvas ref={gameCanvasRef} id="game" className="pixel-canvas" />
        <canvas ref={hudCanvasRef} id="hud" className="pixel-canvas hud-canvas" />

        {/* HUD In-Game Button overlay */}
        {gameState === 'PLAYING' && (
          <Hud
            onPause={handlePause}
            onTriggerPulse={handleTriggerPulse}
            pulses={pulses}
          />
        )}
      </div>

      {/* Touch Pad Overlay when 'pad' control scheme is selected on mobile */}
      {gameState === 'PLAYING' && saveData.controlScheme === 'pad' && engineRef.current && (
        <TouchControls touchInput={engineRef.current.touch} />
      )}

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && !showOptionsFromTitle && (
        <TitleScreen
          bestScore={saveData.best}
          saveData={saveData}
          onStart={handleStart}
          onOpenSettings={() => setShowOptionsFromTitle(true)}
        />
      )}

      {/* Options Overlay (from Title or Pause) */}
      {(gameState === 'PAUSED' || showOptionsFromTitle) && (
        <PauseOverlay
          saveData={saveData}
          onUpdateSettings={handleUpdateSettings}
          onResume={showOptionsFromTitle ? () => setShowOptionsFromTitle(false) : handleResume}
          onRestart={handleRestart}
          onQuit={handleQuitToTitle}
        />
      )}

      {/* Game Over Overlay */}
      {gameState === 'GAME_OVER' && (
        <GameOverCard
          score={finalScore}
          bestScore={finalBest}
          sector={finalSector}
          onRestart={handleRestart}
          onHome={handleQuitToTitle}
        />
      )}

      {/* Orientation Suggestion */}
      <OrientationHint />

      {/* Dev Stats Overlay (` toggles) */}
      {stats.show && (
        <div className="dev-stats">
          <div>FPS: {stats.fps}</div>
          <div>FRAME TIME: {stats.frameTime}ms</div>
          <div>SCALE: {canvasScale}x ({isPortrait ? 'PORTRAIT' : 'LANDSCAPE'})</div>
        </div>
      )}
    </div>
  );
}
