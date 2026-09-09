import { CONFIG } from '../config';

export type ParticleType = 'SPARK' | 'EXPLOSION' | 'RING' | 'PULSE_WASH';

export class Particle {
  public alive = false;
  public type: ParticleType = 'SPARK';
  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public color: string = CONFIG.COLORS.AMBER;
  public size = 1;
  public life = 0;
  public maxLife = 1;
  public frame = 0; // For animated explosions

  public spawnSpark(x: number, y: number, color: string = CONFIG.COLORS.AMBER) {
    this.alive = true;
    this.type = 'SPARK';
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 60;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.size = Math.random() > 0.5 ? 2 : 1;
    this.life = 0.2 + Math.random() * 0.15;
    this.maxLife = this.life;
  }

  public spawnExplosion(x: number, y: number) {
    this.alive = true;
    this.type = 'EXPLOSION';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.life = 6 / 24; // 6 frames at 24fps = 0.25s
    this.maxLife = this.life;
    this.frame = 0;
  }

  public spawnRing(x: number, y: number, color: string = CONFIG.COLORS.AQUA) {
    this.alive = true;
    this.type = 'RING';
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.size = 2; // radius
    this.life = 0.35;
    this.maxLife = this.life;
  }

  public spawnPulseWash() {
    this.alive = true;
    this.type = 'PULSE_WASH';
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = CONFIG.COLORS.AQUA;
    this.life = CONFIG.FX.PULSE_FLASH_TIME; // 0.4s
    this.maxLife = this.life;
  }

  public update(dt: number) {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    if (this.type === 'SPARK') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.95;
      this.vy *= 0.95;
    } else if (this.type === 'EXPLOSION') {
      const progress = 1 - this.life / this.maxLife;
      this.frame = Math.min(5, Math.floor(progress * 6));
    } else if (this.type === 'RING') {
      const progress = 1 - this.life / this.maxLife;
      this.size = 2 + progress * 24; // expands outwards
    }
  }
}

export class ParticlePool {
  public particles: Particle[] = [];
  public maxParticles: number;

  constructor(size = 200) {
    this.maxParticles = size;
    for (let i = 0; i < size; i++) {
      this.particles.push(new Particle());
    }
  }

  public getAvailable(): Particle | null {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].alive) {
        return this.particles[i];
      }
    }
    return null;
  }

  public spawnHitSparks(x: number, y: number, count = 3, color = CONFIG.COLORS.AMBER) {
    for (let i = 0; i < count; i++) {
      const p = this.getAvailable();
      if (p) p.spawnSpark(x, y, color);
    }
  }

  public spawnExplosion(x: number, y: number) {
    const p = this.getAvailable();
    if (p) p.spawnExplosion(x, y);
  }

  public spawnPickupRing(x: number, y: number, color = CONFIG.COLORS.AQUA) {
    const p = this.getAvailable();
    if (p) p.spawnRing(x, y, color);
  }

  public spawnPulseWash() {
    const p = this.getAvailable();
    if (p) p.spawnPulseWash();
  }

  public update(dt: number) {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].alive) {
        this.particles[i].update(dt);
      }
    }
  }

  public clear() {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].alive = false;
    }
  }
}
