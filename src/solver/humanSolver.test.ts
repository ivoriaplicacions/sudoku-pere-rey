import { describe, expect, it } from 'vitest';
import { PACKED_PUZZLES } from '../data/puzzles';
import {
  TECHNIQUES,
  applyStep,
  candidatesOf,
  createState,
  findNextStep,
  findStepWith,
  gradePuzzle,
  hasContradiction,
  isSolved,
  solveWithTechniques,
} from './humanSolver';
import type { SolverState, Technique } from './humanSolver';

const cell = (row: number, col: number): number => row * 9 + col;
const emptyState = (): SolverState => createState('0'.repeat(81));
const maskOf = (...digits: number[]): number => digits.reduce((mask, digit) => mask | (1 << (digit - 1)), 0);

/** In `cells`, the digit stays a candidate only where `keep` says so. */
function confine(state: SolverState, digit: number, cells: number[], keep: number[]): void {
  for (const c of cells) {
    if (!keep.includes(c)) state.candidates[c] &= ~maskOf(digit);
  }
}

const rowCells = (row: number): number[] => Array.from({ length: 9 }, (_, col) => cell(row, col));
const colCells = (col: number): number[] => Array.from({ length: 9 }, (_, row) => cell(row, col));
const BOX_0 = [0, 1, 2, 9, 10, 11, 18, 19, 20];

const eliminatedCells = (step: { eliminations: { cell: number }[] }): number[] =>
  [...new Set(step.eliminations.map((e) => e.cell))].sort((a, b) => a - b);

/**
 * Real puzzles, each with a single solution, graded by the hardest technique the
 * solver needs. Found by digging random grids down to a minimal set of givens.
 */
const GRADED: Array<{ hardest: Technique; puzzle: string; solution: string }> = [
  {
    hardest: 'naked-single',
    puzzle: '000064070007000008860301040091000800002000000080002000000200030009050004030090216',
    solution: '923864175147529368865371942691745823352186497784932651476218539219653784538497216',
  },
  {
    hardest: 'hidden-single',
    puzzle: '030650000640000009000080000090002430000000910020140000180060000002000048004000700',
    solution: '239654871648721359517983624891572436475836912326149587183467295762395148954218763',
  },
  {
    hardest: 'locked-candidates',
    puzzle: '020105700030000004701840000080000000300000080100620075000000003203000060040970050',
    solution: '426135798839762514751849632587391426362457189194628375975216843213584967648973251',
  },
  {
    hardest: 'naked-pair',
    puzzle: '009070805007300000100002000500004029004000070000603001000000600200010900906000000',
    solution: '329471865687395214145862793561784329834129576792653481418937652273516948956248137',
  },
  {
    hardest: 'naked-triple',
    puzzle: '000035006800000020000100000000308004000060201760000053002000000007010035640087010',
    solution: '429835176815476329376129548291358764538764291764291853152943687987612435643587912',
  },
  {
    hardest: 'hidden-pair',
    puzzle: '000040002065030100009007005007008020050000003040500010306000000020010080000060000',
    solution: '781645932465932178239187645617398524952471863843526719376854291524719386198263457',
  },
  {
    hardest: 'x-wing',
    puzzle: '000000000809000001670001805045830000000096300003000004000100036000940010008600000',
    solution: '521789643839564271674321895945837162182496357763215984297158436356942718418673529',
  },
  {
    hardest: 'xy-wing',
    puzzle: '010300609000050800900020070000007003000540000300002001070000100495030000000000048',
    solution: '214378659763459812958126374529617483681543297347982561876294135495831726132765948',
  },
  {
    hardest: 'swordfish',
    puzzle: '003008000010003900000645800000902050300800070580000020600001000001000000000500730',
    solution: '453198267816273945297645813174962358362854179589317624635781492721439586948526731',
  },
  {
    hardest: 'short-chain',
    puzzle: '000010780000004030060000000070406020080000370004030000720089600500000009000003200',
    solution: '459312786817694532362875491173456928685921374294738165721589643536247819948163257',
  },
];

/** Solves step by step and fails on the first deduction the solution contradicts. */
function expectEveryStepSound(puzzle: string, solution: string): void {
  const state = createState(puzzle);
  for (;;) {
    const step = findNextStep(state);
    if (!step) break;
    if (step.placement) {
      expect(solution[step.placement.cell], `${step.technique} placed a wrong digit`).toBe(
        String(step.placement.digit),
      );
    }
    for (const elimination of step.eliminations) {
      expect(solution[elimination.cell], `${step.technique} removed the right digit`).not.toBe(
        String(elimination.digit),
      );
    }
    applyStep(state, step);
  }
}

