import { beforeEach, describe, expect, it } from 'vitest';
import { LADDER } from '../data/ladder';
import { techniqueBlurb } from '../data/levels';
import { loadSeenLessons, markLessonSeen } from '../services/persistence';
import type { Technique } from '../solver/humanSolver';
import { generateAllPuzzles } from './sudokuLogic';
import { buildLesson, firstLevelFor, lessonFor } from './lessons';

const puzzles = generateAllPuzzles();
const techniques = [...new Set(LADDER.map((step) => step.technique))];

describe('a lesson for every technique on the ladder', () => {
  it.each(techniques)('%s: a real position where the technique is the next step', (technique) => {
    const lesson = lessonFor(technique, puzzles)!;
    expect(lesson).not.toBeNull();
    expect(lesson.technique).toBe(technique);
    expect(lesson.step.technique).toBe(technique);
    expect(lesson.grid).toHaveLength(81);
    expect(lesson.answers.length).toBeGreaterThan(0);

    // It comes from the first level that asks for the technique.
    const level = firstLevelFor(technique)!;
    const source = puzzles.filter((puzzle) => puzzle.level === level);
    const solution = source
      .map((puzzle) => ({ puzzle, flat: puzzle.solutionGrid.flat() }))
      .find(({ flat }) => lesson.grid.every((value, cell) => value === 0 || value === flat[cell]))!.flat;

    // Nothing on the board contradicts the solution, and the right digit is always a candidate.
    lesson.grid.forEach((value, cell) => {
      if (value === 0) expect(lesson.candidates[cell]).toContain(solution[cell]);
      else expect(lesson.candidates[cell]).toEqual([]);
    });

    // What the step teaches is true.
    if (lesson.step.placement) {
      expect(solution[lesson.step.placement.cell]).toBe(lesson.step.placement.digit);
    }
    for (const removed of lesson.step.eliminations) {
      expect(solution[removed.cell]).not.toBe(removed.digit);
      expect(lesson.candidates[removed.cell]).toContain(removed.digit);
    }
  });

  it.each(techniques)('%s: every right answer is an empty cell the player can tap', (technique) => {
    const lesson = lessonFor(technique, puzzles)!;
    for (const cell of lesson.answers) expect(lesson.grid[cell]).toBe(0);
  });

  it.each(techniques)('%s: has a one-line description to show', (technique) => {
    const blurb = techniqueBlurb(technique)!;
    expect(blurb.ca.length).toBeGreaterThan(10);
    expect(blurb.es.length).toBeGreaterThan(10);
    expect(blurb.en?.length).toBeGreaterThan(10);
  });
});

describe('what the player is asked to tap', () => {
  const lessonOf = (technique: Technique) => lessonFor(technique, puzzles)!;

  it('naked single: any cell of the marked box with one candidate', () => {
    const lesson = lessonOf('naked-single');
    expect(lesson.task).toBe('place');
    expect(lesson.zone).toHaveLength(9);
    expect(lesson.answers).toContain(lesson.step.placement!.cell);
    for (const cell of lesson.answers) {
      expect(lesson.zone).toContain(cell);
      expect(lesson.candidates[cell]).toHaveLength(1);
    }
    // And no other cell of the box qualifies.
    const others = lesson.zone.filter((cell) => !lesson.answers.includes(cell));
    for (const cell of others) expect(lesson.candidates[cell].length).not.toBe(1);
  });

  it('hidden single: the one cell of the unit that takes the digit', () => {
    const lesson = lessonOf('hidden-single');
    expect(lesson.task).toBe('place');
    expect(lesson.answers).toEqual([lesson.step.placement!.cell]);
    const digit = lesson.step.placement!.digit;
    const places = lesson.zone.filter((cell) => lesson.candidates[cell].includes(digit));
    expect(places).toEqual(lesson.answers);
  });

  it('a hidden pair is found, not shown: the pattern is the answer', () => {
    const lesson = lessonOf('hidden-pair');
    expect(lesson.task).toBe('find-pattern');
    expect(lesson.pattern).toEqual([]);
    expect(lesson.answers).toEqual([...lesson.step.cells].sort((a, b) => a - b));
    expect(lesson.zone).toHaveLength(9);
  });

  it.each(['locked-candidates', 'naked-pair', 'naked-triple', 'x-wing', 'xy-wing', 'swordfish', 'short-chain'] as const)(
    '%s: the pattern is shown and the answer is a cell that loses a candidate',
    (technique) => {
      const lesson = lessonOf(technique);
      expect(lesson.task).toBe('eliminate');
      expect(lesson.pattern.length).toBeGreaterThan(0);
      expect(lesson.answers).toEqual(
        [...new Set(lesson.step.eliminations.map((removed) => removed.cell))].sort((a, b) => a - b),
      );
      // Tapping the pattern itself is not the answer.
      expect(lesson.answers.filter((cell) => lesson.pattern.includes(cell))).toEqual([]);
    },
  );
});

describe('buildLesson', () => {
  it('returns null for a puzzle that never needs the technique', () => {
    const easy = puzzles.find((puzzle) => puzzle.level === 1)!;
    expect(buildLesson('x-wing', easy.initialGrid.flat())).toBeNull();
  });

  it('has no lesson for a technique that is not on the ladder', () => {
    expect(firstLevelFor('naked-quad')).toBeNull();
    expect(lessonFor('naked-quad', puzzles)).toBeNull();
  });
});

describe('lessons already seen', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty and remembers each technique once', () => {
    expect(loadSeenLessons()).toEqual([]);
    markLessonSeen('naked-single');
    markLessonSeen('x-wing');
    markLessonSeen('naked-single');
    expect(loadSeenLessons()).toEqual(['naked-single', 'x-wing']);
  });

  it('treats corrupt data as nothing seen', () => {
    localStorage.setItem('maestros_lessons_seen_v1', '{oops');
    expect(loadSeenLessons()).toEqual([]);
    localStorage.setItem('maestros_lessons_seen_v1', '{"a":1}');
    expect(loadSeenLessons()).toEqual([]);
  });
});
