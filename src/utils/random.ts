export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed >>> 0;
  }

  public next(): number {
    this.seed = (this.seed + 0x6d2b79f5) >>> 0;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public pick<T>(arr: T[], seedOffset: number = 0): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  public shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public reset(newSeed?: number): void {
    this.seed = (newSeed ?? Date.now()) >>> 0;
  }
}

export function createSeededRandom(seed: number): SeededRandom {
  return new SeededRandom(seed);
}

export function hashStringToSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
