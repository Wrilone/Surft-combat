import { CONFIG, PowerUpType } from '../config';
import { Entity } from './Entity';
import { InputState } from '../input/InputState';

export class Player extends Entity {
  public lives: number = CONFIG.PLAYER.START_LIVES;
  public pulses: number = CONFIG.PLAYER.START_PULSES;
  public invulnerableTimer = 0;
  public isInvulnerable = false;

  // Power-up states
  public hasShield = false;
  public spreadTimer = 0;
  public rapidTimer = 0;

  // Weapon fire timing
  private shotCooldown = 0;
  public muzzleFlashTimer = 0;
  public recoilY = 0;

  // Sprite animation & banking
  public bankFrame = 0; // 0: neutral, 1: left, 2: right
  public thrusterFrame = 0;
  private thrusterTimer = 0;

  constructor() {
    super();
    this.width = CONFIG.PLAYER.WIDTH;
    this.height = CONFIG.PLAYER.HEIGHT;
    this.setHitbox(
      CONFIG.PLAYER.HITBOX_WIDTH,
      CONFIG.PLAYER.HITBOX_HEIGHT,
      (this.width - CONFIG.PLAYER.HITBOX_WIDTH) / 2,
      (this.height - CONFIG.PLAYER.HITBOX_HEIGHT) / 2
    );
  }

  public reset(bounds: { width: number; height: number }) {
    this.x = (bounds.width - this.width) / 2;
    this.y = bounds.height - this.height - 16;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.lives = CONFIG.PLAYER.START_LIVES;
    this.pulses = CONFIG.PLAYER.START_PULSES;
    this.hasShield = false;
    this.spreadTimer = 0;
    this.rapidTimer = 0;
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABLE_TIME;
    this.isInvulnerable = true;
    this.shotCooldown = 0;
    this.muzzleFlashTimer = 0;
    this.recoilY = 0;
    this.alive = true;
  }

  public respawn(bounds: { width: number; height: number }) {
    this.x = (bounds.width - this.width) / 2;
    this.y = bounds.height - this.height - 16;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABLE_TIME;
    this.isInvulnerable = true;
    this.shotCooldown = 0;
    this.muzzleFlashTimer = 0;
    this.recoilY = 0;
    this.alive = true;
  }

  public applyPowerUp(type: PowerUpType) {
    if (type === 'SPREAD') {
      this.spreadTimer = CONFIG.PLAYER.SPREAD_DURATION;
    } else if (type === 'RAPID') {
      this.rapidTimer = CONFIG.PLAYER.RAPID_DURATION;
    } else if (type === 'SHIELD') {
      this.hasShield = true;
    } else if (type === 'PULSE') {
      this.pulses = Math.min(CONFIG.PLAYER.MAX_PULSES, this.pulses + 1);
    }
  }

  public takeHit(): boolean {
    if (this.isInvulnerable || !this.alive) return false;

    if (this.hasShield) {
      this.hasShield = false;
      this.invulnerableTimer = 0.5; // Brief grace period after shield pops
      this.isInvulnerable = true;
      return false; // Did not lose a life
    }

    this.lives -= 1;
    this.alive = false;
    return true; // Lost a life
  }

  public updateWithInput(
    dt: number,
    input: InputState,
    bounds: { width: number; height: number },
    onShoot: (x: number, y: number, vx: number, vy: number) => void
  ) {
    if (!this.alive) return;
    this.savePrevPos();

    // 1. Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.isInvulnerable = true;
    } else {
      this.isInvulnerable = false;
    }

    // 2. Power-up timers
    if (this.spreadTimer > 0) this.spreadTimer -= dt;
    if (this.rapidTimer > 0) this.rapidTimer -= dt;

    // 3. Movement
    let mx = input.moveX;
    let my = input.moveY;

    // Normalize diagonal movement
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }

    const speed = CONFIG.PLAYER.SPEED;
    this.vx = mx * speed;
    this.vy = my * speed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp inside playfield bounds with margin
    const margin = CONFIG.PLAYER.MARGIN;
    this.x = Math.max(margin, Math.min(bounds.width - this.width - margin, this.x));
    this.y = Math.max(margin, Math.min(bounds.height - this.height - margin, this.y));

    // Banking frame
    if (mx < -0.1) {
      this.bankFrame = 1; // Left
    } else if (mx > 0.1) {
      this.bankFrame = 2; // Right
    } else {
      this.bankFrame = 0; // Neutral
    }

    // Thruster animation
    this.thrusterTimer += dt;
    if (this.thrusterTimer >= 1 / 12) {
      this.thrusterTimer = 0;
      this.thrusterFrame = (this.thrusterFrame + 1) % 4;
    }

    // Recoil and flash decays
    if (this.recoilY > 0) {
      this.recoilY = Math.max(0, this.recoilY - dt * 20);
    }
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }

    // 4. Weapon firing
    const fireRate = this.rapidTimer > 0 ? CONFIG.PLAYER.RAPID_FIRE_RATE : CONFIG.PLAYER.BASE_FIRE_RATE;
    const fireInterval = 1 / fireRate;

    if (this.shotCooldown > 0) {
      this.shotCooldown -= dt;
    }

    if (input.firing && this.shotCooldown <= 0) {
      this.shotCooldown = fireInterval;
      this.muzzleFlashTimer = 0.05; // 50ms amber flash
      this.recoilY = 1; // 1px recoil

      const bulletSpeed = CONFIG.PLAYER.BULLET_SPEED;
      const spawnX = this.x + this.width / 2 - 1.5;
      const spawnY = this.y - 2;

      if (this.spreadTimer > 0) {
        // 3-shot fan
        onShoot(spawnX, spawnY, 0, -bulletSpeed);
        onShoot(spawnX, spawnY, -60, -bulletSpeed * 0.96);
        onShoot(spawnX, spawnY, 60, -bulletSpeed * 0.96);
      } else {
        // Single shot
        onShoot(spawnX, spawnY, 0, -bulletSpeed);
      }
    }
  }

  public update(dt: number, bounds: { width: number; height: number }): void {
    // Default update without input (fallback)
  }
}
