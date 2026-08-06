/**
 * Offline Sudoku puzzle generator.
 *
 * Produces src/data/puzzles.ts with 4 packs × 10 levels × 20 puzzles = 800.
 * Every puzzle is uniquely solvable with a balanced spread of givens.
 *
 * Run with: node scripts/generatePuzzles.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(HERE, '../src/data/puzzles.ts');

const PACK_COUNT = 4;
const LEVELS_PER_PACK = 10;
const LEVEL_COUNT = PACK_COUNT * LEVELS_PER_PACK; // 40
const PUZZLES_PER_LEVEL = 20;

/** Difficulty band 1–10 (cycled inside every pack). Lower givens = harder. */
const TARGET_GIVENS = {
  1: 50,
  2: 46,
  3: 42,
  4: 39,
  5: 37,
  6: 35,
  7: 33,
  8: 32,
  9: 31,
  10: 30,
};

const MIN_PER_UNIT = { 1: 4, 2: 4, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3 };
const SINGLES_ONLY_MAX_DIFFICULTY = 3;
const ATTEMPTS_PER_PUZZLE = 14;

const difficultyOf = (level) => ((level - 1) % LEVELS_PER_PACK) + 1;

const boxOf = (r, c) => ((r / 3) | 0) * 3 + ((c / 3) | 0);
const ROW_OF = new Int8Array(81);
const COL_OF = new Int8Array(81);
const BOX_OF = new Int8Array(81);
for (let i = 0; i < 81; i++) {
  ROW_OF[i] = (i / 9) | 0;
  COL_OF[i] = i % 9;
  BOX_OF[i] = boxOf(ROW_OF[i], COL_OF[i]);
}

const ALL = 0x1ff;

function popcount(x) {
  x -= (x >> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >> 24;
}

const bitToDigit = (bit) => 32 - Math.clz32(bit);

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, rng) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomSolution(rng) {
  const g = new Int8Array(81);
  const rows = new Int32Array(9);
  const cols = new Int32Array(9);
  const boxes = new Int32Array(9);

  const fill = (i) => {
    if (i === 81) return true;
    const r = ROW_OF[i];
    const c = COL_OF[i];
    const b = BOX_OF[i];
    const mask = ~(rows[r] | cols[c] | boxes[b]) & ALL;
    if (mask === 0) return false;

    const bits = [];
    for (let m = mask; m; ) {
      const bit = m & -m;
      m ^= bit;
      bits.push(bit);
    }

    for (const bit of shuffled(bits, rng)) {
      g[i] = bitToDigit(bit);
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      if (fill(i + 1)) return true;
      g[i] = 0;
      rows[r] ^= bit;
      cols[c] ^= bit;
      boxes[b] ^= bit;
    }
    return false;
  };

  fill(0);
  return g;
}

function countSolutions(grid, limit) {
  const g = Int8Array.from(grid);
  const rows = new Int32Array(9);
  const cols = new Int32Array(9);
  const boxes = new Int32Array(9);
  let empty = 0;

  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (v === 0) {
      empty++;
      continue;
    }
    const bit = 1 << (v - 1);
    rows[ROW_OF[i]] |= bit;
    cols[COL_OF[i]] |= bit;
    boxes[BOX_OF[i]] |= bit;
  }

  let found = 0;

  const search = (remaining) => {
    if (remaining === 0) {
      found++;
      return;
    }

    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const mask = ~(rows[ROW_OF[i]] | cols[COL_OF[i]] | boxes[BOX_OF[i]]) & ALL;
      if (mask === 0) return;
      const count = popcount(mask);
      if (count < bestCount) {
        bestCount = count;
        bestMask = mask;
        best = i;
        if (count === 1) break;
      }
    }

    const r = ROW_OF[best];
    const c = COL_OF[best];
    const b = BOX_OF[best];
    for (let m = bestMask; m; ) {
      const bit = m & -m;
      m ^= bit;
      g[best] = bitToDigit(bit);
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      search(remaining - 1);
      g[best] = 0;
      rows[r] ^= bit;
      cols[c] ^= bit;
      boxes[b] ^= bit;
      if (found >= limit) return;
    }
  };

  search(empty);
  return found;
}

