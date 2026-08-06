import type { LocalizedText } from '../i18n/localized';

export interface ContentPack {
  id: string;
  number: number;
  /** 0 = free */
  priceEur: number;
  levelStart: number;
  levelEnd: number;
  /** False until puzzle data exists for this pack */
  available: boolean;
  name: LocalizedText;
  description: LocalizedText;
}

/** Each pack = 10 levels × 20 sudokus = 200 puzzles */
export const CONTENT_PACKS: ContentPack[] = [
  {
    id: 'pack1',
    number: 1,
    priceEur: 0,
    levelStart: 1,
    levelEnd: 10,
    available: true,
    name: { ca: 'Pack Inicial', es: 'Pack Inicial', en: 'Starter Pack' },
    description: {
      ca: '200 sudokus gratuïts · 10 nivells',
      es: '200 sudokus gratis · 10 niveles',
      en: '200 free sudokus · 10 levels',
    },
  },
  {
    id: 'pack2',
    number: 2,
    priceEur: 0.99,
    levelStart: 11,
    levelEnd: 20,
    available: false,
    name: { ca: 'Pack II', es: 'Pack II', en: 'Pack II' },
    description: {
      ca: '200 sudokus nous · 10 nivells',
      es: '200 sudokus nuevos · 10 niveles',
      en: '200 new sudokus · 10 levels',
    },
  },
  {
    id: 'pack3',
    number: 3,
    priceEur: 0.99,
    levelStart: 21,
    levelEnd: 30,
    available: false,
    name: { ca: 'Pack III', es: 'Pack III', en: 'Pack III' },
    description: {
      ca: '200 sudokus nous · 10 nivells',
      es: '200 sudokus nuevos · 10 niveles',
      en: '200 new sudokus · 10 levels',
    },
  },
];

export function getPackForLevel(level: number): ContentPack | undefined {
  return CONTENT_PACKS.find((p) => level >= p.levelStart && level <= p.levelEnd);
}

export function formatPrice(priceEur: number, language: 'ca' | 'es' | 'en'): string {
  if (priceEur === 0) {
    return language === 'en' ? 'Free' : 'Gratis';
  }
  return `0,99 €`;
}
