/**
 * Independent audit of src/data/puzzles.ts.
 *
 * Checks, for every shipped puzzle: the solution is a legal complete grid, the
 * puzzle is a subset of it, the puzzle has exactly one solution, the given count
 * is accurate, and no row, column or box is left almost empty.
 *
 * Run with: node scripts/verifyPuzzles.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(HERE, '../src/data/puzzles.ts');

const source = readFileSync(DATA_FILE, 'utf8');
const entries = [...source.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((s) => s.includes('|'));

const ALL = 0x1ff;
const ROW_OF = new Int8Array(81);
const COL_OF = new Int8Array(81);
const BOX_OF = new Int8Array(81);
for (let i = 0; i < 81; i++) {
  ROW_OF[i] = (i / 9) | 0;
  COL_OF[i] = i % 9;
  BOX_OF[i] = ((ROW_OF[i] / 3) | 0) * 3 + ((COL_OF[i] / 3) | 0);
}

function popcount(x) {
  x -= (x >> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (x * 0x01010101) >> 24;
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
      g[best] = 32 - Math.clz32(bit);
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

function isLegalComplete(grid) {
  for (let unit = 0; unit < 9; unit++) {
    let rowMask = 0;
    let colMask = 0;
    let boxMask = 0;
    for (let k = 0; k < 9; k++) {
      const rowCell = grid[unit * 9 + k];
      const colCell = grid[k * 9 + unit];
      const br = ((unit / 3) | 0) * 3 + ((k / 3) | 0);
      const bc = (unit % 3) * 3 + (k % 3);
      const boxCell = grid[br * 9 + bc];
      if (!rowCell || !colCell || !boxCell) return false;
      rowMask |= 1 << (rowCell - 1);
      colMask |= 1 << (colCell - 1);
      boxMask |= 1 << (boxCell - 1);
    }
    if (rowMask !== ALL || colMask !== ALL || boxMask !== ALL) return false;
  }
  return true;
}

const failures = [];
let minUnitGivens = 81;
const perLevel = new Map();

for (const entry of entries) {
  const [levelRaw, numberRaw, givenRaw, puzzleStr, solutionStr] = entry.split('|');
  const id = `L${levelRaw}_P${numberRaw}`;
  const level = Number(levelRaw);

  if (puzzleStr?.length !== 81 || solutionStr?.length !== 81) {
    failures.push(`${id}: grids must be 81 characters`);
    continue;
  }

  const puzzle = Int8Array.from(puzzleStr, (ch) => ch.charCodeAt(0) - 48);
  const solution = Int8Array.from(solutionStr, (ch) => ch.charCodeAt(0) - 48);

  if (!isLegalComplete(solution)) failures.push(`${id}: solution is not a legal complete grid`);

  let givens = 0;
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] === 0) continue;
    givens++;
    if (puzzle[i] !== solution[i]) failures.push(`${id}: given at cell ${i} contradicts the solution`);
  }
  if (givens !== Number(givenRaw)) failures.push(`${id}: givenCount says ${givenRaw} but grid has ${givens}`);

  const solutions = countSolutions(puzzle, 2);
  if (solutions !== 1) failures.push(`${id}: has ${solutions >= 2 ? 'multiple' : 'no'} solutions`);

  const rows = new Int8Array(9);
  const cols = new Int8Array(9);
  const boxes = new Int8Array(9);
  for (let i = 0; i < 81; i++) {
    if (puzzle[i] === 0) continue;
    rows[ROW_OF[i]]++;
    cols[COL_OF[i]]++;
    boxes[BOX_OF[i]]++;
  }
  const worst = Math.min(...rows, ...cols, ...boxes);
  if (worst < 2) failures.push(`${id}: a row, column or box only has ${worst} digit(s)`);
  minUnitGivens = Math.min(minUnitGivens, worst);

  const stats = perLevel.get(level) ?? { level, puzzles: 0, minGivens: 81, maxGivens: 0, worstUnit: 9 };
  stats.puzzles++;
  stats.minGivens = Math.min(stats.minGivens, givens);
  stats.maxGivens = Math.max(stats.maxGivens, givens);
  stats.worstUnit = Math.min(stats.worstUnit, worst);
  perLevel.set(level, stats);
}

console.log(`Audited ${entries.length} puzzles`);
console.table([...perLevel.values()].sort((a, b) => a.level - b.level));
console.log(`Fewest digits in any single row/column/box: ${minUnitGivens}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) found:`);
  for (const f of failures.slice(0, 20)) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('\nAll puzzles are uniquely solvable, consistent and balanced.');
