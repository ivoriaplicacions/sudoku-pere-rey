/**
 * A solver that works the way a person does.
 *
 * It never guesses. At every step it looks for the easiest technique that makes
 * progress, applies it once, and writes down what it used. The hardest technique
 * it needed is the real difficulty of the puzzle, which the number of givens
 * does not tell you.
 *
 * Three things depend on this file:
 *  - the generator, to keep only puzzles that demand the technique of their level;
 *  - `puzzles:verify`, to fail the build when a puzzle does not;
 *  - in-game hints, which explain the next step instead of revealing a digit.
 *
 * It is deliberately self-contained (no imports, erasable syntax only) so the
 * Node scripts can import it directly, without a build step.
 */

/** Easiest first. The order is the difficulty ladder. */
export const TECHNIQUES = [
  'naked-single',
  'hidden-single',
  'locked-candidates',
  'naked-pair',
  'naked-triple',
  'hidden-pair',
  'hidden-triple',
  'x-wing',
  'naked-quad',
  'hidden-quad',
  'xy-wing',
  'swordfish',
  'short-chain',
] as const;

export type Technique = (typeof TECHNIQUES)[number];

export type UnitKind = 'row' | 'column' | 'box';

export interface UnitRef {
  kind: UnitKind;
  /** 0 to 8. Boxes are numbered left to right, top to bottom. */
  index: number;
}

/** A cell is its row-major index, 0 to 80. */
export interface CellDigit {
  cell: number;
  digit: number;
}

export interface SolveStep {
  technique: Technique;
  /** The digits the pattern is about. */
  digits: number[];
  /** The cells that form the pattern, not the ones it changes. */
  cells: number[];
  /** The rows, columns or boxes where the pattern lives. */
  units: UnitRef[];
  /** Set by the two single techniques; null for the rest. */
  placement: CellDigit | null;
  /** Candidates the pattern rules out. Empty for a placement. */
  eliminations: CellDigit[];
}

export interface SolverState {
  /** 81 digits, 0 for an empty cell. */
  grid: number[];
  /** 81 bitmasks; bit `d - 1` is set while digit `d` is still possible. */
  candidates: number[];
}

export type GridInput = string | readonly number[] | readonly (readonly number[])[];

export type SolveStatus = 'solved' | 'stuck' | 'contradiction';

export interface SolveResult {
  status: SolveStatus;
  /** The hardest technique used, or null if the grid needed no step at all. */
  hardest: Technique | null;
  /** How many steps each technique took. */
  counts: Record<Technique, number>;
  steps: SolveStep[];
  /** The grid where the solver stopped. Complete when status is 'solved'. */
  grid: number[];
}

export interface SolveOptions {
  /** Do not use anything harder than this. The solver reports 'stuck' instead. */
  maxTechnique?: Technique;
}

