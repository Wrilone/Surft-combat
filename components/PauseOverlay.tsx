'use client';

import React from 'react';
import { SurftSave } from '@/lib/storage';

interface PauseOverlayProps {
  saveData: SurftSave;
  onUpdateSettings: (updates: Partial<SurftSave>) => void;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function PauseOverlay({
  saveData,
  onUpdateSettings,
  onResume,
  onRestart,
  onQuit,
}: PauseOverlayProps) {
  return (
    <div className="overlay-screen pause-screen">
      <div className="card-box pause-box">
        <h2 className="card-title amber-text">PAUSED</h2>

        <div className="settings-section">
          <h3>GAMEPLAY & AUDIO</h3>
          <div className="setting-row">
            <span>AUDIO SOUND & MUSIC</span>
            <button
              className={`toggle-btn ${!saveData.muted ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ muted: !saveData.muted })}
            >
              {saveData.muted ? 'MUTED' : 'ENABLED'}
            </button>
          </div>

          <div className="setting-row">
            <span>MOBILE CONTROLS</span>
            <div className="option-btns">
              <button
                className={`option-btn ${saveData.controlScheme === 'drag' ? 'selected' : ''}`}
                onClick={() => onUpdateSettings({ controlScheme: 'drag' })}
              >
                DRAG
              </button>
              <button
                className={`option-btn ${saveData.controlScheme === 'pad' ? 'selected' : ''}`}
                onClick={() => onUpdateSettings({ controlScheme: 'pad' })}
              >
                PAD
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>ACCESSIBILITY</h3>
          <div className="setting-row">
            <span>SLOW MODE (0.75x SPEED)</span>
            <button
              className={`toggle-btn ${saveData.slowMode ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ slowMode: !saveData.slowMode })}
            >
              {saveData.slowMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="setting-row">
            <span>REDUCED MOTION</span>
            <button
              className={`toggle-btn ${saveData.reducedMotion ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ reducedMotion: !saveData.reducedMotion })}
            >
              {saveData.reducedMotion ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="setting-row">
            <span>HIGH CONTRAST</span>
            <button
              className={`toggle-btn ${saveData.highContrast ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ highContrast: !saveData.highContrast })}
            >
              {saveData.highContrast ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="setting-row">
            <span>SHOW HITBOXES</span>
            <button
              className={`toggle-btn ${saveData.showHitboxes ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ showHitboxes: !saveData.showHitboxes })}
            >
              {saveData.showHitboxes ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="btn-group">
          <button className="arcade-btn primary-btn" onClick={onResume}>
            RESUME (ESC / P)
          </button>
          <button className="arcade-btn secondary-btn" onClick={onRestart}>
            RESTART
          </button>
          <button className="arcade-btn danger-btn" onClick={onQuit}>
            QUIT TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
}
