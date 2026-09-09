/**
 * Simple mulberry32 seeded pseudo-random number generator for deterministic runs.
 */
export class SeededRNG {
  private s: number;

  constructor(seed = 123456789) {
    this.s = seed;
  }

  public setSeed(seed: number) {
    this.s = seed;
  }

  public next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export const globalRNG = new SeededRNG(42);
