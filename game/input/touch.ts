import { CONFIG } from '../config';
import { InputState } from './InputState';

export interface TouchConfig {
  scheme: 'drag' | 'pad';
}

export class TouchInput {
  private container: HTMLElement | null = null;
  public scheme: 'drag' | 'pad' = 'drag';

  // Drag state
  private isTouching = false;
  private targetInternalX: number | null = null;
  private targetInternalY: number | null = null;
  private pulseTriggered = false;

  // On-screen pad state (used when scheme === 'pad')
  public padMoveX = 0;
  public padMoveY = 0;
  public padFiring = false;
  public padPulseTriggered = false;

  // Get current game dimensions getter
  private getDimensions: () => { width: number; height: number };

  constructor(getDimensions: () => { width: number; height: number }) {
    this.getDimensions = getDimensions;
  }

  public attach(element: HTMLElement) {
    this.detach();
    this.container = element;

    element.addEventListener('touchstart', this.onTouchStart, { passive: false });
    element.addEventListener('touchmove', this.onTouchMove, { passive: false });
    element.addEventListener('touchend', this.onTouchEnd, { passive: false });
    element.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  public detach() {
    if (this.container) {
      this.container.removeEventListener('touchstart', this.onTouchStart);
      this.container.removeEventListener('touchmove', this.onTouchMove);
      this.container.removeEventListener('touchend', this.onTouchEnd);
      this.container.removeEventListener('touchcancel', this.onTouchEnd);
      this.container = null;
    }
    this.reset();
  }

  public reset() {
    this.isTouching = false;
    this.targetInternalX = null;
    this.targetInternalY = null;
    this.padMoveX = 0;
    this.padMoveY = 0;
    this.padFiring = false;
  }

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length >= 2) {
      this.pulseTriggered = true;
    }

    if (this.scheme === 'drag' && e.touches.length > 0) {
      this.isTouching = true;
      this.updateDragTarget(e.touches[0]);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.scheme === 'drag' && e.touches.length > 0) {
      this.isTouching = true;
      this.updateDragTarget(e.touches[0]);
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      this.isTouching = false;
      this.targetInternalX = null;
      this.targetInternalY = null;
    } else if (this.scheme === 'drag') {
      this.updateDragTarget(e.touches[0]);
    }
  };

  private updateDragTarget(touch: Touch) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const { width: intWidth, height: intHeight } = this.getDimensions();

    const scaleX = intWidth / rect.width;
    const scaleY = intHeight / rect.height;

    // Apply internal coords + 48px vertical thumb offset
    this.targetInternalX = touchX * scaleX;
    this.targetInternalY = touchY * scaleY - CONFIG.TOUCH.VERTICAL_OFFSET;
  }

  public writeTo(state: InputState, playerX: number, playerY: number) {
    if (this.scheme === 'pad') {
      if (this.padMoveX !== 0) state.moveX = this.padMoveX;
      if (this.padMoveY !== 0) state.moveY = this.padMoveY;
      if (this.padFiring) state.firing = true;
      if (this.padPulseTriggered) {
        state.pulse = true;
        this.padPulseTriggered = false;
      }
    } else if (this.scheme === 'drag') {
      if (this.isTouching && this.targetInternalX !== null && this.targetInternalY !== null) {
        state.firing = true;

        const dx = this.targetInternalX - playerX;
        const dy = this.targetInternalY - playerY;
        const dist = Math.hypot(dx, dy);

        if (dist > CONFIG.TOUCH.DEADZONE) {
          // Normalised direction towards target
          state.moveX = Math.max(-1, Math.min(1, dx / Math.max(12, dist)));
          state.moveY = Math.max(-1, Math.min(1, dy / Math.max(12, dist)));
        } else {
          state.moveX = 0;
          state.moveY = 0;
        }
      }
    }

    if (this.pulseTriggered) {
      state.pulse = true;
      this.pulseTriggered = false;
    }
  }

  public triggerPadPulse() {
    this.padPulseTriggered = true;
  }
}
