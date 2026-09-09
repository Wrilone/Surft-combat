import { CONFIG, EnemyTypeName } from '../config';
import { SeededRNG, globalRNG } from '../utils/random';

export interface SpawnItem {
  type: EnemyTypeName;
  normalizedX: number; // 0..1 (e.g. 0.1 to 0.9)
  delay: number; // seconds after wave start
}

export class WaveSpawner {
  public sector = 1;
  public wave = 1;
  public isWaveActive = false;
  public isBossWave = false;
  public waveTimer = 0;
  public pendingSpawns: SpawnItem[] = [];
  public waveClearTimer = 0;
  public showWaveBanner = false;
  public bannerText = '';

  public speedMultiplier = 1.0;
  public fireMultiplier = 1.0;
  public rng: SeededRNG;

  constructor(rng = globalRNG) {
    this.rng = rng;
  }

  public init() {
    this.sector = 1;
    this.wave = 1;
    this.isWaveActive = false;
    this.isBossWave = false;
    this.waveTimer = 0;
    this.pendingSpawns = [];
    this.waveClearTimer = 0;
    this.showWaveBanner = false;
    this.bannerText = '';
    this.computeMultipliers();
  }

  private computeMultipliers() {
    const sc = CONFIG.SCALING;
    this.speedMultiplier = Math.min(
      sc.SPEED_MULT_CAP,
      sc.SPEED_MULT_BASE + (this.sector - 1) * sc.SPEED_MULT_RATE
    );
    this.fireMultiplier = Math.min(
      sc.FIRE_MULT_CAP,
      sc.FIRE_MULT_BASE + (this.sector - 1) * sc.FIRE_MULT_RATE
    );
  }

  public startSector(sector: number) {
    this.sector = sector;
    this.wave = 1;
    this.computeMultipliers();
    this.startWave(1);
  }

  public startWave(waveNumber: number) {
    this.wave = waveNumber;
    this.isWaveActive = true;
    this.waveTimer = 0;
    this.pendingSpawns = [];
    this.isBossWave = this.wave === CONFIG.SCALING.WAVES_PER_SECTOR;

    if (this.isBossWave) {
      this.bannerText = `WARNING: BOSS DETECTED`;
      this.showWaveBanner = true;
      this.waveClearTimer = CONFIG.FX.WAVE_BANNER_TIME;
      // Boss is spawned directly by World
      return;
    }

    this.bannerText = `WAVE ${this.sector}-${this.wave}`;
    this.showWaveBanner = true;
    this.waveClearTimer = CONFIG.FX.WAVE_BANNER_TIME;

    // Calculate count
    const sc = CONFIG.SCALING;
    const enemyCount = Math.min(
      sc.ENEMY_COUNT_CAP,
      sc.BASE_ENEMY_COUNT + (this.sector - 1) * sc.ENEMY_COUNT_PER_SECTOR + (this.wave - 1)
    );

    // Build spawn list based on introduced enemy types
    const availableTypes: EnemyTypeName[] = ['DRONE'];
    if (this.sector >= 1 && this.wave >= 2) availableTypes.push('SKIMMER');
    if (this.sector >= 1 && this.wave >= 4) availableTypes.push('LANCER');
    if (this.sector >= 2 && this.wave >= 2) availableTypes.push('MINE');

    // Generate patterns: stagger across columns with slight delays
    const columns = 5;
    for (let i = 0; i < enemyCount; i++) {
      const type = this.rng.choice(availableTypes);
      const col = (i % columns) + 0.5;
      const normalizedX = Math.max(0.1, Math.min(0.9, col / columns + (this.rng.next() - 0.5) * 0.1));
      const delay = Math.floor(i / columns) * 1.5 + (i % columns) * 0.3;

      this.pendingSpawns.push({
        type,
        normalizedX,
        delay,
      });
    }

    // Sort by delay
    this.pendingSpawns.sort((a, b) => a.delay - b.delay);
  }

  public update(
    dt: number,
    onSpawn: (type: EnemyTypeName, normalizedX: number, speedMult: number, fireMult: number) => void
  ) {
    if (this.showWaveBanner) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        this.showWaveBanner = false;
      }
    }

    if (!this.isWaveActive || this.isBossWave) return;

    this.waveTimer += dt;

    while (this.pendingSpawns.length > 0 && this.pendingSpawns[0].delay <= this.waveTimer) {
      const item = this.pendingSpawns.shift()!;
      onSpawn(item.type, item.normalizedX, this.speedMultiplier, this.fireMultiplier);
    }
  }

  public isSpawningComplete(): boolean {
    return this.pendingSpawns.length === 0;
  }
}
