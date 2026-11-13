import { LADDER } from '../data/ladder';
import { applyStep, candidatesOf, createState, findNextStep } from '../solver/humanSolver';
import type { SolveStep, Technique } from '../solver/humanSolver';
import { cellsOfUnit } from './hintExplainer';

/**
 * A short lesson for each technique on the ladder, shown the first time a
 * player reaches a level that demands it.
 *
 * The example is not drawn by hand. It is the first puzzle of the first level
 * that asks for the technique, played forward by the solver up to the moment
 * the technique is needed. So it is always a position the player is about to
 * meet, and it stays right when the catalogue is regenerated.
 */

/** What the player is asked to tap. */
export type LessonTask =
  /** The cell where the digit goes. */
  | 'place'
  /** A cell that loses a candidate because of the pattern. */
  | 'eliminate'
  /** One of the cells that hold the hidden digits. */
  | 'find-pattern';

export interface Lesson {
  technique: Technique;
  task: LessonTask;
  /** The board at the example position: 81 digits, 0 for an empty cell. */
  grid: number[];
  /** What still fits in each empty cell, by cell index. */
  candidates: number[][];
  /** The step the lesson teaches. */
  step: SolveStep;
  /** Cells outlined softly from the start: where to look. */
  zone: number[];
  /** Cells shown as the pattern from the start. Empty when finding it is the task. */
  pattern: number[];
  /** The taps that count as right. */
  answers: number[];
}

const HIDDEN_SUBSETS: Technique[] = ['hidden-pair', 'hidden-triple', 'hidden-quad'];

const unique = (cells: number[]): number[] => [...new Set(cells)].sort((a, b) => a - b);

const boxOf = (cell: number): number => Math.floor(Math.floor(cell / 9) / 3) * 3 + Math.floor((cell % 9) / 3);

/** The first level on the ladder that demands the technique, or null if none does. */
export function firstLevelFor(technique: Technique): number | null {
  return LADDER.find((step) => step.technique === technique)?.from ?? null;
}

/**
 * Builds the lesson from a puzzle that demands the technique: `puzzle` is its
 * 81 givens. Returns null if the technique never comes up in it.
 */
export function buildLesson(technique: Technique, puzzle: readonly number[]): Lesson | null {
  const state = createState(puzzle);
  for (;;) {
    const step = findNextStep(state);
    if (!step) return null;
    if (step.technique !== technique) {
      applyStep(state, step);
      continue;
    }

    const grid = [...state.grid];
    const candidates = grid.map((_, cell) => candidatesOf(state, cell));

    if (step.placement) {
      const target = step.placement.cell;
      // A naked single is found by looking at one cell; the box narrows the search
      // without pointing at it. Any cell of the box with one candidate is a fair answer.
      const zone = step.units[0] ? cellsOfUnit(step.units[0]) : cellsOfUnit({ kind: 'box', index: boxOf(target) });
      const answers =
        technique === 'naked-single'
          ? zone.filter((cell) => grid[cell] === 0 && candidates[cell].length === 1)
          : [target];
      return { technique, task: 'place', grid, candidates, step, zone, pattern: [], answers };
    }

    if (HIDDEN_SUBSETS.includes(technique)) {
      return {
        technique,
        task: 'find-pattern',
        grid,
        candidates,
        step,
        zone: step.units[0] ? cellsOfUnit(step.units[0]) : [],
        pattern: [],
        answers: unique(step.cells),
      };
    }

    return {
      technique,
      task: 'eliminate',
      grid,
      candidates,
      step,
      zone: [],
      pattern: unique(step.cells),
      answers: unique(step.eliminations.map((removed) => removed.cell)),
    };
  }
}

/** The lesson for a technique, from the first puzzle of the first level that demands it. */
export function lessonFor(
  technique: Technique,
  puzzles: ReadonlyArray<{ level: number; puzzleNumber: number; initialGrid: number[][] }>,
): Lesson | null {
  const level = firstLevelFor(technique);
  if (level === null) return null;
  const inLevel = puzzles.filter((puzzle) => puzzle.level === level).sort((a, b) => a.puzzleNumber - b.puzzleNumber);
  for (const puzzle of inLevel) {
    const lesson = buildLesson(technique, puzzle.initialGrid.flat());
    if (lesson) return lesson;
  }
  return null;
}
