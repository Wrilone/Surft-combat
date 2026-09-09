import { CONFIG, EnemyTypeName, PowerUpType } from './config';
import { Player } from './entities/Player';
import { PlayerBullet, EnemyBullet } from './entities/Bullet';
import { Enemy } from './entities/Enemy';
import { WardenBoss } from './entities/Boss';
import { Drop } from './entities/Drop';
import { SpatialHashGrid, checkAABB } from './systems/collision';
import { ParticlePool } from './systems/particles';
import { CameraSystem } from './systems/camera';
import { WaveSpawner } from './systems/spawner';
import { InputState } from './input/InputState';
import { SoundEffects } from './audio/sfx';
import { MusicEngine } from './audio/music';
import { SeededRNG, globalRNG } from './utils/random';

export interface WorldCallbacks {
  onScoreChange?: (score: number, combo: number, best: number) => void;
  onLivesChange?: (lives: number) => void;
  onPulsesChange?: (pulses: number) => void;
  onSectorChange?: (sector: number, wave: number) => void;
  onGameOver?: (score: number, best: number, sector: number) => void;
}

export class World {
  public width = CONFIG.LANDSCAPE_WIDTH;
  public height = CONFIG.LANDSCAPE_HEIGHT;
  public isPortrait = false;

  // RNG
  public rng: SeededRNG;

  // Entities & Pools
  public player = new Player();
  public playerBullets: PlayerBullet[] = [];
  public enemyBullets: EnemyBullet[] = [];
  public enemies: Enemy[] = [];
  public boss = new WardenBoss();
  public drops: Drop[] = [];

  // Systems
  public spatialGrid = new SpatialHashGrid(CONFIG.SPATIAL_HASH_CELL_SIZE);
  public particles = new ParticlePool(200);
  public camera = new CameraSystem();
  public spawner: WaveSpawner;

  // Audio references
  public sfx: SoundEffects | null = null;
  public music: MusicEngine | null = null;

  // Game Stats
  public score = 0;
  public bestScore = 0;
  public combo = 1;
  public comboTimer = 0;
  public comboJustPopped = false;
  public sector = 1;
  public wave = 1;
  public sectorsCleared = 0;
  public sectorTookHit = false;
  public isGameOver = false;

  // Collision query sets (reused to avoid allocation)
  private potentialColliders = new Set<any>();

  public callbacks: WorldCallbacks = {};

  constructor(bestScore = 0, rng = new SeededRNG(42)) {
    this.bestScore = bestScore;
    this.rng = rng;
    this.spawner = new WaveSpawner(this.rng);
    this.initPools();
  }

  private initPools() {
    // 50 player bullets
    for (let i = 0; i < 50; i++) {
      this.playerBullets.push(new PlayerBullet());
    }
    // 100 enemy bullets
    for (let i = 0; i < 100; i++) {
      this.enemyBullets.push(new EnemyBullet());
    }
    // 30 enemies
    for (let i = 0; i < 30; i++) {
      this.enemies.push(new Enemy(this.rng));
    }
    // 10 drops
    for (let i = 0; i < 10; i++) {
      this.drops.push(new Drop());
    }
  }

  public setDimensions(width: number, height: number, isPortrait: boolean) {
    this.width = width;
    this.height = height;
    this.isPortrait = isPortrait;
  }

  public resetGame(bestScore = this.bestScore) {
    this.bestScore = bestScore;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboJustPopped = false;
    this.sector = 1;
    this.wave = 1;
    this.sectorsCleared = 0;
    this.sectorTookHit = false;
    this.isGameOver = false;

    // Reset pools
    this.clearPools();
    this.particles.clear();
    this.camera.reset();

    // Reset player
    this.player.reset({ width: this.width, height: this.height });

    // Init Spawner
    this.spawner.init();
    this.spawner.startSector(1);

    if (this.music) {
      this.music.start(1, false);
    }

    this.notifyHUD();
  }

  private clearPools() {
    for (const b of this.playerBullets) b.alive = false;
    for (const eb of this.enemyBullets) eb.alive = false;
    for (const e of this.enemies) e.alive = false;
    for (const d of this.drops) d.alive = false;
    this.boss.alive = false;
  }

