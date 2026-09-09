import { CONFIG } from './config';
import { World } from './World';
import { ATLAS_RECTS, getSpriteAtlas, SpriteRect } from './assets/atlas';
import { formatScore, formatSector } from '../lib/format';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

export class Renderer {
  private gameCtx: CanvasRenderingContext2D;
  private hudCtx: CanvasRenderingContext2D;
  private atlasCanvas: HTMLCanvasElement | null = null;
  private stars: Star[] = [];

  public highContrast = false;
  public showHitboxes = false;

  constructor(gameCanvas: HTMLCanvasElement, hudCanvas: HTMLCanvasElement) {
    this.gameCtx = gameCanvas.getContext('2d')!;
    this.hudCtx = hudCanvas.getContext('2d')!;
    this.setupContexts();
    this.initStars(CONFIG.LANDSCAPE_WIDTH, CONFIG.LANDSCAPE_HEIGHT);
  }

  public setupContexts() {
    this.gameCtx.imageSmoothingEnabled = false;
    this.hudCtx.imageSmoothingEnabled = false;
  }

  private initStars(width: number, height: number) {
    this.stars = [];
    const C = CONFIG.COLORS;

    // Layer 1: 25 stars, 10 px/s, 1px, bone-dim
    for (let i = 0; i < 25; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 10,
        size: 1,
        color: C.BONE_DIM,
      });
    }

    // Layer 2: 20 stars, 22 px/s, 1px, bone-dim
    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 22,
        size: 1,
        color: C.BONE_DIM,
      });
    }

    // Layer 3: 12 stars, 45 px/s, 2px, amber
    for (let i = 0; i < 12; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 45,
        size: 2,
        color: C.AMBER,
      });
    }
  }

  public onResize(width: number, height: number) {
    this.setupContexts();
    this.initStars(width, height);
  }

  private getAtlas(): HTMLCanvasElement {
    if (!this.atlasCanvas) {
      this.atlasCanvas = getSpriteAtlas();
    }
    return this.atlasCanvas;
  }

  private drawSprite(
    rect: SpriteRect,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number,
    flashWhite = false
  ) {
    const atlas = this.getAtlas();
    const destW = dw ?? rect.w;
    const destH = dh ?? rect.h;

    const floorX = Math.floor(dx);
    const floorY = Math.floor(dy);

    if (flashWhite) {
      // Draw sprite silhouette in pure bone white
      this.gameCtx.drawImage(atlas, rect.x, rect.y, rect.w, rect.h, floorX, floorY, destW, destH);
      this.gameCtx.save();
      this.gameCtx.globalCompositeOperation = 'source-atop';
      this.gameCtx.fillStyle = CONFIG.COLORS.BONE;
      this.gameCtx.fillRect(floorX, floorY, destW, destH);
      this.gameCtx.restore();
    } else {
      this.gameCtx.drawImage(atlas, rect.x, rect.y, rect.w, rect.h, floorX, floorY, destW, destH);
    }
  }

  // --- Main Draw Method ---
  public draw(world: World, alpha: number) {
    const ctx = this.gameCtx;
    const width = world.width;
    const height = world.height;
    const C = CONFIG.COLORS;

    // 1. Clear Game Canvas
    ctx.fillStyle = C.VOID;
    ctx.fillRect(0, 0, width, height);

    // 2. Parallax Starfield
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed * (CONFIG.STEP * world.camera.timeScale);
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }

    // 3. Save Context & Apply Screen Shake
    ctx.save();
    if (world.camera.offsetX !== 0 || world.camera.offsetY !== 0) {
      ctx.translate(Math.floor(world.camera.offsetX), Math.floor(world.camera.offsetY));
    }

    // 4. Draw Power-Up Drops
    for (let i = 0; i < world.drops.length; i++) {
      const d = world.drops[i];
      if (!d.alive) continue;
      const x = d.prevX + (d.x - d.prevX) * alpha;
      const y = d.prevY + (d.y - d.prevY) * alpha;

      let rect = ATLAS_RECTS.dropSpread;
      if (d.type === 'RAPID') rect = ATLAS_RECTS.dropRapid;
      if (d.type === 'SHIELD') rect = ATLAS_RECTS.dropShield;
      if (d.type === 'PULSE') rect = ATLAS_RECTS.dropPulse;

      this.drawSprite(rect, x, y);

      if (this.showHitboxes) {
        const box = d.getHitbox();
        ctx.strokeStyle = '#00ff00';
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }
    }

    // 5. Draw Enemies
    for (let i = 0; i < world.enemies.length; i++) {
      const e = world.enemies[i];
      if (!e.alive) continue;
      const x = e.prevX + (e.x - e.prevX) * alpha;
      const y = e.prevY + (e.y - e.prevY) * alpha;
      const flash = e.flashTimer > 0;

      if (e.type === 'DRONE') {
        const rect = ATLAS_RECTS.drone[e.animFrame % 2];
        this.drawSprite(rect, x, y, undefined, undefined, flash);
      } else if (e.type === 'SKIMMER') {
        const rect = ATLAS_RECTS.skimmer[e.animFrame % 2];
        this.drawSprite(rect, x, y, undefined, undefined, flash);
      } else if (e.type === 'LANCER') {
        const rect = ATLAS_RECTS.lancer[e.animFrame % 2];
        this.drawSprite(rect, x, y, undefined, undefined, flash);
      } else if (e.type === 'MINE') {
        const rect = ATLAS_RECTS.mine[e.animFrame % 4];
        this.drawSprite(rect, x, y, undefined, undefined, flash);
      }

      if (this.highContrast) {
        ctx.strokeStyle = C.BONE;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.floor(x), Math.floor(y), e.width, e.height);
      }

      if (this.showHitboxes) {
        const box = e.getHitbox();
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }
    }

    // 6. Draw Warden Boss
    if (world.boss.alive) {
      const b = world.boss;
      const x = b.prevX + (b.x - b.prevX) * alpha;
      const y = b.prevY + (b.y - b.prevY) * alpha;
      const phaseIdx = Math.max(0, Math.min(2, b.phase - 1));
      const rect = ATLAS_RECTS.warden[phaseIdx];
      const flash = b.flashTimer > 0 || b.phaseTransitionTimer > 0;

      this.drawSprite(rect, x, y, undefined, undefined, flash);

      // Boss HP Bar
      const barW = width - 40;
      const barH = 3;
      const barX = 20;
      const barY = 4;
      const hpProgress = Math.max(0, b.hp / b.maxHp);

      ctx.fillStyle = C.VOID_LIFT;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = b.phase === 3 ? C.CORAL : b.phase === 2 ? C.AMBER : C.AQUA;
      ctx.fillRect(barX, barY, Math.floor(barW * hpProgress), barH);

      if (this.showHitboxes) {
        const box = b.getHitbox();
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }
    }

    // 7. Draw Player Bullets
    for (let i = 0; i < world.playerBullets.length; i++) {
      const pb = world.playerBullets[i];
      if (!pb.alive) continue;
      const x = pb.prevX + (pb.x - pb.prevX) * alpha;
      const y = pb.prevY + (pb.y - pb.prevY) * alpha;
      this.drawSprite(ATLAS_RECTS.playerBullet, x, y);
    }

    // 8. Draw Enemy Bullets
    for (let i = 0; i < world.enemyBullets.length; i++) {
      const eb = world.enemyBullets[i];
      if (!eb.alive) continue;
      const x = eb.prevX + (eb.x - eb.prevX) * alpha;
      const y = eb.prevY + (eb.y - eb.prevY) * alpha;
      const rect = ATLAS_RECTS.enemyBullet[eb.animFrame % 2];
      this.drawSprite(rect, x, y);
    }

    // 9. Draw Player Ship
    if (world.player.alive) {
      const p = world.player;
      const x = p.prevX + (p.x - p.prevX) * alpha;
      const y = p.prevY + (p.y - p.prevY) * alpha;

      // Invulnerability 12Hz flashing
      const shouldDraw = !p.isInvulnerable || Math.floor(world.player.invulnerableTimer * 24) % 2 === 0;

      if (shouldDraw) {
        // Thrusters below ship
        const thrusterRect = ATLAS_RECTS.thruster[p.thrusterFrame];
        this.drawSprite(thrusterRect, x + 4, y + 14);

        // Player Ship
        const shipRect = ATLAS_RECTS.player[p.bankFrame];
        this.drawSprite(shipRect, x, y + p.recoilY);

        // Muzzle Flash
        if (p.muzzleFlashTimer > 0) {
          ctx.fillStyle = C.AMBER;
          ctx.fillRect(Math.floor(x + 6), Math.floor(y - 3), 4, 3);
        }

        // Shield Aura
        if (p.hasShield) {
          ctx.strokeStyle = C.AQUA;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(Math.floor(x + 8), Math.floor(y + 8), 11, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (this.showHitboxes) {
          const box = p.getHitbox();
          ctx.strokeStyle = '#00ffff';
          ctx.strokeRect(box.x, box.y, box.w, box.h);
        }
      }
    }

    // 10. Draw Particles
    for (let i = 0; i < world.particles.particles.length; i++) {
      const pt = world.particles.particles[i];
      if (!pt.alive) continue;

      if (pt.type === 'SPARK') {
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), pt.size, pt.size);
      } else if (pt.type === 'EXPLOSION') {
        const expRect = ATLAS_RECTS.explosion[pt.frame];
        this.drawSprite(expRect, pt.x, pt.y);
      } else if (pt.type === 'RING') {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(Math.floor(pt.x), Math.floor(pt.y), pt.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (pt.type === 'PULSE_WASH') {
        const alphaWash = (pt.life / pt.maxLife) * 0.45;
        ctx.fillStyle = `rgba(34, 228, 200, ${alphaWash})`;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 11. Red / Coral Hit Flash
    if (world.camera.hitFlashTimer > 0) {
      const flashAlpha = (world.camera.hitFlashTimer / world.camera.hitFlashDuration) * 0.3;
      ctx.fillStyle = `rgba(255, 77, 109, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 12. Wave Banner (slides in and out)
    if (world.spawner.showWaveBanner && world.spawner.bannerText) {
      const progress = 1 - world.spawner.waveClearTimer / CONFIG.FX.WAVE_BANNER_TIME;
      let bannerX = width / 2;
      if (progress < 0.2) {
        // Slide in
        bannerX = width + 100 - (progress / 0.2) * (width / 2 + 100);
      } else if (progress > 0.8) {
        // Slide out
        bannerX = width / 2 - ((progress - 0.8) / 0.2) * (width / 2 + 100);
      }

      ctx.font = '12px "Silkscreen", "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.AMBER;
      ctx.fillText(world.spawner.bannerText, Math.floor(bannerX), Math.floor(height / 2));
    }

    ctx.restore();

    // 13. Render HUD
    this.drawHUD(world);
  }

  // --- Dedicated HUD Drawer ---
  public drawHUD(world: World) {
    const ctx = this.hudCtx;
    const width = world.width;
    const height = world.height;
    const isPortrait = world.isPortrait;
    const C = CONFIG.COLORS;

    ctx.clearRect(0, 0, width, height);

    ctx.font = '10px "VT323", monospace';
    ctx.textBaseline = 'top';

    const scoreStr = `SCORE ${formatScore(world.score)}`;
    const bestStr = `BEST ${formatScore(world.bestScore)}`;
    const sectorStr = formatSector(world.spawner.sector, world.spawner.wave);

    if (!isPortrait) {
      // Landscape HUD
      // Left: Score
      ctx.textAlign = 'left';
      ctx.fillStyle = C.AMBER;
      ctx.fillText(scoreStr, 6, 4);

      // Center: Combo
      if (world.combo >= 2) {
        ctx.textAlign = 'center';
        ctx.font = world.comboJustPopped ? '12px "VT323", monospace' : '10px "VT323", monospace';
        ctx.fillStyle = C.AMBER;
        ctx.fillText(`x${world.combo}`, width / 2, 4);
        world.comboJustPopped = false;
      }

      // Right: Sector & Lives
      ctx.textAlign = 'right';
      ctx.font = '10px "VT323", monospace';
      ctx.fillStyle = C.BONE;
      ctx.fillText(sectorStr, width - 42, 4);

      // Lives as ship icons (pips)
      for (let i = 0; i < world.player.lives; i++) {
        ctx.fillStyle = C.CORAL;
        ctx.fillRect(width - 36 + i * 8, 4, 5, 6);
      }

      // Bottom Left: Best
      ctx.textAlign = 'left';
      ctx.fillStyle = C.BONE_DIM;
      ctx.fillText(bestStr, 6, height - 12);

      // Bottom Right: Pulses
      ctx.textAlign = 'right';
      ctx.fillStyle = C.AQUA;
      let pulseStr = 'PULSE ';
      for (let i = 0; i < world.player.pulses; i++) {
        pulseStr += '()';
      }
      ctx.fillText(pulseStr, width - 6, height - 12);
    } else {
      // Portrait HUD
      // Top Row: Score & Lives
      ctx.textAlign = 'left';
      ctx.fillStyle = C.AMBER;
      ctx.fillText(scoreStr, 6, 4);

      // Lives
      for (let i = 0; i < world.player.lives; i++) {
        ctx.fillStyle = C.CORAL;
        ctx.fillRect(width - 28 + i * 7, 4, 5, 6);
      }

      // Second Row: Combo & Sector
      if (world.combo >= 2) {
        ctx.textAlign = 'left';
        ctx.fillStyle = C.AMBER;
        ctx.fillText(`x${world.combo}`, 6, 16);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = C.BONE;
      ctx.fillText(sectorStr, width - 6, 16);

      // Bottom: Best & Pulses
      ctx.textAlign = 'left';
      ctx.fillStyle = C.BONE_DIM;
      ctx.fillText(bestStr, 6, height - 14);

      ctx.textAlign = 'right';
      ctx.fillStyle = C.AQUA;
      let pulseStr = 'PULSE ';
      for (let i = 0; i < world.player.pulses; i++) {
        pulseStr += '()';
      }
      ctx.fillText(pulseStr, width - 6, height - 14);
    }
  }
}