export interface PuzzleGrade {
  solved: boolean;
  hardest: Technique | null;
  /** Steps that needed the hardest technique: orders puzzles inside a level. */
  hardestSteps: number;
  totalSteps: number;
  counts: Record<Technique, number>;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const ALL_DIGITS = 0x1ff;

const ROW_OF: number[] = [];
const COL_OF: number[] = [];
const BOX_OF: number[] = [];
for (let i = 0; i < 81; i++) {
  const row = Math.floor(i / 9);
  const col = i % 9;
  ROW_OF.push(row);
  COL_OF.push(col);
  BOX_OF.push(Math.floor(row / 3) * 3 + Math.floor(col / 3));
}

interface Unit {
  ref: UnitRef;
  cells: number[];
}

const ROWS: Unit[] = [];
const COLUMNS: Unit[] = [];
const BOXES: Unit[] = [];
for (let index = 0; index < 9; index++) {
  ROWS.push({ ref: { kind: 'row', index }, cells: [] });
  COLUMNS.push({ ref: { kind: 'column', index }, cells: [] });
  BOXES.push({ ref: { kind: 'box', index }, cells: [] });
}
for (let i = 0; i < 81; i++) {
  ROWS[ROW_OF[i]].cells.push(i);
  COLUMNS[COL_OF[i]].cells.push(i);
  BOXES[BOX_OF[i]].cells.push(i);
}

/** Boxes first: a person scans a box before a whole row or column. */
const UNITS: Unit[] = [...BOXES, ...ROWS, ...COLUMNS];

function sees(a: number, b: number): boolean {
  return a !== b && (ROW_OF[a] === ROW_OF[b] || COL_OF[a] === COL_OF[b] || BOX_OF[a] === BOX_OF[b]);
}

const PEERS: number[][] = [];
for (let i = 0; i < 81; i++) {
  const peers: number[] = [];
  for (let j = 0; j < 81; j++) if (sees(i, j)) peers.push(j);
  PEERS.push(peers);
}

// ---------------------------------------------------------------------------
// Bit helpers
// ---------------------------------------------------------------------------

const bitOf = (digit: number): number => 1 << (digit - 1);

function countBits(mask: number): number {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count++;
  return count;
}

function digitsOf(mask: number): number[] {
  const digits: number[] = [];
  for (let digit = 1; digit <= 9; digit++) if (mask & bitOf(digit)) digits.push(digit);
  return digits;
}

/** Every way to choose `size` items, in order. The inputs here never pass nine items. */
function combinations<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  const pick = (start: number, chosen: T[]): void => {
    if (chosen.length === size) {
      result.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      chosen.push(items[i]);
      pick(i + 1, chosen);
      chosen.pop();
    }
  };
  pick(0, []);
  return result;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

function toFlatGrid(input: GridInput): number[] {
  let grid: number[];
  if (typeof input === 'string') {
    grid = Array.from(input, (ch) => (ch >= '1' && ch <= '9' ? ch.charCodeAt(0) - 48 : 0));
  } else if (input.length === 9 && Array.isArray(input[0])) {
    grid = (input as readonly (readonly number[])[]).flatMap((row) => [...row]);
  } else {
    grid = [...(input as readonly number[])];
  }
  if (grid.length !== 81) {
    throw new Error(`A sudoku grid has 81 cells, got ${grid.length}`);
  }
  return grid;
}

/** Builds the state for a grid, with every candidate the givens still allow. */
export function createState(input: GridInput): SolverState {
  const grid = toFlatGrid(input);
  const candidates: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) {
      candidates.push(0);
      continue;
    }
    let mask = ALL_DIGITS;
    for (const peer of PEERS[i]) if (grid[peer] !== 0) mask &= ~bitOf(grid[peer]);
    candidates.push(mask);
  }
  return { grid, candidates };
}

export function candidatesOf(state: SolverState, cell: number): number[] {
  return digitsOf(state.candidates[cell]);
}

/** Applies a step in place: its placement, then its eliminations. */
export function applyStep(state: SolverState, step: SolveStep): void {
  if (step.placement) {
    const { cell, digit } = step.placement;
    state.grid[cell] = digit;
    state.candidates[cell] = 0;
    for (const peer of PEERS[cell]) state.candidates[peer] &= ~bitOf(digit);
  }
  for (const { cell, digit } of step.eliminations) {
    state.candidates[cell] &= ~bitOf(digit);
  }
}

export function isSolved(state: SolverState): boolean {
  return state.grid.every((value) => value !== 0);
}

/** True when an empty cell has no candidate left: the grid cannot be completed. */
export function hasContradiction(state: SolverState): boolean {
  for (let i = 0; i < 81; i++) {
    if (state.grid[i] === 0 && state.candidates[i] === 0) return true;
  }
  return false;
}

/** The candidates in `cells` that `mask` would remove. */
function eliminationsIn(state: SolverState, cells: readonly number[], mask: number): CellDigit[] {
  const eliminations: CellDigit[] = [];
  for (const cell of cells) {
    for (const digit of digitsOf(state.candidates[cell] & mask)) {
      eliminations.push({ cell, digit });
    }
  }
  return eliminations;
}

// ---------------------------------------------------------------------------
// Techniques
// ---------------------------------------------------------------------------

/** A cell where only one digit fits. */
function findNakedSingle(state: SolverState): SolveStep | null {
  for (let cell = 0; cell < 81; cell++) {
    const mask = state.candidates[cell];
    if (state.grid[cell] !== 0 || countBits(mask) !== 1) continue;
    const digit = digitsOf(mask)[0];
    return {
      technique: 'naked-single',
      digits: [digit],
      cells: [cell],
      units: [],
      placement: { cell, digit },
      eliminations: [],
    };
  }
  return null;
}