  private notifyHUD() {
    if (this.callbacks.onScoreChange) {
      this.callbacks.onScoreChange(this.score, this.combo, this.bestScore);
    }
    if (this.callbacks.onLivesChange) {
      this.callbacks.onLivesChange(this.player.lives);
    }
    if (this.callbacks.onPulsesChange) {
      this.callbacks.onPulsesChange(this.player.pulses);
    }
    if (this.callbacks.onSectorChange) {
      this.callbacks.onSectorChange(this.spawner.sector, this.spawner.wave);
    }
  }

  // --- Entity Spawn Helpers ---
  public spawnPlayerBullet = (x: number, y: number, vx: number, vy: number) => {
    for (let i = 0; i < this.playerBullets.length; i++) {
      if (!this.playerBullets[i].alive) {
        this.playerBullets[i].spawn(x, y, vx, vy);
        if (this.sfx) this.sfx.playPlayerShot();
        return;
      }
    }
  };

  public spawnEnemyBullet = (x: number, y: number, vx: number, vy: number) => {
    for (let i = 0; i < this.enemyBullets.length; i++) {
      if (!this.enemyBullets[i].alive) {
        this.enemyBullets[i].spawn(x, y, vx, vy);
        return;
      }
    }
  };

  public spawnEnemy = (type: EnemyTypeName, normalizedX: number, speedMult: number, fireMult: number) => {
    for (let i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].alive) {
        const x = normalizedX * (this.width - 24) + 12;
        this.enemies[i].spawn(type, x, -16, speedMult, fireMult);
        return;
      }
    }
  };

  public spawnDrop(x: number, y: number) {
    const types: PowerUpType[] = ['SPREAD', 'RAPID', 'SHIELD', 'PULSE'];
    const type = this.rng.choice(types);
    for (let i = 0; i < this.drops.length; i++) {
      if (!this.drops[i].alive) {
        this.drops[i].spawn(x, y, type);
        return;
      }
    }
  }

  // --- Pulse Mechanic ---
  public triggerPulse() {
    if (this.player.pulses <= 0) return;
    this.player.pulses -= 1;

    // 1. Audio and Visual shockwave
    if (this.sfx) this.sfx.playPulse();
    this.particles.spawnPulseWash();
    this.camera.triggerShake(6, 0.2);

    // 2. Clear all enemy bullets
    for (let i = 0; i < this.enemyBullets.length; i++) {
      if (this.enemyBullets[i].alive) {
        this.enemyBullets[i].alive = false;
        this.particles.spawnHitSparks(this.enemyBullets[i].x, this.enemyBullets[i].y, 2, CONFIG.COLORS.AQUA);
      }
    }

    // 3. Deal 5 damage to all active enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.alive) {
        const died = e.hit(5);
        this.particles.spawnHitSparks(e.x + e.width / 2, e.y + e.height / 2, 4, CONFIG.COLORS.AQUA);
        if (died) {
          this.handleEnemyKill(e.score, e.x + e.width / 2, e.y + e.height / 2, e.type);
        }
      }
    }

    // 4. Deal 5 damage to Boss if active
    if (this.boss.alive) {
      const died = this.boss.hit(5, (newPhase) => {
        if (this.sfx) this.sfx.playBossPhase();
        this.camera.triggerHitStop(0.2, 0.1);
      });
      this.particles.spawnHitSparks(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2, 6, CONFIG.COLORS.AQUA);
      if (died) {
        this.handleBossKill();
      }
    }

    this.notifyHUD();
  }

  private handleEnemyKill(scoreVal: number, x: number, y: number, type: EnemyTypeName) {
    // 1. Score & Combo
    this.score += scoreVal * this.combo;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }

    if (this.combo < CONFIG.SCORING.COMBO_MAX) {
      this.combo += 1;
      this.comboJustPopped = true;
    }
    this.comboTimer = CONFIG.SCORING.COMBO_DECAY_TIME;

    // 2. Audio & FX
    if (this.sfx) {
      this.sfx.playEnemyHit();
      this.sfx.playExplosion();
    }
    this.particles.spawnExplosion(x - 8, y - 8);
    this.camera.triggerShake(CONFIG.FX.SCREEN_SHAKE_KILL, 0.12);

    // 3. Power-up drop chance (1 in 8)
    if (this.rng.next() < CONFIG.POWERUP.DROP_CHANCE) {
      this.spawnDrop(x - 5, y - 5);
    }

    // 4. Special: Mine splits into 3 drones
    if (type === 'MINE') {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < this.enemies.length; j++) {
          if (!this.enemies[j].alive) {
            const drone = this.enemies[j];
            drone.spawn('DRONE', x + (i - 1) * 12, y, this.spawner.speedMultiplier, this.spawner.fireMultiplier);
            drone.vx = (i - 1) * 35;
            break;
          }
        }
      }
    }

    this.notifyHUD();
  }

  private handleBossKill() {
    this.score += this.boss.score * this.combo;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    if (this.sfx) {
      this.sfx.playExplosion();
    }
    // Multiple explosions
    for (let i = 0; i < 8; i++) {
      const ox = this.boss.x + Math.random() * this.boss.width;
      const oy = this.boss.y + Math.random() * this.boss.height;
      this.particles.spawnExplosion(ox - 8, oy - 8);
    }
    this.camera.triggerShake(8, 0.4);

    // Always drop a power-up
    this.spawnDrop(this.boss.x + this.boss.width / 2 - 5, this.boss.y + this.boss.height / 2);

    // End boss wave & award bonuses
    this.onBossCleared();
  }

  private onBossCleared() {
    this.sectorsCleared += 1;
    // Wave clear bonus
    const clearBonus = CONFIG.SCORING.WAVE_CLEAR_BASE * this.spawner.sector;
    this.score += clearBonus;

    // No-hit sector bonus
    if (!this.sectorTookHit) {
      this.score += CONFIG.SCORING.NO_HIT_SECTOR_BONUS;
    }

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }

    // Advance to next sector
    this.sectorTookHit = false;
    this.spawner.startSector(this.spawner.sector + 1);

    if (this.music) {
      this.music.start(this.spawner.sector, false);
    }

    this.notifyHUD();
  }

  // --- Main Update Loop Step ---
  public update(dt: number, input: InputState) {
    if (this.isGameOver) return;

    // 1. Handle edge-triggered pulse from input
    if (input.pulse) {
      this.triggerPulse();
    }

    // 2. Update Camera & Systems
    this.camera.update(dt);
    this.particles.update(dt);

    // 3. Update Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.notifyHUD();
      }
    }

    // 4. Update Player
    const bounds = { width: this.width, height: this.height };
    this.player.updateWithInput(dt, input, bounds, this.spawnPlayerBullet);

    // 5. Update Player Bullets
    for (let i = 0; i < this.playerBullets.length; i++) {
      if (this.playerBullets[i].alive) {
        this.playerBullets[i].update(dt, bounds);
      }
    }

    // 6. Update Enemy Bullets
    for (let i = 0; i < this.enemyBullets.length; i++) {
      if (this.enemyBullets[i].alive) {
        this.enemyBullets[i].update(dt, bounds);
      }
    }

    // 7. Update Enemies
    const playerPos = { x: this.player.x + this.player.width / 2, y: this.player.y };
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive) {
        this.enemies[i].update(dt, bounds, playerPos, this.spawnEnemyBullet);
      }
    }

    // 8. Update Boss
    if (this.boss.alive) {
      this.boss.update(dt, bounds, playerPos, this.spawnEnemyBullet);
    }

    // 9. Update Drops
    for (let i = 0; i < this.drops.length; i++) {
      if (this.drops[i].alive) {
        this.drops[i].update(dt, bounds);
      }
    }

    // 10. Update Spawner & Wave Progression
    this.spawner.update(dt, this.spawnEnemy);

    // Check if wave is cleared
    if (this.spawner.isWaveActive && !this.spawner.isBossWave) {
      let activeEnemies = 0;
      for (let i = 0; i < this.enemies.length; i++) {
        if (this.enemies[i].alive) activeEnemies++;
      }

      if (activeEnemies === 0 && this.spawner.isSpawningComplete()) {
        // Wave clear bonus
        this.score += CONFIG.SCORING.WAVE_CLEAR_BASE * this.spawner.sector;
        if (this.score > this.bestScore) this.bestScore = this.score;

        if (this.spawner.wave < CONFIG.SCALING.WAVES_PER_SECTOR) {
          this.spawner.startWave(this.spawner.wave + 1);
          if (this.spawner.isBossWave) {
            this.boss.spawn(this.spawner.sector, bounds);
            if (this.music) this.music.start(this.spawner.sector, true);
          }
        }
        this.notifyHUD();
      }
    }

    // 11. Run Collision Phase
    this.handleCollisions();
  }

  private handleCollisions() {
    this.spatialGrid.clear();

    // 1. Insert all active Enemies & Boss into Spatial Hash
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].alive) {
        this.spatialGrid.insert(this.enemies[i]);
      }
    }
    if (this.boss.alive) {
      this.spatialGrid.insert(this.boss);
    }

    // 2. Check Player Bullets vs Enemies / Boss
    for (let i = 0; i < this.playerBullets.length; i++) {
      const b = this.playerBullets[i];
      if (!b.alive) continue;

      this.spatialGrid.getPotentialColliders(b, this.potentialColliders);
      for (const target of this.potentialColliders) {
        if (checkAABB(b.getHitbox(), target.getHitbox())) {
          b.alive = false;
          this.particles.spawnHitSparks(b.x, b.y, 3, CONFIG.COLORS.AMBER);

          if (target instanceof Enemy) {
            const died = target.hit(1);
            if (died) {
              this.handleEnemyKill(target.score, target.x + target.width / 2, target.y + target.height / 2, target.type);
            } else if (this.sfx) {
              this.sfx.playEnemyHit();
            }
          } else if (target instanceof WardenBoss) {
            const died = target.hit(1, (newPhase) => {
              if (this.sfx) this.sfx.playBossPhase();
              this.camera.triggerHitStop(0.2, 0.1);
            });
            if (died) {
              this.handleBossKill();
            } else if (this.sfx) {
              this.sfx.playEnemyHit();
            }
          }
          break; // Bullet hit something
        }
      }
    }

    // 3. Check Player vs Enemies / Boss / Enemy Bullets / Drops
    if (this.player.alive) {
      const playerBox = this.player.getHitbox();

      // Enemy Bullets vs Player
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const eb = this.enemyBullets[i];
        if (eb.alive && checkAABB(playerBox, eb.getHitbox())) {
          eb.alive = false;
          this.onPlayerHit();
          break;
        }
      }

      // Enemies vs Player
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.alive && checkAABB(playerBox, e.getHitbox())) {
          e.alive = false;
          this.particles.spawnExplosion(e.x, e.y);
          this.onPlayerHit();
          break;
        }
      }

      // Boss vs Player
      if (this.boss.alive && checkAABB(playerBox, this.boss.getHitbox())) {
        this.onPlayerHit();
      }

      // Drops vs Player
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        if (d.alive && checkAABB(playerBox, d.getHitbox())) {
          d.alive = false;
          this.player.applyPowerUp(d.type);
          if (this.sfx) this.sfx.playDropPickup();
          this.particles.spawnPickupRing(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, CONFIG.COLORS.AQUA);
          this.notifyHUD();
        }
      }
    }
  }

  private onPlayerHit() {
    this.sectorTookHit = true;
    const lostLife = this.player.takeHit();

    if (lostLife) {
      this.camera.triggerHitStop();
      if (this.sfx) this.sfx.playPlayerDeath();
      this.particles.spawnExplosion(this.player.x, this.player.y);

      if (this.player.lives > 0) {
        // Respawn
        this.player.respawn({ width: this.width, height: this.height });
      } else {
        // Game Over
        this.isGameOver = true;
        if (this.music) this.music.stop();
        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver(this.score, this.bestScore, this.spawner.sector);
        }
      }
    } else {
      // Shield absorbed
      if (this.sfx) this.sfx.playEnemyHit();
      this.camera.triggerShake(4, 0.1);
    }

    this.notifyHUD();
  }
}
