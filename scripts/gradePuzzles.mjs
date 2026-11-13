/**
 * Grades every shipped puzzle by the hardest technique it demands.
 *
 * Solves the catalogue in src/data/puzzles.ts with the human-style solver and
 * prints, level by level, how many puzzles need each technique. It also checks
 * that the solver reaches the stored solution, so a wrong deduction cannot hide.
 *
 * Run with: node scripts/gradePuzzles.mjs
 * Needs Node 22.18 or later, which imports TypeScript files directly.
 */
import { readFileSync } from 'node:fs';
import { TECHNIQUES, solveWithTechniques } from '../src/solver/humanSolver.ts';

const source = readFileSync(new URL('../src/data/puzzles.ts', import.meta.url), 'utf8');
const entries = [...source.matchAll(/'(\d+)\|(\d+)\|(\d+)\|(\d{81})\|(\d{81})'/g)].map((m) => ({
  level: Number(m[1]),
  number: Number(m[2]),
  puzzle: m[4],
  solution: m[5],
}));

if (entries.length === 0) {
  console.error('No puzzles found in src/data/puzzles.ts');
  process.exit(1);
}

const UNSOLVED = 'unsolved';
const columns = [...TECHNIQUES, UNSOLVED];
const perLevel = new Map();
const totals = Object.fromEntries(columns.map((column) => [column, 0]));
const failures = [];

const started = Date.now();
for (const entry of entries) {
  const result = solveWithTechniques(entry.puzzle);
  const id = `L${entry.level}_P${entry.number}`;

  let column = UNSOLVED;
  if (result.status === 'solved') {
    column = result.hardest;
    if (result.grid.join('') !== entry.solution) {
      failures.push(`${id}: the solver reached a grid that is not the stored solution`);
    }
  } else if (result.status === 'contradiction') {
    failures.push(`${id}: the solver ran into a contradiction`);
  }

  const row = perLevel.get(entry.level) ?? Object.fromEntries(columns.map((c) => [c, 0]));
  row[column]++;
  totals[column]++;
  perLevel.set(entry.level, row);
}
const elapsed = ((Date.now() - started) / 1000).toFixed(1);

// Only show the techniques that appear, so the table stays readable.
const used = columns.filter((column) => totals[column] > 0);
const table = {};
for (const level of [...perLevel.keys()].sort((a, b) => a - b)) {
  table[`level ${level}`] = Object.fromEntries(used.map((column) => [column, perLevel.get(level)[column]]));
}
table.total = Object.fromEntries(used.map((column) => [column, totals[column]]));

console.log(`Graded ${entries.length} puzzles in ${elapsed}s`);
console.table(table);

const beyondSingles = entries.length - totals['naked-single'] - totals['hidden-single'];
const share = ((100 * beyondSingles) / entries.length).toFixed(1);
console.log(`Need more than singles: ${beyondSingles} of ${entries.length} (${share}%)`);
if (totals[UNSOLVED] > 0) {
  console.log(`Beyond the solver's ${TECHNIQUES.length} techniques: ${totals[UNSOLVED]}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s) found:`);
  for (const failure of failures.slice(0, 20)) console.error(`  - ${failure}`);
  process.exit(1);
}
