import { InputState } from './InputState';

export class KeyboardInput {
  private heldKeys = new Set<string>();
  private pulseTriggered = false;
  private pauseTriggered = false;
  private muteTriggered = false;
  private enterTriggered = false;
  public isGameActive = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDown, { passive: false });
      window.addEventListener('keyup', this.onKeyUp, { passive: true });
      window.addEventListener('blur', this.onBlur);
    }
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
    }
    this.heldKeys.clear();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Only prevent default on arrows & space if active
    if (
      this.isGameActive &&
      (e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'Space')
    ) {
      e.preventDefault();
    }

    if (!this.heldKeys.has(e.code)) {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.pulseTriggered = true;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.pauseTriggered = true;
      }
      if (e.code === 'KeyM') {
        this.muteTriggered = true;
      }
      if (e.code === 'Enter') {
        this.enterTriggered = true;
      }
    }

    this.heldKeys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private onBlur = () => {
    this.heldKeys.clear();
  };

  public writeTo(state: InputState) {
    const left =
      this.heldKeys.has('ArrowLeft') ||
      this.heldKeys.has('KeyA') ||
      this.heldKeys.has('KeyQ');
    const right =
      this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD');
    const up =
      this.heldKeys.has('ArrowUp') ||
      this.heldKeys.has('KeyW') ||
      this.heldKeys.has('KeyZ');
    const down =
      this.heldKeys.has('ArrowDown') || this.heldKeys.has('KeyS');

    const kx = (right ? 1 : 0) - (left ? 1 : 0);
    const ky = (down ? 1 : 0) - (up ? 1 : 0);

    if (kx !== 0) state.moveX = kx;
    if (ky !== 0) state.moveY = ky;

    if (this.heldKeys.has('Space')) {
      state.firing = true;
    }

    if (this.pulseTriggered) {
      state.pulse = true;
      this.pulseTriggered = false;
    }

    if (this.pauseTriggered) {
      state.pause = true;
      this.pauseTriggered = false;
    }
  }

  public consumeMute(): boolean {
    const res = this.muteTriggered;
    this.muteTriggered = false;
    return res;
  }

  public consumeEnter(): boolean {
    const res = this.enterTriggered;
    this.enterTriggered = false;
    return res;
  }
}
