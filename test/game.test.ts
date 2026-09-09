import { describe, it, expect, beforeEach } from 'vitest';
import { checkAABB, SpatialHashGrid } from '../game/systems/collision';
import { World } from '../game/World';
import { createInputState, InputState } from '../game/input/InputState';
import { CONFIG } from '../game/config';
import { formatScore, formatSector } from '../lib/format';
import { DEFAULT_SAVE } from '../lib/storage';
import { SeededRNG } from '../game/utils/random';

describe('Format Helpers', () => {
  it('formats score with 6-digit padding and comma', () => {
    expect(formatScore(0)).toBe('000,000');
    expect(formatScore(100)).toBe('000,100');
    expect(formatScore(12450)).toBe('012,450');
    expect(formatScore(999999)).toBe('999,999');
  });

  it('formats sector and wave', () => {
    expect(formatSector(1, 1)).toBe('SECTOR 1-1');
    expect(formatSector(3, 2)).toBe('SECTOR 3-2');
  });
});

describe('Collision Detection', () => {
  it('detects AABB overlapping boxes', () => {
    const boxA = { x: 10, y: 10, w: 16, h: 16 };
    const boxB = { x: 20, y: 20, w: 16, h: 16 };
    const boxC = { x: 50, y: 50, w: 16, h: 16 };

    expect(checkAABB(boxA, boxB)).toBe(true);
    expect(checkAABB(boxA, boxC)).toBe(false);
  });

  it('spatial hash correctly retrieves candidate colliders', () => {
    const grid = new SpatialHashGrid(32);
    const world = new World();
    world.resetGame();

    world.enemies[0].spawn('DRONE', 50, 50);
    world.enemies[1].spawn('DRONE', 200, 100);

    grid.insert(world.enemies[0]);
    grid.insert(world.enemies[1]);

    const queryBullet = world.playerBullets[0];
    queryBullet.spawn(52, 52, 0, -200);

    const candidates = new Set<any>();
    grid.getPotentialColliders(queryBullet, candidates);

    expect(candidates.has(world.enemies[0])).toBe(true);
    expect(candidates.has(world.enemies[1])).toBe(false);
  });
});

describe('World Simulation & Game Mechanics', () => {
  let world: World;

  beforeEach(() => {
    world = new World(1000);
    world.resetGame(1000);
  });

  it('initializes with correct lives, pulses, and zero score', () => {
    expect(world.score).toBe(0);
    expect(world.bestScore).toBe(1000);
    expect(world.player.lives).toBe(CONFIG.PLAYER.START_LIVES);
    expect(world.player.pulses).toBe(CONFIG.PLAYER.START_PULSES);
    expect(world.combo).toBe(1);
  });

  it('applies powerups correctly to the player', () => {
    world.player.applyPowerUp('SHIELD');
    expect(world.player.hasShield).toBe(true);

    world.player.applyPowerUp('SPREAD');
    expect(world.player.spreadTimer).toBe(CONFIG.PLAYER.SPREAD_DURATION);

    world.player.applyPowerUp('RAPID');
    expect(world.player.rapidTimer).toBe(CONFIG.PLAYER.RAPID_DURATION);

    const prevPulses = world.player.pulses;
    world.player.applyPowerUp('PULSE');
    expect(world.player.pulses).toBe(prevPulses + 1);
  });

  it('shield absorbs one hit without losing life', () => {
    world.player.applyPowerUp('SHIELD');
    world.player.isInvulnerable = false;
    world.player.invulnerableTimer = 0;

    const lostLife = world.player.takeHit();
    expect(lostLife).toBe(false);
    expect(world.player.hasShield).toBe(false);
    expect(world.player.lives).toBe(CONFIG.PLAYER.START_LIVES);
  });

  it('pulse clears enemy bullets and damages enemies', () => {
    world.spawnEnemy('DRONE', 0.5, 1, 1);
    world.spawnEnemyBullet(100, 100, 0, 50);

    expect(world.enemyBullets.some((b) => b.alive)).toBe(true);
    const initialPulses = world.player.pulses;

    world.triggerPulse();

    expect(world.player.pulses).toBe(initialPulses - 1);
    expect(world.enemyBullets.some((b) => b.alive)).toBe(false);
  });
});

describe('Determinism Test', () => {
  it('runs 600 simulated steps with scripted tape and produces deterministic state', () => {
    function runSimulation(scriptSeed: number) {
      const simWorld = new World(0, new SeededRNG(scriptSeed));
      simWorld.resetGame();

      // Scripted input sequence
      for (let step = 0; step < 600; step++) {
        const input: InputState = createInputState();

        // Alternate moving left/right and shooting
        if ((step % 120) < 60) {
          input.moveX = 1;
        } else {
          input.moveX = -1;
        }

        if (step % 10 === 0) {
          input.firing = true;
        }

        if (step === 300) {
          input.pulse = true;
        }

        simWorld.update(CONFIG.STEP, input);
      }

      return {
        score: simWorld.score,
        lives: simWorld.player.lives,
        playerX: Math.round(simWorld.player.x * 100) / 100,
        playerY: Math.round(simWorld.player.y * 100) / 100,
      };
    }

    const run1 = runSimulation(42);
    const run2 = runSimulation(42);

    expect(run1).toEqual(run2);
  });
});
