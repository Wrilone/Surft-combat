'use client';

import React from 'react';

interface HudProps {
  onPause: () => void;
  onTriggerPulse: () => void;
  pulses: number;
}

export function Hud({ onPause, onTriggerPulse, pulses }: HudProps) {
  return (
    <div className="hud-interactive-layer">
      {/* Pause Button Pip in top right */}
      <button
        className="hud-pause-btn"
        onClick={onPause}
        aria-label="Pause Game"
      >
        ❚❚
      </button>

      {/* On-screen quick pulse button for mobile drag players */}
      {pulses > 0 && (
        <button
          className="hud-pulse-bubble pulse-anim"
          onClick={onTriggerPulse}
          aria-label="Trigger Screen Pulse"
        >
          PULSE ({pulses})
        </button>
      )}
    </div>
  );
}