/** A digit that fits in only one cell of a row, column or box. */
function findHiddenSingle(state: SolverState): SolveStep | null {
  for (const unit of UNITS) {
    for (let digit = 1; digit <= 9; digit++) {
      const spots = unit.cells.filter((cell) => state.candidates[cell] & bitOf(digit));
      if (spots.length !== 1) continue;
      return {
        technique: 'hidden-single',
        digits: [digit],
        cells: [spots[0]],
        units: [unit.ref],
        placement: { cell: spots[0], digit },
        eliminations: [],
      };
    }
  }
  return null;
}

/**
 * A digit confined to the overlap of a box and a line.
 *
 * Pointing: inside a box the digit only fits in one row or column, so it leaves the
 * rest of that line. Claiming: inside a line it only fits in one box, so it leaves
 * the rest of that box.
 */
function findLockedCandidates(state: SolverState): SolveStep | null {
  const lines = [...ROWS, ...COLUMNS];
  const confinements: Array<[Unit[], Unit[]]> = [
    [BOXES, lines],
    [lines, BOXES],
  ];
  for (const [fromUnits, intoUnits] of confinements) {
    for (const from of fromUnits) {
      for (let digit = 1; digit <= 9; digit++) {
        const spots = from.cells.filter((cell) => state.candidates[cell] & bitOf(digit));
        if (spots.length < 2) continue;
        for (const into of intoUnits) {
          if (!spots.every((cell) => into.cells.includes(cell))) continue;
          const others = into.cells.filter((cell) => !spots.includes(cell));
          const eliminations = eliminationsIn(state, others, bitOf(digit));
          if (eliminations.length === 0) continue;
          return {
            technique: 'locked-candidates',
            digits: [digit],
            cells: spots,
            units: [from.ref, into.ref],
            placement: null,
            eliminations,
          };
        }
      }
    }
  }
  return null;
}

const NAKED_SUBSETS: Record<number, Technique> = { 2: 'naked-pair', 3: 'naked-triple', 4: 'naked-quad' };
const HIDDEN_SUBSETS: Record<number, Technique> = { 2: 'hidden-pair', 3: 'hidden-triple', 4: 'hidden-quad' };

/** `size` cells of a unit that share only `size` digits: no other cell there can use them. */
function findNakedSubset(state: SolverState, size: number): SolveStep | null {
  for (const unit of UNITS) {
    const empty = unit.cells.filter((cell) => state.grid[cell] === 0);
    if (empty.length <= size) continue;
    const eligible = empty.filter((cell) => countBits(state.candidates[cell]) <= size);
    for (const cells of combinations(eligible, size)) {
      let mask = 0;
      for (const cell of cells) mask |= state.candidates[cell];
      if (countBits(mask) !== size) continue;
      const others = empty.filter((cell) => !cells.includes(cell));
      const eliminations = eliminationsIn(state, others, mask);
      if (eliminations.length === 0) continue;
      return {
        technique: NAKED_SUBSETS[size],
        digits: digitsOf(mask),
        cells,
        units: [unit.ref],
        placement: null,
        eliminations,
      };
    }
  }
  return null;
}

/** `size` digits of a unit that only fit in `size` cells: those cells hold nothing else. */
function findHiddenSubset(state: SolverState, size: number): SolveStep | null {
  for (const unit of UNITS) {
    const empty = unit.cells.filter((cell) => state.grid[cell] === 0);
    if (empty.length <= size) continue;
    const open: number[] = [];
    for (let digit = 1; digit <= 9; digit++) {
      if (empty.some((cell) => state.candidates[cell] & bitOf(digit))) open.push(digit);
    }
    for (const digits of combinations(open, size)) {
      let mask = 0;
      for (const digit of digits) mask |= bitOf(digit);
      const cells = empty.filter((cell) => state.candidates[cell] & mask);
      if (cells.length !== size) continue;
      const eliminations = eliminationsIn(state, cells, ALL_DIGITS & ~mask);
      if (eliminations.length === 0) continue;
      return {
        technique: HIDDEN_SUBSETS[size],
        digits,
        cells,
        units: [unit.ref],
        placement: null,
        eliminations,
      };
    }
  }
  return null;
}

