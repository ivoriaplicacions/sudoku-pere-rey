/**
 * The puzzle generator lives in src/solver/generator.ts, where the app uses it
 * for the daily challenge. Scripts import it from here, unchanged.
 *
 * Needs Node 22.18 or later, which imports TypeScript files directly.
 */
export {
  makeRng,
  shuffled,
  randomSolution,
  digForTechnique,
  generateForTechnique,
  difficultyScore,
} from '../../src/solver/generator.ts';
