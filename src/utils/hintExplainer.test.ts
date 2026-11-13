import { describe, expect, it } from 'vitest';
import { PACKED_PUZZLES } from '../data/puzzles';
import { techniqueForLevel } from '../data/ladder';
import { TECHNIQUES } from '../solver/humanSolver';
import type { Technique } from '../solver/humanSolver';
import { describeHintFrame, explainNextStep, techniqueName } from './hintExplainer';
import type { ExplainedHint } from './hintExplainer';

const toGrid = (digits: string): number[][] =>
  Array.from({ length: 9 }, (_, row) => Array.from(digits.slice(row * 9, row * 9 + 9), Number));

const catalogue = PACKED_PUZZLES.map((entry) => {
  const [level, number, , puzzle, solution] = entry.split('|');
  return { id: `L${level}_P${number}`, level: Number(level), puzzle: toGrid(puzzle), solution: toGrid(solution) };
});

/** Plays a puzzle to the end by taking every hint, and hands each one to `visit`. */
function playWithHints(
  puzzle: number[][],
  solution: number[][],
  visit: (hint: ExplainedHint) => void,
): number[][] {
  const board = puzzle.map((row) => [...row]);
  for (let guard = 0; guard < 81; guard++) {
    const hint = explainNextStep(board, solution);
    if (!hint) return board;
    visit(hint);
    if (!hint.placement) throw new Error('A correct board produced a hint with nothing to place');
    board[hint.placement.row][hint.placement.col] = hint.placement.digit;
  }
  return board;
}

describe('explainNextStep', () => {
  it('opens with the area, then the technique, and marks the cell only at the end', () => {
    const { puzzle, solution } = catalogue[0];
    const hint = explainNextStep(puzzle, solution)!;

    expect(hint.frames[0].kind).toBe('zone');
    expect(hint.frames[0].zone.length).toBeGreaterThan(1);
    expect(hint.frames[0].target).toBeNull();

    const last = hint.frames[hint.frames.length - 1];
    expect(last.kind).toBe('technique');
    expect(last.step?.placement).not.toBeNull();
    expect(last.target).toBe(hint.placement!.row * 9 + hint.placement!.col);
    for (const frame of hint.frames.slice(0, -1)) expect(frame.target).toBeNull();
  });

  it('keeps the area wide enough that it does not give the cell away', () => {
    const { puzzle, solution } = catalogue[0];
    const hint = explainNextStep(puzzle, solution)!;
    const target = hint.placement!.row * 9 + hint.placement!.col;
    expect(hint.frames[0].zone).toContain(target);
    expect(hint.frames[0].zone).toHaveLength(9);
  });

  it('offers the digit of the solution, in an empty cell', () => {
    for (const { puzzle, solution } of catalogue.filter((_, index) => index % 40 === 0)) {
      const hint = explainNextStep(puzzle, solution)!;
      const { row, col, digit } = hint.placement!;
      expect(puzzle[row][col]).toBe(0);
      expect(digit).toBe(solution[row][col]);
    }
  });

  it('returns nothing for a finished board', () => {
    expect(explainNextStep(catalogue[0].solution, catalogue[0].solution)).toBeNull();
  });

  it('points at a wrong digit and offers nothing else', () => {
    const { puzzle, solution } = catalogue[0];
    const board = puzzle.map((row) => [...row]);
    const empty = board.flat().indexOf(0);
    const row = Math.floor(empty / 9);
    const col = empty % 9;
    board[row][col] = (solution[row][col] % 9) + 1;

    const hint = explainNextStep(board, solution)!;
    expect(hint.frames).toHaveLength(1);
    expect(hint.frames[0].kind).toBe('mistake');
    expect(hint.frames[0].target).toBe(empty);
    expect(hint.placement).toBeNull();
  });

  it('owns up when no technique applies, and still offers a digit', () => {
    const empty = Array.from({ length: 9 }, () => Array<number>(9).fill(0));
    const hint = explainNextStep(empty, catalogue[0].solution)!;
    expect(hint.frames.map((frame) => frame.kind)).toEqual(['stuck']);
    expect(hint.placement).toEqual({ row: 0, col: 0, digit: catalogue[0].solution[0][0] });
  });

  it('explains the eliminations a placement rests on before the placement', () => {
    // An X-Wing level: at some point the next digit only follows from the X-Wing.
    const { puzzle, solution } = catalogue.find((entry) => techniqueForLevel(entry.level) === 'x-wing')!;
    const withSetup: ExplainedHint[] = [];
    playWithHints(puzzle, solution, (hint) => {
      if (hint.frames.length > 2) withSetup.push(hint);
    });

    expect(withSetup.length).toBeGreaterThan(0);
    const explained = withSetup.flatMap((hint) => hint.frames.map((frame) => frame.step?.technique));
    expect(explained).toContain('x-wing');

    for (const hint of withSetup) {
      const middle = hint.frames.slice(1, -1);
      for (const frame of middle) {
        expect(frame.step?.placement).toBeNull();
        expect(frame.pattern.length).toBeGreaterThan(0);
        expect(frame.step!.eliminations.length).toBeGreaterThan(0);
      }
      expect(hint.frames[hint.frames.length - 1].afterSetup).toBe(true);
    }
  });

  it('never marks a pattern cell as eliminated too', () => {
    for (const { puzzle, solution } of catalogue.filter((_, index) => index % 50 === 7)) {
      playWithHints(puzzle, solution, (hint) => {
        for (const frame of hint.frames) {
          expect(frame.eliminated.filter((cell) => frame.pattern.includes(cell))).toEqual([]);
        }
      });
    }
  });
});

