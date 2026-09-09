import { CONFIG } from '../config';

export class CameraSystem {
  public shakeIntensity = 0;
  public shakeDuration = 0;
  public offsetX = 0;
  public offsetY = 0;

  public hitStopTimer = 0;
  public timeScale = 1.0;

  public hitFlashTimer = 0; // Red/coral screen flash when player hit
  public hitFlashDuration = 0.08; // 80ms

  public reducedMotion = false;
  public slowMode = false;

  public triggerShake(intensity = 4, duration = 0.12) {
    if (this.reducedMotion) {
      this.shakeIntensity = 0;
      return;
    }
    this.shakeIntensity = Math.min(8, Math.max(this.shakeIntensity, intensity));
    this.shakeDuration = duration;
  }

  public triggerHitStop(duration = CONFIG.FX.HIT_STOP_DURATION, scale = CONFIG.FX.HIT_STOP_TIME_SCALE) {
    this.hitStopTimer = duration;
    this.timeScale = scale;
    this.hitFlashTimer = this.hitFlashDuration;
    this.triggerShake(CONFIG.FX.SCREEN_SHAKE_HIT, 0.2);
  }

  public update(dt: number) {
    // 1. Hit-stop time scaling
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      if (this.hitStopTimer <= 0) {
        this.timeScale = this.slowMode ? 0.75 : 1.0;
      }
    } else {
      this.timeScale = this.slowMode ? 0.75 : 1.0;
    }

    // 2. Hit flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    // 3. Screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const amount = this.shakeIntensity * (this.shakeDuration / 0.15);
      this.offsetX = (Math.random() * 2 - 1) * amount;
      this.offsetY = (Math.random() * 2 - 1) * amount;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
        this.offsetX = 0;
        this.offsetY = 0;
      }
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }

  public reset() {
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.hitStopTimer = 0;
    this.hitFlashTimer = 0;
    this.timeScale = this.slowMode ? 0.75 : 1.0;
  }
}