describe('createState', () => {
  it('leaves only the candidates the givens allow', () => {
    const state = createState(GRADED[0].puzzle);
    // Row 0 is 000064070: the first cell cannot be 6, 4 or 7, nor the 8 below it.
    expect(candidatesOf(state, 0)).toEqual([1, 2, 3, 5, 9]);
    expect(candidatesOf(state, 4)).toEqual([]);
  });

  it('accepts a string, a flat array and a 9×9 grid', () => {
    const text = GRADED[0].puzzle;
    const flat = Array.from(text, Number);
    const rows = Array.from({ length: 9 }, (_, row) => flat.slice(row * 9, row * 9 + 9));
    expect(createState(flat)).toEqual(createState(text));
    expect(createState(rows)).toEqual(createState(text));
  });

  it('rejects a grid that is not 81 cells', () => {
    expect(() => createState('123')).toThrow(/81 cells/);
  });
});

describe('each technique on a pattern built by hand', () => {
  it('naked single: places the only digit a cell can hold', () => {
    const state = emptyState();
    state.candidates[40] = maskOf(7);
    const step = findStepWith(state, 'naked-single');
    expect(step?.placement).toEqual({ cell: 40, digit: 7 });
  });

  it('hidden single: places a digit in the only cell of a unit that takes it', () => {
    const state = emptyState();
    confine(state, 7, rowCells(4), [cell(4, 4)]);
    const step = findStepWith(state, 'hidden-single');
    expect(step?.placement).toEqual({ cell: cell(4, 4), digit: 7 });
    expect(step?.units).toEqual([{ kind: 'row', index: 4 }]);
  });

  it('locked candidates, pointing: a digit confined to one row of a box leaves the rest of the row', () => {
    const state = emptyState();
    confine(state, 5, BOX_0, [0, 1]);
    const step = findStepWith(state, 'locked-candidates');
    expect(step?.units).toEqual([
      { kind: 'box', index: 0 },
      { kind: 'row', index: 0 },
    ]);
    expect(eliminatedCells(step!)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('locked candidates, claiming: a digit confined to one box of a row leaves the rest of the box', () => {
    const state = emptyState();
    confine(state, 5, rowCells(0), [0, 1, 2]);
    const step = findStepWith(state, 'locked-candidates');
    expect(step?.units).toEqual([
      { kind: 'row', index: 0 },
      { kind: 'box', index: 0 },
    ]);
    expect(eliminatedCells(step!)).toEqual([9, 10, 11, 18, 19, 20]);
  });

  it('naked pair', () => {
    const state = emptyState();
    state.candidates[0] = maskOf(1, 2);
    state.candidates[1] = maskOf(1, 2);
    const step = findStepWith(state, 'naked-pair');
    expect(step?.cells).toEqual([0, 1]);
    expect(step?.digits).toEqual([1, 2]);
    expect(eliminatedCells(step!)).toEqual([2, 9, 10, 11, 18, 19, 20]);
    expect(step?.eliminations).toHaveLength(14);
  });

  it('naked triple, with no cell holding all three digits', () => {
    const state = emptyState();
    state.candidates[0] = maskOf(1, 2);
    state.candidates[1] = maskOf(2, 3);
    state.candidates[2] = maskOf(1, 3);
    const step = findStepWith(state, 'naked-triple');
    expect(step?.cells).toEqual([0, 1, 2]);
    expect(step?.digits).toEqual([1, 2, 3]);
    expect(step?.eliminations).toHaveLength(18);
  });

  it('naked quad', () => {
    const state = emptyState();
    state.candidates[0] = maskOf(1, 2);
    state.candidates[1] = maskOf(2, 3);
    state.candidates[2] = maskOf(3, 4);
    state.candidates[9] = maskOf(1, 4);
    const step = findStepWith(state, 'naked-quad');
    expect(step?.cells).toEqual([0, 1, 2, 9]);
    expect(eliminatedCells(step!)).toEqual([10, 11, 18, 19, 20]);
    expect(step?.eliminations).toHaveLength(20);
  });

  it('hidden pair: two digits with two cells strip everything else from them', () => {
    const state = emptyState();
    confine(state, 1, BOX_0, [0, 10]);
    confine(state, 2, BOX_0, [0, 10]);
    const step = findStepWith(state, 'hidden-pair');
    expect(step?.cells).toEqual([0, 10]);
    expect(step?.digits).toEqual([1, 2]);
    expect(step?.eliminations).toHaveLength(14);
    applyStep(state, step!);
    expect(candidatesOf(state, 0)).toEqual([1, 2]);
    expect(candidatesOf(state, 10)).toEqual([1, 2]);
  });

  it('hidden triple', () => {
    const state = emptyState();
    for (const digit of [1, 2, 3]) confine(state, digit, BOX_0, [0, 10, 20]);
    const step = findStepWith(state, 'hidden-triple');
    expect(step?.cells).toEqual([0, 10, 20]);
    expect(step?.eliminations).toHaveLength(18);
  });

  it('hidden quad', () => {
    const state = emptyState();
    for (const digit of [1, 2, 3, 4]) confine(state, digit, BOX_0, [0, 1, 10, 20]);
    const step = findStepWith(state, 'hidden-quad');
    expect(step?.cells).toEqual([0, 1, 10, 20]);
    expect(step?.eliminations).toHaveLength(20);
  });

  it('x-wing: two rows with a digit in the same two columns clear those columns', () => {
    const state = emptyState();
    confine(state, 7, rowCells(1), [cell(1, 2), cell(1, 6)]);
    confine(state, 7, rowCells(5), [cell(5, 2), cell(5, 6)]);
    const step = findStepWith(state, 'x-wing');
    expect(step?.cells).toEqual([cell(1, 2), cell(1, 6), cell(5, 2), cell(5, 6)]);
    const expected = [0, 2, 3, 4, 6, 7, 8].flatMap((row) => [cell(row, 2), cell(row, 6)]);
    expect(eliminatedCells(step!)).toEqual(expected.sort((a, b) => a - b));
  });

  it('x-wing also works on columns', () => {
    const state = emptyState();
    confine(state, 7, colCells(1), [cell(2, 1), cell(6, 1)]);
    confine(state, 7, colCells(5), [cell(2, 5), cell(6, 5)]);
    const step = findStepWith(state, 'x-wing');
    const expected = [0, 2, 3, 4, 6, 7, 8].flatMap((col) => [cell(2, col), cell(6, col)]);
    expect(eliminatedCells(step!)).toEqual(expected.sort((a, b) => a - b));
  });

  it('swordfish: three rows, three columns, two cells in each row', () => {
    const state = emptyState();
    confine(state, 7, rowCells(0), [cell(0, 1), cell(0, 4)]);
    confine(state, 7, rowCells(4), [cell(4, 4), cell(4, 7)]);
    confine(state, 7, rowCells(8), [cell(8, 1), cell(8, 7)]);
    const step = findStepWith(state, 'swordfish');
    expect(step?.cells).toHaveLength(6);
    const expected = [1, 2, 3, 5, 6, 7].flatMap((row) => [cell(row, 1), cell(row, 4), cell(row, 7)]);
    expect(eliminatedCells(step!)).toEqual(expected.sort((a, b) => a - b));
    // Two rows alone do not make an x-wing here.
    expect(findStepWith(state, 'x-wing')).toBeNull();
  });

  it('xy-wing: the digit both pincers share leaves the cell that sees them both', () => {
    const state = emptyState();
    state.candidates[cell(0, 0)] = maskOf(1, 2);
    state.candidates[cell(0, 8)] = maskOf(1, 3);
    state.candidates[cell(8, 0)] = maskOf(2, 3);
    const step = findStepWith(state, 'xy-wing');
    expect(step?.cells).toEqual([cell(0, 0), cell(0, 8), cell(8, 0)]);
    expect(step?.eliminations).toEqual([{ cell: cell(8, 8), digit: 3 }]);
  });

  it('xy-wing needs the pincers to share a digit the pivot lacks', () => {
    const state = emptyState();
    state.candidates[cell(0, 0)] = maskOf(1, 2);
    state.candidates[cell(0, 8)] = maskOf(1, 3);
    state.candidates[cell(8, 0)] = maskOf(2, 4);
    expect(findStepWith(state, 'xy-wing')).toBeNull();
  });

  it('short chain (skyscraper): two columns joined by a row', () => {
    const state = emptyState();
    confine(state, 4, colCells(0), [cell(0, 0), cell(4, 0)]);
    confine(state, 4, colCells(4), [cell(0, 4), cell(5, 4)]);
    const step = findStepWith(state, 'short-chain');
    expect(step?.units).toEqual([
      { kind: 'column', index: 0 },
      { kind: 'column', index: 4 },
    ]);
    // The ends are r4c0 and r5c4; these four cells see both.
    expect(eliminatedCells(step!)).toEqual([cell(4, 3), cell(4, 5), cell(5, 1), cell(5, 2)]);
  });

  it('finds nothing on an empty grid', () => {
    const state = emptyState();
    expect(findNextStep(state)).toBeNull();
  });
});

describe('solving real puzzles', () => {
  it.each(GRADED)('grades a $hardest puzzle as $hardest and solves it', ({ hardest, puzzle, solution }) => {
    const result = solveWithTechniques(puzzle);
    expect(result.status).toBe('solved');
    expect(result.grid.join('')).toBe(solution);
    expect(result.hardest).toBe(hardest);
    expect(result.counts[hardest]).toBeGreaterThan(0);
    expect(result.steps).toHaveLength(Array.from(puzzle).filter((ch) => ch === '0').length + eliminationSteps(result.steps));
  });

  it.each(GRADED)('never makes a wrong deduction on the $hardest puzzle', ({ puzzle, solution }) => {
    expectEveryStepSound(puzzle, solution);
  });

  it('prefers the easiest technique: nothing harder than the grade is ever used', () => {
    for (const { hardest, puzzle } of GRADED) {
      const limit = TECHNIQUES.indexOf(hardest);
      const used = solveWithTechniques(puzzle).steps.map((step) => TECHNIQUES.indexOf(step.technique));
      expect(Math.max(...used)).toBe(limit);
    }
  });

  it('stops as stuck when the technique a puzzle needs is not allowed', () => {
    const xWing = GRADED.find((entry) => entry.hardest === 'x-wing')!;
    const limited = solveWithTechniques(xWing.puzzle, { maxTechnique: 'hidden-single' });
    expect(limited.status).toBe('stuck');
    expect(limited.grid).toContain(0);
    expect(solveWithTechniques(xWing.puzzle, { maxTechnique: 'x-wing' }).status).toBe('solved');
  });

  it('reports a contradiction instead of going on', () => {
    // Row 0 leaves only 9 for its last cell, and column 8 already has a 9.
    const grid = '123456780' + '000000009' + '0'.repeat(63);
    const state = createState(grid);
    expect(hasContradiction(state)).toBe(true);
    expect(solveWithTechniques(grid).status).toBe('contradiction');
  });

  it('needs no step for a complete grid', () => {
    const result = solveWithTechniques(GRADED[0].solution);
    expect(result.status).toBe('solved');
    expect(result.hardest).toBeNull();
    expect(result.steps).toEqual([]);
    expect(isSolved(createState(GRADED[0].solution))).toBe(true);
  });
});

describe('gradePuzzle', () => {
  it('counts the steps that needed the hardest technique', () => {
    const xyWing = GRADED.find((entry) => entry.hardest === 'xy-wing')!;
    const grade = gradePuzzle(xyWing.puzzle);
    expect(grade.solved).toBe(true);
    expect(grade.hardest).toBe('xy-wing');
    expect(grade.hardestSteps).toBe(grade.counts['xy-wing']);
    expect(grade.hardestSteps).toBeGreaterThan(0);
    expect(grade.totalSteps).toBe(Object.values(grade.counts).reduce((sum, n) => sum + n, 0));
  });
});

describe('the shipped catalogue', () => {
  it('is never contradicted by a deduction, and every solved grid is the stored solution', () => {
    expect(PACKED_PUZZLES.length).toBeGreaterThan(0);
    for (const entry of PACKED_PUZZLES) {
      const [level, number, , puzzle, solution] = entry.split('|');
      const result = solveWithTechniques(puzzle);
      const id = `L${level}_P${number}`;
      expect(result.status, id).not.toBe('contradiction');
      for (const step of result.steps) {
        if (step.placement) expect(solution[step.placement.cell], id).toBe(String(step.placement.digit));
        for (const e of step.eliminations) expect(solution[e.cell], id).not.toBe(String(e.digit));
      }
      if (result.status === 'solved') expect(result.grid.join(''), id).toBe(solution);
    }
  });
});

/** Steps that only removed candidates: the rest each filled one cell. */
function eliminationSteps(steps: { placement: unknown }[]): number {
  return steps.filter((step) => step.placement === null).length;
}