/**
 * X-Wing (size 2) and Swordfish (size 3).
 *
 * In `size` rows a digit only fits in the same `size` columns, so in those columns
 * it belongs to those rows and leaves every other row. The same with rows and
 * columns swapped.
 */
function findFish(state: SolverState, size: number, technique: Technique): SolveStep | null {
  const orientations: Array<[Unit[], Unit[]]> = [
    [ROWS, COLUMNS],
    [COLUMNS, ROWS],
  ];
  for (const [bases, covers] of orientations) {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = bitOf(digit);
      // For each base line, the positions (0 to 8 along the line) where the digit fits.
      const positions = bases.map((base) => {
        let mask = 0;
        base.cells.forEach((cell, position) => {
          if (state.candidates[cell] & bit) mask |= 1 << position;
        });
        return mask;
      });
      const eligible: number[] = [];
      positions.forEach((mask, line) => {
        const count = countBits(mask);
        if (count >= 2 && count <= size) eligible.push(line);
      });
      for (const chosen of combinations(eligible, size)) {
        let coverMask = 0;
        for (const line of chosen) coverMask |= positions[line];
        if (countBits(coverMask) !== size) continue;
        const coverLines = digitsOf(coverMask).map((d) => d - 1);
        const patternCells: number[] = [];
        for (const line of chosen) {
          for (const position of coverLines) {
            const cell = bases[line].cells[position];
            if (state.candidates[cell] & bit) patternCells.push(cell);
          }
        }
        const targets: number[] = [];
        for (const position of coverLines) {
          for (const cell of covers[position].cells) {
            if (!patternCells.includes(cell)) targets.push(cell);
          }
        }
        // A base cell outside the cover lines cannot exist, so every target is off-pattern.
        const eliminations = eliminationsIn(state, targets, bit);
        if (eliminations.length === 0) continue;
        return {
          technique,
          digits: [digit],
          cells: patternCells,
          units: [...chosen.map((line) => bases[line].ref), ...coverLines.map((line) => covers[line].ref)],
          placement: null,
          eliminations,
        };
      }
    }
  }
  return null;
}

/**
 * XY-Wing: a pivot with candidates {x, y} sees two pincers, {x, z} and {y, z}.
 * Whatever the pivot turns out to be, one pincer is z, so any cell that sees both
 * pincers cannot be z.
 */
function findXYWing(state: SolverState): SolveStep | null {
  const isBivalue = (cell: number): boolean => countBits(state.candidates[cell]) === 2;
  for (let pivot = 0; pivot < 81; pivot++) {
    if (!isBivalue(pivot)) continue;
    const pivotMask = state.candidates[pivot];
    const pincers = PEERS[pivot].filter(
      (cell) => isBivalue(cell) && countBits(state.candidates[cell] & pivotMask) === 1,
    );
    for (const [a, b] of combinations(pincers, 2)) {
      const maskA = state.candidates[a];
      const maskB = state.candidates[b];
      const shared = maskA & maskB;
      if ((maskA ^ maskB) !== pivotMask || countBits(shared) !== 1 || shared & pivotMask) continue;
      const targets: number[] = [];
      for (let cell = 0; cell < 81; cell++) {
        if (cell !== pivot && sees(cell, a) && sees(cell, b)) targets.push(cell);
      }
      const eliminations = eliminationsIn(state, targets, shared);
      if (eliminations.length === 0) continue;
      return {
        technique: 'xy-wing',
        digits: digitsOf(pivotMask | shared),
        cells: [pivot, a, b],
        units: [],
        placement: null,
        eliminations,
      };
    }
  }
  return null;
}

/**
 * A short chain on one digit: two strong links joined by a weak one. This covers
 * the patterns known as Skyscraper, Two-String Kite and Turbot Fish.
 *
 * A strong link is a unit where the digit fits in exactly two cells: one of them
 * holds it. Take links A1–B1 and A2–B2 where B1 sees A2. If A1 is not the digit,
 * B1 is, so A2 is not, so B2 is. One of A1 and B2 therefore holds the digit, and
 * any cell that sees both cannot.
 */
