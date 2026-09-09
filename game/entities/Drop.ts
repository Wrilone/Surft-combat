import { CONFIG, PowerUpType } from '../config';
import { Entity } from './Entity';

export class Drop extends Entity {
  public type: PowerUpType = 'SPREAD';
  private wobbleTime = 0;
  private baseStartX = 0;

  constructor() {
    super();
    this.width = CONFIG.POWERUP.WIDTH;
    this.height = CONFIG.POWERUP.HEIGHT;
    this.setHitbox(10, 10, 0, 0);
  }

  public spawn(x: number, y: number, type: PowerUpType) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.baseStartX = x;
    this.vy = CONFIG.POWERUP.SPEED;
    this.vx = 0;
    this.type = type;
    this.wobbleTime = 0;
    this.alive = true;
  }

  public update(dt: number, bounds: { width: number; height: number }): void {
    if (!this.alive) return;
    this.savePrevPos();
    this.wobbleTime += dt;
    this.x = this.baseStartX + Math.sin(this.wobbleTime * 3) * 6;
    this.y += this.vy * dt;

    if (this.y > bounds.height + 20) {
      this.alive = false;
    }
  }
}
