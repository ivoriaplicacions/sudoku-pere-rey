/**
 * How often can the generator produce a puzzle for each technique?
 *
 * For every technique it digs a number of random grids aimed at that technique
 * and reports how many came out demanding exactly it, how long each success
 * costs, and what a full pack of 200 would take. The difficulty ladder has to
 * be built from techniques this table shows to be reachable.
 *
 * Run with: node scripts/measureTechniqueYield.mjs [grids per technique]
 */
import { TECHNIQUES } from '../src/solver/humanSolver.ts';
import { digForTechnique, makeRng, randomSolution } from './lib/targetedGenerator.mjs';

const GRIDS = Number(process.argv[2] ?? 60);
const PACK = 200;

const table = {};
for (const target of TECHNIQUES) {
  const started = Date.now();
  const outcomes = {};
  let hits = 0;
  let givensSum = 0;
  let hardStepsSum = 0;

  for (let n = 1; n <= GRIDS; n++) {
    const rng = makeRng(TECHNIQUES.indexOf(target) * 7_919 + n * 104_729 + 17);
    const { givens, result } = digForTechnique(randomSolution(rng), target, rng);
    const hardest = result.hardest ?? 'none';
    outcomes[hardest] = (outcomes[hardest] ?? 0) + 1;
    if (result.hardest !== target) continue;
    hits++;
    givensSum += givens;
    hardStepsSum += result.counts[target];
  }

  const seconds = (Date.now() - started) / 1000;
  const fallback = Object.entries(outcomes)
    .filter(([name]) => name !== target)
    .sort((a, b) => b[1] - a[1])[0];
  table[target] = {
    hits: `${hits}/${GRIDS}`,
    'yield %': Math.round((100 * hits) / GRIDS),
    'avg givens': hits ? (givensSum / hits).toFixed(1) : '-',
    'avg hard steps': hits ? (hardStepsSum / hits).toFixed(1) : '-',
    's per puzzle': hits ? (seconds / hits).toFixed(2) : '-',
    [`min for ${PACK}`]: hits ? ((seconds / hits) * PACK / 60).toFixed(1) : '-',
    'most common miss': fallback ? `${fallback[0]} (${fallback[1]})` : '-',
  };
}

console.log(`${GRIDS} grids dug per technique`);
console.table(table);
