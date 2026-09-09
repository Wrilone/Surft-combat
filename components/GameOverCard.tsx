'use client';

import React from 'react';
import { formatScore } from '@/lib/format';

interface GameOverCardProps {
  score: number;
  bestScore: number;
  sector: number;
  onRestart: () => void;
  onHome: () => void;
}

export function GameOverCard({
  score,
  bestScore,
  sector,
  onRestart,
  onHome,
}: GameOverCardProps) {
  const isNewRecord = score >= bestScore && score > 0;

  return (
    <div className="overlay-screen game-over-screen">
      <div className="card-box game-over-box">
        <h2 className="card-title coral-text">GAME OVER</h2>

        {isNewRecord && <div className="record-badge pulse-anim">★ NEW BEST RECORD! ★</div>}

        <div className="results-grid">
          <div className="result-row">
            <span>FINAL SCORE</span>
            <span className="amber-text">{formatScore(score)}</span>
          </div>
          <div className="result-row">
            <span>BEST SCORE</span>
            <span className="bone-text">{formatScore(bestScore)}</span>
          </div>
          <div className="result-row">
            <span>SECTOR REACHED</span>
            <span className="aqua-text">SECTOR {sector}</span>
          </div>
        </div>

        <div className="btn-group">
          <button className="arcade-btn primary-btn pulse-anim" onClick={onRestart}>
            PLAY AGAIN (ENTER)
          </button>
          <button className="arcade-btn secondary-btn" onClick={onHome}>
            TITLE SCREEN
          </button>
        </div>
      </div>
    </div>
  );
}
