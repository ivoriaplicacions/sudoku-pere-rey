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
  /** Google Play / App Store product ID (managed product / non-consumable) */
  productId: string | null;
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
    productId: null,
    name: { ca: 'Pack Inicial', es: 'Pack Inicial', en: 'Starter Pack' },
    description: {
      ca: '200 sudokus gratuïts · nivells 1–10',
      es: '200 sudokus gratis · niveles 1–10',
      en: '200 free sudokus · levels 1–10',
    },
  },
  {
    id: 'pack2',
    number: 2,
    priceEur: 0.99,
    levelStart: 11,
    levelEnd: 20,
    available: true,
    productId: 'maestros_pack_2',
    name: { ca: 'Pack II', es: 'Pack II', en: 'Pack II' },
    description: {
      ca: '200 sudokus nous · nivells 11–20',
      es: '200 sudokus nuevos · niveles 11–20',
      en: '200 new sudokus · levels 11–20',
    },
  },
  {
    id: 'pack3',
    number: 3,
    priceEur: 0.99,
    levelStart: 21,
    levelEnd: 30,
    available: true,
    productId: 'maestros_pack_3',
    name: { ca: 'Pack III', es: 'Pack III', en: 'Pack III' },
    description: {
      ca: '200 sudokus nous · nivells 21–30',
      es: '200 sudokus nuevos · niveles 21–30',
      en: '200 new sudokus · levels 21–30',
    },
  },
  {
    id: 'pack4',
    number: 4,
    priceEur: 0.99,
    levelStart: 31,
    levelEnd: 40,
    available: true,
    productId: 'maestros_pack_4',
    name: { ca: 'Pack IV', es: 'Pack IV', en: 'Pack IV' },
    description: {
      ca: '200 sudokus nous · nivells 31–40',
      es: '200 sudokus nuevos · niveles 31–40',
      en: '200 new sudokus · levels 31–40',
    },
  },
];

/** Product IDs that must exist as one-time IAPs in Google Play Console. */
export const BILLABLE_PRODUCT_IDS = CONTENT_PACKS.map((p) => p.productId).filter(
  (id): id is string => Boolean(id),
);

export function getPackForLevel(level: number): ContentPack | undefined {
  return CONTENT_PACKS.find((p) => level >= p.levelStart && level <= p.levelEnd);
}

export function getPackByProductId(productId: string): ContentPack | undefined {
  return CONTENT_PACKS.find((p) => p.productId === productId);
}

export function formatPrice(priceEur: number, language: 'ca' | 'es' | 'en'): string {
  if (priceEur === 0) {
    return language === 'en' ? 'Free' : 'Gratis';
  }
  return `0,99 €`;
}
