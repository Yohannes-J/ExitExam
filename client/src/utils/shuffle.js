/**
 * Seeded pseudo-random number generator (mulberry32).
 * Same seed always produces the same sequence.
 */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Convert a string (userId) to a numeric seed.
 */
function strToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Shuffle an array using a deterministic seed.
 * Same userId + same array always produces the same shuffled order.
 * Returns a NEW array — does not mutate the original.
 */
export function seededShuffle(array, userId) {
  const rand = mulberry32(strToSeed(userId));
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