function findShortChain(state: SolverState): SolveStep | null {
  for (let digit = 1; digit <= 9; digit++) {
    const bit = bitOf(digit);
    const links: Array<{ unit: Unit; cells: [number, number] }> = [];
    for (const unit of UNITS) {
      const spots = unit.cells.filter((cell) => state.candidates[cell] & bit);
      if (spots.length === 2) links.push({ unit, cells: [spots[0], spots[1]] });
    }
    for (const [first, second] of combinations(links, 2)) {
      if (first.cells.some((cell) => second.cells.includes(cell))) continue;
      for (const [a1, b1] of [first.cells, [first.cells[1], first.cells[0]]]) {
        for (const [a2, b2] of [second.cells, [second.cells[1], second.cells[0]]]) {
          if (!sees(b1, a2)) continue;
          const chain = [a1, b1, a2, b2];
          const targets: number[] = [];
          for (let cell = 0; cell < 81; cell++) {
            if (!chain.includes(cell) && sees(cell, a1) && sees(cell, b2)) targets.push(cell);
          }
          const eliminations = eliminationsIn(state, targets, bit);
          if (eliminations.length === 0) continue;
          return {
            technique: 'short-chain',
            digits: [digit],
            cells: chain,
            units: [first.unit.ref, second.unit.ref],
            placement: null,
            eliminations,
          };
        }
      }
    }
  }
  return null;
}

const FINDERS: Record<Technique, (state: SolverState) => SolveStep | null> = {
  'naked-single': findNakedSingle,
  'hidden-single': findHiddenSingle,
  'locked-candidates': findLockedCandidates,
  'naked-pair': (state) => findNakedSubset(state, 2),
  'naked-triple': (state) => findNakedSubset(state, 3),
  'hidden-pair': (state) => findHiddenSubset(state, 2),
  'hidden-triple': (state) => findHiddenSubset(state, 3),
  'x-wing': (state) => findFish(state, 2, 'x-wing'),
  'naked-quad': (state) => findNakedSubset(state, 4),
  'hidden-quad': (state) => findHiddenSubset(state, 4),
  'xy-wing': findXYWing,
  swordfish: (state) => findFish(state, 3, 'swordfish'),
  'short-chain': findShortChain,
};

// ---------------------------------------------------------------------------
// Solving
// ---------------------------------------------------------------------------

/** Looks for one specific technique, whether or not an easier one is available. */
export function findStepWith(state: SolverState, technique: Technique): SolveStep | null {
  return FINDERS[technique](state);
}

/** The next step a person would take: the easiest technique that makes progress. */
export function findNextStep(state: SolverState, options: SolveOptions = {}): SolveStep | null {
  const limit = options.maxTechnique ? TECHNIQUES.indexOf(options.maxTechnique) : TECHNIQUES.length - 1;
  for (let i = 0; i <= limit; i++) {
    const step = FINDERS[TECHNIQUES[i]](state);
    if (step) return step;
  }
  return null;
}

/** Is `a` harder than `b` on the ladder? */
export function isHarder(a: Technique, b: Technique): boolean {
  return TECHNIQUES.indexOf(a) > TECHNIQUES.indexOf(b);
}

/** Solves as far as the allowed techniques reach, one step at a time. */
export function solveWithTechniques(input: GridInput, options: SolveOptions = {}): SolveResult {
  const state = createState(input);
  const counts = Object.fromEntries(TECHNIQUES.map((technique) => [technique, 0])) as Record<Technique, number>;
  const steps: SolveStep[] = [];
  let hardest: Technique | null = null;
  let status: SolveStatus;

  for (;;) {
    if (hasContradiction(state)) {
      status = 'contradiction';
      break;
    }
    if (isSolved(state)) {
      status = 'solved';
      break;
    }
    const step = findNextStep(state, options);
    if (!step) {
      status = 'stuck';
      break;
    }
    applyStep(state, step);
    steps.push(step);
    counts[step.technique]++;
    if (hardest === null || isHarder(step.technique, hardest)) hardest = step.technique;
  }

  return { status, hardest, counts, steps, grid: state.grid };
}

/** The difficulty of a puzzle: the hardest technique it demands and how often. */
export function gradePuzzle(input: GridInput, options: SolveOptions = {}): PuzzleGrade {
  const result = solveWithTechniques(input, options);
  return {
    solved: result.status === 'solved',
    hardest: result.hardest,
    hardestSteps: result.hardest ? result.counts[result.hardest] : 0,
    totalSteps: result.steps.length,
    counts: result.counts,
  };
}
