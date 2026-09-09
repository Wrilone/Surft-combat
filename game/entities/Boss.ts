import { CONFIG } from '../config';
import { Entity } from './Entity';

export class WardenBoss extends Entity {
  public hp: number = 40;
  public maxHp: number = 40;
  public score: number = 5000;
  public phase: number = 1; // 1, 2, or 3
  public flashTimer = 0;
  public phaseTransitionTimer = 0; // Freeze / flash tell on phase change

  private moveTimer = 0;
  private fireTimer = 0;
  private sector = 1;
  private targetY = 16;
  private moveDir = 1;

  constructor() {
    super();
    this.width = CONFIG.ENEMY_TYPES.WARDEN.WIDTH;
    this.height = CONFIG.ENEMY_TYPES.WARDEN.HEIGHT;
    this.setHitbox(56, 36, 4, 6);
  }

  public spawn(sector: number, bounds: { width: number; height: number }) {
    this.sector = sector;
    const baseHp = CONFIG.ENEMY_TYPES.WARDEN.BASE_HP;
    const hpPerSector = CONFIG.ENEMY_TYPES.WARDEN.HP_PER_SECTOR;
    this.maxHp = baseHp + sector * hpPerSector;
    this.hp = this.maxHp;
    this.score = CONFIG.ENEMY_TYPES.WARDEN.SCORE;
    this.phase = 1;
    this.x = (bounds.width - this.width) / 2;
    this.y = -60; // fly down from top
    this.prevX = this.x;
    this.prevY = this.y;
    this.targetY = 12;
    this.flashTimer = 0;
    this.phaseTransitionTimer = 0;
    this.moveTimer = 0;
    this.fireTimer = 1.0;
    this.moveDir = 1;
    this.alive = true;
  }

  public hit(damage = 1, onPhaseChange?: (newPhase: number) => void): boolean {
    this.hp -= damage;
    this.flashTimer = 0.06;

    const hpRatio = this.hp / this.maxHp;
    let newPhase = 1;
    if (hpRatio <= 0.33) {
      newPhase = 3;
    } else if (hpRatio <= 0.66) {
      newPhase = 2;
    }

    if (newPhase !== this.phase && this.hp > 0) {
      this.phase = newPhase;
      this.phaseTransitionTimer = 0.2; // 200ms tell
      if (onPhaseChange) onPhaseChange(newPhase);
    }

    if (this.hp <= 0) {
      this.alive = false;
      return true; // boss defeated
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

    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.phaseTransitionTimer > 0) {
      this.phaseTransitionTimer -= dt;
      return; // freeze during phase change tell
    }

    // Intro fly down
    if (this.y < this.targetY) {
      this.y += 40 * dt;
      return;
    }

    this.moveTimer += dt;
    this.fireTimer -= dt;

    // Movement by phase
    const speed = CONFIG.ENEMY_TYPES.WARDEN.SPEED * (this.phase === 1 ? 1 : this.phase === 2 ? 1.4 : 1.8);

    this.x += this.moveDir * speed * dt;
    if (this.x <= 8) {
      this.x = 8;
      this.moveDir = 1;
    } else if (this.x >= bounds.width - this.width - 8) {
      this.x = bounds.width - this.width - 8;
      this.moveDir = -1;
    }

    // Gentle vertical hover
    this.y = this.targetY + Math.sin(this.moveTimer * 2) * (this.phase === 3 ? 8 : 4);

    // Attack patterns by phase
    if (this.fireTimer <= 0 && onFireBullet) {
      const bSpeed = CONFIG.ENEMY_BULLET.SPEED;
      const leftCannonX = this.x + 12;
      const rightCannonX = this.x + this.width - 16;
      const cannonY = this.y + this.height - 4;
      const centerCoreX = this.x + this.width / 2 - 2;

      if (this.phase === 1) {
        this.fireTimer = 1.3;
        // Dual straight shots
        onFireBullet(leftCannonX, cannonY, 0, bSpeed);
        onFireBullet(rightCannonX, cannonY, 0, bSpeed);
      } else if (this.phase === 2) {
        this.fireTimer = 1.1;
        // 3-shot aimed spread from cannons & core
        if (playerPos) {
          const dx = playerPos.x - centerCoreX;
          const dy = playerPos.y - cannonY;
          const angle = Math.atan2(dy, dx);
          onFireBullet(leftCannonX, cannonY, Math.cos(angle - 0.2) * bSpeed, Math.sin(angle - 0.2) * bSpeed);
          onFireBullet(centerCoreX, cannonY, Math.cos(angle) * bSpeed, Math.sin(angle) * bSpeed);
          onFireBullet(rightCannonX, cannonY, Math.cos(angle + 0.2) * bSpeed, Math.sin(angle + 0.2) * bSpeed);
        } else {
          onFireBullet(leftCannonX, cannonY, -25, bSpeed);
          onFireBullet(centerCoreX, cannonY, 0, bSpeed);
          onFireBullet(rightCannonX, cannonY, 25, bSpeed);
        }
      } else if (this.phase === 3) {
        this.fireTimer = 0.85;
        // 5-way spread burst
        for (let i = -2; i <= 2; i++) {
          const angle = Math.PI / 2 + (i * 0.25);
          onFireBullet(
            centerCoreX,
            cannonY,
            Math.cos(angle) * (bSpeed * 1.1),
            Math.sin(angle) * (bSpeed * 1.1)
          );
        }
      }
    }
  }
}
