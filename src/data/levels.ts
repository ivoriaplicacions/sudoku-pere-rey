import type { LocalizedText } from '../i18n/localized';
import type { Technique } from '../solver/humanSolver';
import { LADDER } from './ladder';
import { CONTENT_PACKS } from './packs';
import { PACKED_PUZZLES } from './puzzles';

/**
 * What a level is called and what it says about itself. Both come from the
 * technique the level demands, so the text cannot promise more than the puzzles.
 */
type Trilingual = Required<LocalizedText>;

const TECHNIQUE_TEXT: Partial<Record<Technique, { name: Trilingual; description: Trilingual }>> = {
  'naked-single': {
    name: { ca: 'Singles nus', es: 'Singles desnudos', en: 'Naked singles' },
    description: {
      ca: 'Caselles on només hi cap un número',
      es: 'Casillas donde solo cabe un número',
      en: 'Cells where only one digit fits',
    },
  },
  'hidden-single': {
    name: { ca: 'Singles ocults', es: 'Singles ocultos', en: 'Hidden singles' },
    description: {
      ca: 'Un número que només cap en una casella',
      es: 'Un número que solo cabe en una casilla',
      en: 'A digit with only one place to go',
    },
  },
  'locked-candidates': {
    name: { ca: 'Candidats bloquejats', es: 'Candidatos bloqueados', en: 'Locked candidates' },
    description: {
      ca: 'Un número atrapat en una línia de la seva caixa',
      es: 'Un número atrapado en una línea de su caja',
      en: 'A digit trapped in one line of its box',
    },
  },
  'naked-pair': {
    name: { ca: 'Parells nus', es: 'Pares desnudos', en: 'Naked pairs' },
    description: {
      ca: 'Dues caselles que es reparteixen dos números',
      es: 'Dos casillas que se reparten dos números',
      en: 'Two cells that share two digits',
    },
  },
  'naked-triple': {
    name: { ca: 'Trios nus', es: 'Tríos desnudos', en: 'Naked triples' },
    description: {
      ca: 'Tres caselles que es reparteixen tres números',
      es: 'Tres casillas que se reparten tres números',
      en: 'Three cells that share three digits',
    },
  },
  'hidden-pair': {
    name: { ca: 'Parells ocults', es: 'Pares ocultos', en: 'Hidden pairs' },
    description: {
      ca: 'Dos números que només caben en dues caselles',
      es: 'Dos números que solo caben en dos casillas',
      en: 'Two digits with only two places to go',
    },
  },
  'x-wing': {
    name: { ca: 'X-Wing', es: 'X-Wing', en: 'X-Wing' },
    description: {
      ca: 'Un número en dues línies i les mateixes dues posicions',
      es: 'Un número en dos líneas y las mismas dos posiciones',
      en: 'One digit, two lines, the same two positions',
    },
  },
  'xy-wing': {
    name: { ca: 'XY-Wing', es: 'XY-Wing', en: 'XY-Wing' },
    description: {
      ca: 'Tres caselles de dos números enllaçades',
      es: 'Tres casillas de dos números enlazadas',
      en: 'Three two-digit cells linked together',
    },
  },
  swordfish: {
    name: { ca: 'Swordfish', es: 'Swordfish', en: 'Swordfish' },
    description: {
      ca: 'Un número en tres línies i les mateixes tres posicions',
      es: 'Un número en tres líneas y las mismas tres posiciones',
      en: 'One digit, three lines, the same three positions',
    },
  },
  'short-chain': {
    name: { ca: 'Cadenes curtes', es: 'Cadenas cortas', en: 'Short chains' },
    description: {
      ca: 'Dos enllaços d’un mateix número encadenats',
      es: 'Dos enlaces de un mismo número encadenados',
      en: 'Two links of one digit chained together',
    },
  },
};

/** The one-line description of a technique, as its levels show it. */
export function techniqueBlurb(technique: Technique): LocalizedText | undefined {
  return TECHNIQUE_TEXT[technique]?.description;
}

const ICONS = ['🌱', '⭐', '🧩', '🔥', '🎯', '⚡', '🏆', '💎', '🌌', '👑'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export interface LevelDefinition {
  level: number;
  packId: string;
  packNumber: number;
  /** The hardest technique every puzzle of the level demands. */
  technique: Technique;
  name: LocalizedText;
  /** Givens of the level's puzzles, read from the puzzles: "50" or "23–27". */
  givenRange: string;
  icon: string;
  description: LocalizedText;
}

/** The fewest and most givens among the puzzles of each level. */
function givenRangesByLevel(): Map<number, string> {
  const bounds = new Map<number, { min: number; max: number }>();
  for (const entry of PACKED_PUZZLES) {
    const [level, , givens] = entry.split('|').map(Number);
    const seen = bounds.get(level);
    if (seen) {
      seen.min = Math.min(seen.min, givens);
      seen.max = Math.max(seen.max, givens);
    } else {
      bounds.set(level, { min: givens, max: givens });
    }
  }
  const ranges = new Map<number, string>();
  for (const [level, { min, max }] of bounds) {
    ranges.set(level, min === max ? String(min) : `${min}–${max}`);
  }
  return ranges;
}

export function buildLevelList(): LevelDefinition[] {
  const givenRanges = givenRangesByLevel();

  // "X-Wing IV" is the fourth level that asks for an X-Wing, wherever it falls.
  const levelsPerTechnique = new Map<Technique, number>();
  for (const step of LADDER) {
    levelsPerTechnique.set(
      step.technique,
      (levelsPerTechnique.get(step.technique) ?? 0) + step.to - step.from + 1,
    );
  }
  const seenPerTechnique = new Map<Technique, number>();

  const levels: LevelDefinition[] = [];
  for (const step of LADDER) {
    const text = TECHNIQUE_TEXT[step.technique];
    if (!text) throw new Error(`No level text for technique "${step.technique}"`);

    for (let level = step.from; level <= step.to; level++) {
      const pack = CONTENT_PACKS.find((p) => level >= p.levelStart && level <= p.levelEnd);
      if (!pack) throw new Error(`Level ${level} belongs to no pack`);

      const position = seenPerTechnique.get(step.technique) ?? 0;
      seenPerTechnique.set(step.technique, position + 1);
      const numeral = (levelsPerTechnique.get(step.technique) ?? 1) > 1 ? ` ${ROMAN[position]}` : '';

      levels.push({
        level,
        packId: pack.id,
        packNumber: pack.number,
        technique: step.technique,
        name: {
          ca: `${text.name.ca}${numeral}`,
          es: `${text.name.es}${numeral}`,
          en: `${text.name.en}${numeral}`,
        },
        givenRange: givenRanges.get(level) ?? '',
        icon: ICONS[(level - 1) % ICONS.length],
        description: text.description,
      });
    }
  }
  return levels;
}
