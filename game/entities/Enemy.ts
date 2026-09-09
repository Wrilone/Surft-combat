import { CONFIG, EnemyTypeName } from '../config';
import { Entity } from './Entity';
import { SeededRNG, globalRNG } from '../utils/random';

export class Enemy extends Entity {
  public type: EnemyTypeName = 'DRONE';
  public hp = 1;
  public maxHp = 1;
  public score = 100;
  public flashTimer = 0; // Flash white when hit for 60ms

  // Animation & AI state
  public animFrame = 0;
  private animTimer = 0;
  private stateTimer = 0;
  private startX = 0;
  private fireTimer = 0;
  public isCharging = false;
  public rng: SeededRNG;

  // Multipliers from sector
  public speedMultiplier = 1;
  public fireMultiplier = 1;

  constructor(rng = globalRNG) {
    super();
    this.rng = rng;
  }

  public spawn(
    type: EnemyTypeName,
    x: number,
    y: number,
    speedMult = 1,
    fireMult = 1
  ) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.startX = x;
    this.speedMultiplier = speedMult;
    this.fireMultiplier = fireMult;
    this.flashTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.stateTimer = 0;
    this.isCharging = false;
    this.alive = true;

    if (type === 'DRONE') {
      const conf = CONFIG.ENEMY_TYPES.DRONE;
      this.hp = conf.HP;
      this.maxHp = conf.HP;
      this.score = conf.SCORE;
      this.width = conf.WIDTH;
      this.height = conf.HEIGHT;
      this.setHitbox(conf.WIDTH, conf.HEIGHT, 0, 0);
      this.vx = (this.rng.next() - 0.5) * 15;
      this.vy = conf.SPEED * speedMult;
    } else if (type === 'SKIMMER') {
      const conf = CONFIG.ENEMY_TYPES.SKIMMER;
      this.hp = conf.HP;
      this.maxHp = conf.HP;
      this.score = conf.SCORE;
      this.width = conf.WIDTH;
      this.height = conf.HEIGHT;
      this.setHitbox(conf.WIDTH, conf.HEIGHT, 0, 0);
      this.vx = 0;
      this.vy = conf.SPEED * speedMult;
    } else if (type === 'LANCER') {
      const conf = CONFIG.ENEMY_TYPES.LANCER;
      this.hp = conf.HP;
      this.maxHp = conf.HP;
      this.score = conf.SCORE;
      this.width = conf.WIDTH;
      this.height = conf.HEIGHT;
      this.setHitbox(conf.WIDTH, conf.HEIGHT, 0, 0);
      this.vx = 0;
      this.vy = conf.SPEED * speedMult;
      this.fireTimer = (conf.FIRE_INTERVAL / fireMult) * (0.6 + this.rng.next() * 0.4);
    } else if (type === 'MINE') {
      const conf = CONFIG.ENEMY_TYPES.MINE;
      this.hp = conf.HP;
      this.maxHp = conf.HP;
      this.score = conf.SCORE;
      this.width = conf.WIDTH;
      this.height = conf.HEIGHT;
      this.setHitbox(conf.WIDTH, conf.HEIGHT, 0, 0);
      this.vx = 0;
      this.vy = conf.SPEED * speedMult;
    }
  }

  public hit(damage = 1): boolean {
    this.hp -= damage;
    this.flashTimer = 0.06; // 60ms
    if (this.hp <= 0) {
      this.alive = false;
      return true; // died
    }
    return false;
  }

  public update(
    dt: number,
    bounds: { width: number; height: number },
    playerPos?: { x: number; y: number },
    onFireBullet?: (x: number, y: number, vx: number, vy: number) => void
  ): void {
    if (!this.alive) return;
    this.savePrevPos();

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    this.stateTimer += dt;
    this.animTimer += dt;

    if (this.type === 'DRONE') {
      if (this.animTimer >= 0.15) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Keep slightly within borders
      if (this.x < 4) {
        this.x = 4;
        this.vx = Math.abs(this.vx);
      } else if (this.x > bounds.width - this.width - 4) {
        this.x = bounds.width - this.width - 4;
        this.vx = -Math.abs(this.vx);
      }
    } else if (this.type === 'SKIMMER') {
      if (this.animTimer >= 0.15) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
      const skimmerConf = CONFIG.ENEMY_TYPES.SKIMMER;
      this.x = this.startX + Math.sin(this.stateTimer * skimmerConf.SINE_FREQ) * skimmerConf.SINE_AMP;
      this.y += this.vy * dt;
    } else if (this.type === 'LANCER') {
      const lancerConf = CONFIG.ENEMY_TYPES.LANCER;
      this.y += this.vy * dt;

      this.fireTimer -= dt;
      if (this.fireTimer <= lancerConf.CHARGE_TIME) {
        this.isCharging = true;
        this.animFrame = 1;
      } else {
        this.isCharging = false;
        this.animFrame = 0;
      }

      if (this.fireTimer <= 0) {
        this.fireTimer = lancerConf.FIRE_INTERVAL / this.fireMultiplier;
        this.isCharging = false;
        this.animFrame = 0;

        // Fire aimed shot towards player
        if (playerPos && onFireBullet) {
          const cx = this.x + this.width / 2;
          const cy = this.y + this.height;
          const dx = playerPos.x - cx;
          const dy = playerPos.y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const speed = CONFIG.ENEMY_BULLET.SPEED;
          onFireBullet(cx - 2, cy, (dx / dist) * speed, (dy / dist) * speed);
        }
      }
    } else if (this.type === 'MINE') {
      if (this.animTimer >= 0.12) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
      this.y += this.vy * dt;
    }

    if (this.y > bounds.height + 25 || this.x < -30 || this.x > bounds.width + 30) {
      this.alive = false;
    }
  }
}
