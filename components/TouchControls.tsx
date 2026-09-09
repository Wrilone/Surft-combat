'use client';

import React, { useRef } from 'react';
import { TouchInput } from '@/game/input/touch';

interface TouchControlsProps {
  touchInput: TouchInput;
}

export function TouchControls({ touchInput }: TouchControlsProps) {
  const dpadRef = useRef<HTMLDivElement>(null);

  const handleDpadTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!dpadRef.current || e.touches.length === 0) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      touchInput.padMoveX = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
      touchInput.padMoveY = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
    } else {
      touchInput.padMoveX = 0;
      touchInput.padMoveY = 0;
    }
  };

  const handleDpadEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    touchInput.padMoveX = 0;
    touchInput.padMoveY = 0;
  };

  const handleFireStart = (e: React.TouchEvent) => {
    e.preventDefault();
    touchInput.padFiring = true;
  };

  const handleFireEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    touchInput.padFiring = false;
  };

  const handlePulse = (e: React.TouchEvent) => {
    e.preventDefault();
    touchInput.triggerPadPulse();
  };

  return (
    <div className="virtual-touch-controls">
      {/* Left D-pad */}
      <div
        ref={dpadRef}
        className="virtual-dpad"
        onTouchStart={handleDpadTouch}
        onTouchMove={handleDpadTouch}
        onTouchEnd={handleDpadEnd}
        onTouchCancel={handleDpadEnd}
      >
        <div className="dpad-stick"></div>
      </div>

      {/* Right Action Buttons */}
      <div className="virtual-actions">
        <button
          className="virtual-btn pulse-btn"
          onTouchStart={handlePulse}
        >
          PULSE
        </button>
        <button
          className="virtual-btn fire-btn"
          onTouchStart={handleFireStart}
          onTouchEnd={handleFireEnd}
          onTouchCancel={handleFireEnd}
        >
          FIRE
        </button>
      </div>
    </div>
  );
}