function solvableWithSingles(grid) {
  const g = Int8Array.from(grid);
  const rows = new Int32Array(9);
  const cols = new Int32Array(9);
  const boxes = new Int32Array(9);
  let empty = 0;

  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (v === 0) {
      empty++;
      continue;
    }
    const bit = 1 << (v - 1);
    rows[ROW_OF[i]] |= bit;
    cols[COL_OF[i]] |= bit;
    boxes[BOX_OF[i]] |= bit;
  }

  const place = (i, bit) => {
    g[i] = bitToDigit(bit);
    rows[ROW_OF[i]] |= bit;
    cols[COL_OF[i]] |= bit;
    boxes[BOX_OF[i]] |= bit;
    empty--;
  };

  const candidatesAt = (i) => ~(rows[ROW_OF[i]] | cols[COL_OF[i]] | boxes[BOX_OF[i]]) & ALL;

  while (empty > 0) {
    let progress = false;

    for (let i = 0; i < 81; i++) {
      if (g[i] !== 0) continue;
      const mask = candidatesAt(i);
      if (mask === 0) return false;
      if (popcount(mask) === 1) {
        place(i, mask);
        progress = true;
      }
    }
    if (progress) continue;

    const units = [];
    for (let r = 0; r < 9; r++) {
      const cells = [];
      for (let c = 0; c < 9; c++) cells.push(r * 9 + c);
      units.push(cells);
    }
    for (let c = 0; c < 9; c++) {
      const cells = [];
      for (let r = 0; r < 9; r++) cells.push(r * 9 + c);
      units.push(cells);
    }
    for (let b = 0; b < 9; b++) {
      const cells = [];
      const br = ((b / 3) | 0) * 3;
      const bc = (b % 3) * 3;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push((br + r) * 9 + bc + c);
      units.push(cells);
    }

    for (const unit of units) {
      for (let d = 0; d < 9; d++) {
        const bit = 1 << d;
        let spot = -1;
        let taken = false;
        for (const i of unit) {
          if (g[i] !== 0) {
            if (g[i] === d + 1) {
              taken = true;
              break;
            }
            continue;
          }
          if (candidatesAt(i) & bit) {
            if (spot !== -1) {
              spot = -2;
              break;
            }
            spot = i;
          }
        }
        if (taken || spot === -2) continue;
        if (spot === -1) return false;
        place(spot, bit);
        progress = true;
      }
    }

    if (!progress) return false;
  }

  return true;
}

function dig(solution, rng, { target, minPerUnit, singlesOnly }) {
  const g = Int8Array.from(solution);
  const rowCount = new Int8Array(9).fill(9);
  const colCount = new Int8Array(9).fill(9);
  const boxCount = new Int8Array(9).fill(9);
  let givens = 81;

  for (const i of shuffled([...Array(81).keys()], rng)) {
    if (givens <= target) break;

    const r = ROW_OF[i];
    const c = COL_OF[i];
    const b = BOX_OF[i];
    if (rowCount[r] <= minPerUnit || colCount[c] <= minPerUnit || boxCount[b] <= minPerUnit) {
      continue;
    }

    const value = g[i];
    g[i] = 0;

    const ok = singlesOnly ? solvableWithSingles(g) : countSolutions(g, 2) === 1;
    if (!ok) {
      g[i] = value;
      continue;
    }

    givens--;
    rowCount[r]--;
    colCount[c]--;
    boxCount[b]--;
  }

  return { grid: g, givens };
}

const encode = (grid) => Array.from(grid).join('');

function buildPuzzle(level, puzzleNumber) {
  const difficulty = difficultyOf(level);
  const target = TARGET_GIVENS[difficulty];
  const minPerUnit = MIN_PER_UNIT[difficulty];
  const singlesOnly = difficulty <= SINGLES_ONLY_MAX_DIFFICULTY;

  let best = null;

  for (let attempt = 0; attempt < ATTEMPTS_PER_PUZZLE; attempt++) {
    // Distinct seed space per absolute level so packs never repeat.
    const rng = makeRng(level * 1_000_003 + puzzleNumber * 7919 + attempt * 104729 + 17);
    const solution = randomSolution(rng);
    const result = dig(solution, rng, { target, minPerUnit, singlesOnly });

    if (!best || result.givens < best.givens) {
      best = { ...result, solution };
    }
    if (result.givens <= target) break;
  }

  if (countSolutions(best.grid, 2) !== 1) {
    throw new Error(`L${level}_P${puzzleNumber}: puzzle is not uniquely solvable`);
  }

  return {
    id: `L${level}_P${puzzleNumber}`,
    level,
    puzzleNumber,
    puzzle: encode(best.grid),
    solution: encode(best.solution),
    givenCount: best.givens,
  };
}

const started = Date.now();
const all = [];
const statsByLevel = [];

for (let level = 1; level <= LEVEL_COUNT; level++) {
  const difficulty = difficultyOf(level);
  const givens = [];
  for (let n = 1; n <= PUZZLES_PER_LEVEL; n++) {
    const puzzle = buildPuzzle(level, n);
    all.push(puzzle);
    givens.push(puzzle.givenCount);
  }
  statsByLevel.push({
    level,
    pack: Math.ceil(level / LEVELS_PER_PACK),
    difficulty,
    target: TARGET_GIVENS[difficulty],
    min: Math.min(...givens),
    max: Math.max(...givens),
    avg: (givens.reduce((a, b) => a + b, 0) / givens.length).toFixed(1),
  });
  if (level % 5 === 0) {
    console.log(`… level ${level}/${LEVEL_COUNT} (${all.length} puzzles)`);
  }
}

const lines = all
  .map((p) => `  '${p.level}|${p.puzzleNumber}|${p.givenCount}|${p.puzzle}|${p.solution}',`)
  .join('\n');

const file = `// AUTO-GENERATED by scripts/generatePuzzles.mjs — do not edit by hand.
// Each entry is "level|puzzleNumber|givenCount|puzzle|solution", where the two
// grids are 81 digits read row by row and 0 marks an empty cell.
// ${PACK_COUNT} packs × ${LEVELS_PER_PACK} levels × ${PUZZLES_PER_LEVEL} = ${all.length} puzzles.
// Every puzzle has exactly one solution and keeps at least
// ${Math.min(...Object.values(MIN_PER_UNIT))} digits in every row, column and box.

export const PACKED_PUZZLES: readonly string[] = [
${lines}
];
`;

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, file, 'utf8');

console.log(`Generated ${all.length} puzzles in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.table(statsByLevel);
console.log(`Written to ${OUT_FILE}`);
