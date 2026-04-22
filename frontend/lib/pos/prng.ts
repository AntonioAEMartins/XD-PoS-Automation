// Ports deterministic RNG helpers used by the seed generators.

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function rng(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededInt(
  rng: () => number,
  min: number,
  max: number,
): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

export function seededPick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error("seededPick received an empty array.");
  }
  const idx = Math.floor(rng() * arr.length);
  return arr[idx] as T;
}