describe('hints across the whole catalogue', () => {
  it('finish every puzzle, one explained step at a time, with no dead end', () => {
    for (const { id, puzzle, solution } of catalogue) {
      let stuck = 0;
      const board = playWithHints(puzzle, solution, (hint) => {
        if (hint.frames.some((frame) => frame.kind === 'stuck')) stuck++;
      });
      expect(board, id).toEqual(solution);
      expect(stuck, id).toBe(0);
    }
  });

  it('teach the technique of the level somewhere in each puzzle beyond singles', () => {
    for (const { id, level, puzzle, solution } of catalogue.filter((_, index) => index % 20 === 0)) {
      const wanted = techniqueForLevel(level);
      const explained = new Set<Technique | undefined>();
      playWithHints(puzzle, solution, (hint) => {
        for (const frame of hint.frames) explained.add(frame.step?.technique);
      });
      expect([...explained], id).toContain(wanted);
    }
  });
});

describe('the words of a hint', () => {
  const languages = ['ca', 'es', 'en'] as const;

  it('has a name for every technique, in the three languages', () => {
    for (const language of languages) {
      for (const technique of TECHNIQUES) {
        const name = techniqueName(technique, language);
        expect(name, `${technique} in ${language}`).not.toMatch(/^hintName/);
        expect(name.length).toBeGreaterThan(2);
      }
    }
  });

  it('leaves no placeholder unfilled and no key untranslated', () => {
    for (const { puzzle, solution } of catalogue.filter((_, index) => index % 20 === 3)) {
      playWithHints(puzzle, solution, (hint) => {
        for (const frame of hint.frames) {
          for (const language of languages) {
            const text = describeHintFrame(frame, language);
            expect(text).not.toMatch(/[{}]/);
            expect(text).not.toMatch(/^hint[A-Z]/);
            expect(text.length).toBeGreaterThan(15);
          }
        }
      });
    }
  });

  it('never says the digit it is about to offer in a placement frame', () => {
    const { puzzle, solution } = catalogue[0];
    const hint = explainNextStep(puzzle, solution)!;
    const last = hint.frames[hint.frames.length - 1];
    for (const language of languages) {
      expect(describeHintFrame(last, language)).not.toMatch(/\d/);
    }
  });

  it('names the unit of a hidden single', () => {
    const { puzzle, solution } = catalogue.find((entry) => techniqueForLevel(entry.level) === 'hidden-single')!;
    let seen = false;
    playWithHints(puzzle, solution, (hint) => {
      const last = hint.frames[hint.frames.length - 1];
      if (last.step?.technique !== 'hidden-single') return;
      seen = true;
      expect(describeHintFrame(last, 'es')).toMatch(/en la (fila|columna|caja) [1-9] /);
      expect(describeHintFrame(last, 'en')).toMatch(/in (row|column|box) [1-9] /);
    });
    expect(seen).toBe(true);
  });
});
