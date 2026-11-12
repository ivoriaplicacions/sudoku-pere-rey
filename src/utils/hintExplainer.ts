import { getTranslation } from '../i18n/translations';
import { applyStep, createState, findNextStep } from '../solver/humanSolver';
import type { SolveStep, Technique, UnitRef } from '../solver/humanSolver';
import type { Language } from '../types/sudoku';

/**
 * A hint that teaches instead of handing over a digit.
 *
 * It asks the human-style solver for the next step from where the player is and
 * turns it into a few frames: first only the area, then the technique that
 * applies, and the digit last, if the player still wants it.
 *
 * A placement often rests on candidates ruled out just before (a pair, an
 * X-Wing). Those steps are explained first, in order, and only the ones the
 * placement really depends on.
 */

export type HintFrameKind = 'zone' | 'technique' | 'mistake' | 'stuck';

export interface HintFrame {
  kind: HintFrameKind;
  /** The solver step the frame explains; absent for zone, mistake and stuck. */
  step?: SolveStep;
  /** True when the frame follows the explanation of an earlier step. */
  afterSetup?: boolean;
  /** Cells outlined softly: where to look. */
  zone: number[];
  /** Cells that form the pattern. */
  pattern: number[];
  /** Cells that lose a candidate because of the pattern. */
  eliminated: number[];
  /** The cell the hint ends up filling, once it is time to show it. */
  target: number | null;
}

export interface ExplainedHint {
  frames: HintFrame[];
  /** What the last frame offers to place. Null when the hint only points at a mistake. */
  placement: { row: number; col: number; digit: number } | null;
}

const rowOf = (cell: number): number => Math.floor(cell / 9);
const colOf = (cell: number): number => cell % 9;
const boxOf = (cell: number): number => Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);

const sees = (a: number, b: number): boolean =>
  a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

export function cellsOfUnit(unit: UnitRef): number[] {
  const cells: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    const index = unit.kind === 'row' ? rowOf(cell) : unit.kind === 'column' ? colOf(cell) : boxOf(cell);
    if (index === unit.index) cells.push(cell);
  }
  return cells;
}

const unique = (cells: number[]): number[] => [...new Set(cells)].sort((a, b) => a - b);

/**
 * Does `later` rest on what `earlier` ruled out?
 *
 * A pattern is valid because of the candidates in its own cells and in the cells
 * that share a unit with them. So if nothing `earlier` removed is in or next to
 * the pattern of `later`, `later` holds without it. This errs towards keeping a
 * step: it may explain one that was not strictly needed, never skip one that was.
 */
function dependsOn(later: SolveStep, earlier: SolveStep): boolean {
  if (later.placement) {
    const { cell, digit } = later.placement;
    if (later.technique === 'naked-single') {
      return earlier.eliminations.some((removed) => removed.cell === cell);
    }
    // Hidden single: the digit was ruled out elsewhere in the unit.
    const unitCells = later.units[0] ? cellsOfUnit(later.units[0]) : [];
    return earlier.eliminations.some((removed) => removed.digit === digit && unitCells.includes(removed.cell));
  }
  return earlier.eliminations.some((removed) =>
    later.cells.some((patternCell) => patternCell === removed.cell || sees(patternCell, removed.cell)),
  );
}

/** Keeps the setup steps the placement depends on, directly or through another. */
function neededSetup(setup: SolveStep[], placement: SolveStep): SolveStep[] {
  const needed: SolveStep[] = [];
  for (let i = setup.length - 1; i >= 0; i--) {
    const step = setup[i];
    if (dependsOn(placement, step) || needed.some((kept) => dependsOn(kept, step))) needed.unshift(step);
  }
  return needed;
}

function zoneFor(step: SolveStep): number[] {
  if (step.units.length > 0) return cellsOfUnit(step.units[0]);
  if (step.placement) return cellsOfUnit({ kind: 'box', index: boxOf(step.placement.cell) });
  return unique(step.cells);
}

/**
 * Builds the hint for a board. `values` is what is on screen, 0 for an empty
 * cell; `solution` is the finished grid. Returns null when nothing is left to fill.
 */
