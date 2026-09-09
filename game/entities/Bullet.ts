import { CONFIG } from '../config';
import { Entity } from './Entity';

export class PlayerBullet extends Entity {
  constructor() {
    super();
    this.width = 3;
    this.height = 8;
    this.setHitbox(3, 8, 0, 0);
  }

  public spawn(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.alive = true;
  }

  public update(dt: number, bounds: { width: number; height: number }): void {
    if (!this.alive) return;
    this.savePrevPos();
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y < -10 || this.y > bounds.height + 10 || this.x < -10 || this.x > bounds.width + 10) {
      this.alive = false;
    }
  }
}

export class EnemyBullet extends Entity {
  public animFrame = 0;
  private animTimer = 0;

  constructor() {
    super();
    this.width = CONFIG.ENEMY_BULLET.WIDTH;
    this.height = CONFIG.ENEMY_BULLET.HEIGHT;
    this.setHitbox(4, 4, 0, 0);
  }

  public spawn(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = vx;
    this.vy = vy;
    this.alive = true;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  public update(dt: number, bounds: { width: number; height: number }): void {
    if (!this.alive) return;
    this.savePrevPos();
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.animTimer += dt;
    if (this.animTimer >= 0.1) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (
      this.y < -20 ||
      this.y > bounds.height + 20 ||
      this.x < -20 ||
      this.x > bounds.width + 20
    ) {
      this.alive = false;
    }
  }
}
