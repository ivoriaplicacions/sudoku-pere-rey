import { describe, expect, it } from 'vitest';
import { TECHNIQUES, solveWithTechniques } from '../solver/humanSolver';
import { LADDER, LEVEL_COUNT, PUZZLES_PER_LEVEL, techniqueForLevel } from './ladder';
import { buildLevelList } from './levels';
import { CONTENT_PACKS } from './packs';
import { PACKED_PUZZLES } from './puzzles';

describe('the ladder', () => {
  it('covers levels 1 to 40 with no gap and no overlap', () => {
    let next = 1;
    for (const step of LADDER) {
      expect(step.from).toBe(next);
      expect(step.to).toBeGreaterThanOrEqual(step.from);
      next = step.to + 1;
    }
    expect(LEVEL_COUNT).toBe(40);
    expect(next - 1).toBe(LEVEL_COUNT);
  });

  it('never asks for an easier technique than the level before', () => {
    for (let level = 2; level <= LEVEL_COUNT; level++) {
      const here = TECHNIQUES.indexOf(techniqueForLevel(level));
      const before = TECHNIQUES.indexOf(techniqueForLevel(level - 1));
      expect(here, `level ${level}`).toBeGreaterThanOrEqual(before);
    }
  });

  it('gives every paid pack a technique the packs before it do not ask for', () => {
    const seen = new Set<string>();
    for (const pack of CONTENT_PACKS) {
      const inPack = new Set<string>();
      for (let level = pack.levelStart; level <= pack.levelEnd; level++) inPack.add(techniqueForLevel(level));
      const fresh = [...inPack].filter((technique) => !seen.has(technique));
      expect(fresh.length, pack.id).toBeGreaterThan(0);
      // Nothing in a paid pack repeats what an earlier pack already offered.
      if (pack.priceEur > 0) expect(fresh.length, pack.id).toBe(inPack.size);
      for (const technique of inPack) seen.add(technique);
    }
  });

  it('rejects a level that is not on it', () => {
    expect(() => techniqueForLevel(0)).toThrow(/not on the ladder/);
    expect(() => techniqueForLevel(41)).toThrow(/not on the ladder/);
  });
});

describe('the shipped puzzles keep the promise of the ladder', () => {
  // `npm run puzzles:verify` checks the same in CI, with more detail. Keeping it
  // in the unit suite means a regenerated catalogue cannot slip past `npm test`.
  it('every puzzle demands exactly the technique of its level', () => {
    expect(PACKED_PUZZLES).toHaveLength(LEVEL_COUNT * PUZZLES_PER_LEVEL);
    const wrong: string[] = [];
    for (const entry of PACKED_PUZZLES) {
      const [level, number, , puzzle] = entry.split('|');
      const result = solveWithTechniques(puzzle);
      const expected = techniqueForLevel(Number(level));
      if (result.status !== 'solved' || result.hardest !== expected) {
        wrong.push(`L${level}_P${number}: ${result.status}, ${result.hardest}, wanted ${expected}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe('buildLevelList', () => {
  const levels = buildLevelList();

  it('describes all 40 levels, in order, each in its pack', () => {
    expect(levels.map((level) => level.level)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    expect(levels[0].packId).toBe('pack1');
    expect(levels[9].packId).toBe('pack1');
    expect(levels[10].packId).toBe('pack2');
    expect(levels[39].packId).toBe('pack4');
  });

  it('names each level after the technique it demands', () => {
    for (const level of levels) expect(level.technique).toBe(techniqueForLevel(level.level));
    expect(levels[0].name.es).toBe('Singles desnudos I');
    expect(levels[2].name.es).toBe('Singles desnudos III');
    expect(levels[3].name.es).toBe('Singles ocultos I');
    expect(levels[6].name.es).toBe('Candidatos bloqueados I');
    expect(levels[20].name.en).toBe('X-Wing I');
    expect(levels[29].name.ca).toBe('X-Wing X');
    expect(levels[39].name.es).toBe('Cadenas cortas IV');
  });

  it('gives every level a distinct name in the three languages', () => {
    for (const language of ['ca', 'es', 'en'] as const) {
      const names = levels.map((level) => level.name[language]);
      expect(names.every(Boolean)).toBe(true);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('shows the givens the puzzles of the level really have', () => {
    expect(levels[0].givenRange).toBe('50');
    expect(levels[5].givenRange).toBe('30');
    for (const level of levels) {
      const givens = PACKED_PUZZLES.filter((entry) => entry.startsWith(`${level.level}|`)).map((entry) =>
        Number(entry.split('|')[2]),
      );
      const [low, high = low] = level.givenRange.split('–').map(Number);
      expect(low).toBe(Math.min(...givens));
      expect(high).toBe(Math.max(...givens));
    }
  });
});