export function explainNextStep(values: number[][], solution: number[][]): ExplainedHint | null {
  // A wrong digit comes first: every step reasoned from it would be wrong too.
  for (let cell = 0; cell < 81; cell++) {
    const value = values[rowOf(cell)][colOf(cell)];
    if (value !== 0 && value !== solution[rowOf(cell)][colOf(cell)]) {
      return {
        frames: [{ kind: 'mistake', zone: [], pattern: [], eliminated: [], target: cell }],
        placement: null,
      };
    }
  }

  const firstEmpty = values.flat().indexOf(0);
  if (firstEmpty === -1) return null;

  const state = createState(values);
  const setup: SolveStep[] = [];
  let placement: SolveStep | null = null;
  for (;;) {
    const step = findNextStep(state);
    if (!step) break;
    applyStep(state, step);
    if (step.placement) {
      placement = step;
      break;
    }
    setup.push(step);
  }

  if (!placement?.placement) {
    // Beyond the solver's techniques. The shipped puzzles never get here, but a
    // hint that does nothing would be worse than one that owns up to it.
    return {
      frames: [{ kind: 'stuck', zone: [], pattern: [], eliminated: [], target: firstEmpty }],
      placement: {
        row: rowOf(firstEmpty),
        col: colOf(firstEmpty),
        digit: solution[rowOf(firstEmpty)][colOf(firstEmpty)],
      },
    };
  }

  const needed = neededSetup(setup, placement);
  const first = needed[0] ?? placement;
  const target = placement.placement.cell;

  const frames: HintFrame[] = [
    { kind: 'zone', zone: zoneFor(first), pattern: [], eliminated: [], target: null },
    ...needed.map(
      (step): HintFrame => ({
        kind: 'technique',
        step,
        zone: [],
        pattern: unique(step.cells),
        eliminated: unique(step.eliminations.map((removed) => removed.cell)).filter(
          (cell) => !step.cells.includes(cell),
        ),
        target: null,
      }),
    ),
    {
      kind: 'technique',
      step: placement,
      afterSetup: needed.length > 0,
      zone: placement.units[0] ? cellsOfUnit(placement.units[0]) : [],
      pattern: [],
      eliminated: [],
      target,
    },
  ];

  return {
    frames,
    placement: { row: rowOf(target), col: colOf(target), digit: placement.placement.digit },
  };
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const TECHNIQUE_NAME_KEY: Record<Technique, string> = {
  'naked-single': 'hintNameNakedSingle',
  'hidden-single': 'hintNameHiddenSingle',
  'locked-candidates': 'hintNameLockedCandidates',
  'naked-pair': 'hintNameNakedPair',
  'naked-triple': 'hintNameNakedTriple',
  'hidden-pair': 'hintNameHiddenPair',
  'hidden-triple': 'hintNameHiddenTriple',
  'x-wing': 'hintNameXWing',
  'naked-quad': 'hintNameNakedQuad',
  'hidden-quad': 'hintNameHiddenQuad',
  'xy-wing': 'hintNameXYWing',
  swordfish: 'hintNameSwordfish',
  'short-chain': 'hintNameShortChain',
};

const EXPLANATION_KEY: Record<Technique, string> = {
  'naked-single': 'hintNakedSingle',
  'hidden-single': 'hintHiddenSingle',
  'locked-candidates': 'hintLockedCandidates',
  'naked-pair': 'hintNakedSubset',
  'naked-triple': 'hintNakedSubset',
  'hidden-pair': 'hintHiddenSubset',
  'hidden-triple': 'hintHiddenSubset',
  'x-wing': 'hintFish',
  'naked-quad': 'hintNakedSubset',
  'hidden-quad': 'hintHiddenSubset',
  'xy-wing': 'hintXYWing',
  swordfish: 'hintFish',
  'short-chain': 'hintShortChain',
};

export function techniqueName(technique: Technique, language: Language): string {
  return getTranslation(language, TECHNIQUE_NAME_KEY[technique]);
}

function unitName(unit: UnitRef | undefined, language: Language): string {
  if (!unit) return '';
  const key = unit.kind === 'row' ? 'hintUnitRow' : unit.kind === 'column' ? 'hintUnitColumn' : 'hintUnitBox';
  return getTranslation(language, key, { n: unit.index + 1 });
}

function digitList(digits: number[], language: Language): string {
  if (digits.length <= 1) return digits.join('');
  const and = getTranslation(language, 'hintAnd');
  return `${digits.slice(0, -1).join(', ')} ${and} ${digits[digits.length - 1]}`;
}

/** The sentence a frame shows. The answer itself is never in it. */
export function describeHintFrame(frame: HintFrame, language: Language): string {
  if (frame.kind === 'zone') return getTranslation(language, 'hintZone');
  if (frame.kind === 'mistake') return getTranslation(language, 'hintMistake');
  if (frame.kind === 'stuck' || !frame.step) return getTranslation(language, 'hintStuck');

  const step = frame.step;
  if (step.placement) {
    const base = step.technique === 'naked-single' ? 'hintNakedSingle' : 'hintHiddenSingle';
    return getTranslation(language, frame.afterSetup ? `${base}After` : base, {
      unit: unitName(step.units[0], language),
    });
  }

  return getTranslation(language, EXPLANATION_KEY[step.technique], {
    name: techniqueName(step.technique, language),
    unit: unitName(step.units[0], language),
    other: unitName(step.units[1], language),
    digits: digitList(step.digits, language),
    // The digit being ruled out. For an XY-Wing it is the one both ends share.
    digit: step.eliminations[0]?.digit ?? step.digits[0],
  });
}
