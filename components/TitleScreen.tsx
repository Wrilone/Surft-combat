'use client';

import React from 'react';
import { formatScore } from '@/lib/format';
import { SurftSave } from '@/lib/storage';

interface TitleScreenProps {
  bestScore: number;
  saveData: SurftSave;
  onStart: () => void;
  onOpenSettings?: () => void;
}

export function TitleScreen({ bestScore, saveData, onStart, onOpenSettings }: TitleScreenProps) {
  return (
    <div className="overlay-screen title-screen">
      <div className="title-content">
        <div className="brand-badge">SURFT ARCADE</div>
        <h1 className="game-title">SURFT COMBAT</h1>
        <p className="game-subtitle">16-BIT RETRO SPACE SHOOT-EM-UP</p>

        <div className="stats-box">
          <span className="stat-label">HIGH SCORE</span>
          <span className="stat-value">{formatScore(bestScore)}</span>
        </div>

        <button className="arcade-btn primary-btn pulse-anim" onClick={onStart}>
          PRESS ENTER OR TAP TO START
        </button>

        <div className="instructions-grid">
          <div className="instr-card">
            <h4>DESKTOP CONTROLS</h4>
            <p><strong>Move:</strong> Arrow Keys / WASD</p>
            <p><strong>Shoot:</strong> Spacebar (Hold)</p>
            <p><strong>Pulse:</strong> Left / Right Shift</p>
            <p><strong>Pause:</strong> Esc or P | <strong>Mute:</strong> M</p>
          </div>
          <div className="instr-card">
            <h4>MOBILE CONTROLS</h4>
            <p><strong>Move & Fire:</strong> Drag finger on screen</p>
            <p><strong>Pulse:</strong> Two-finger tap</p>
            <p><strong>Pause:</strong> Tap HUD pause button</p>
          </div>
        </div>

        {onOpenSettings && (
          <button className="arcade-btn secondary-btn" onClick={onOpenSettings}>
            OPTIONS & ACCESSIBILITY
          </button>
        )}
      </div>
    </div>
  );
}
