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

/**
 * Each pack = 10 levels × 20 sudokus = 200 puzzles. The descriptions name the
 * techniques src/data/ladder.ts puts in those levels: keep the two in step.
 */
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
      ca: '200 sudokus gratuïts · de singles a candidats bloquejats',
      es: '200 sudokus gratis · de singles a candidatos bloqueados',
      en: '200 free sudokus · singles to locked candidates',
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
      ca: '200 sudokus · parells i trios',
      es: '200 sudokus · pares y tríos',
      en: '200 sudokus · pairs and triples',
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
      ca: '200 sudokus · X-Wing',
      es: '200 sudokus · X-Wing',
      en: '200 sudokus · X-Wing',
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
      ca: '200 sudokus · XY-Wing, Swordfish i cadenes',
      es: '200 sudokus · XY-Wing, Swordfish y cadenas',
      en: '200 sudokus · XY-Wing, Swordfish and chains',
    },
  },
];

/** Product IDs that must exist as one-time IAPs in Google Play and App Store Connect. */
export const BILLABLE_PRODUCT_IDS = CONTENT_PACKS.map((p) => p.productId).filter(
  (id): id is string => Boolean(id),
);

export function getPackForLevel(level: number): ContentPack | undefined {
  return CONTENT_PACKS.find((p) => level >= p.levelStart && level <= p.levelEnd);
}

export function getPackByProductId(productId: string): ContentPack | undefined {
  return CONTENT_PACKS.find((p) => p.productId === productId);
}

type PackLanguage = 'ca' | 'es' | 'en';

/** What the native store tells us about a product, keyed by product identifier. */
export type StoreProducts = Record<string, { title?: string; priceString?: string }>;

/**
 * Fallback only. The euro list price is not what a player outside the eurozone is
 * charged, so it may only be shown while the store price is still loading, or on web
 * where there is no billing at all.
 */
export function formatPrice(priceEur: number, language: PackLanguage): string {
  if (priceEur === 0) {
    return language === 'en' ? 'Free' : 'Gratis';
  }
  return '0,99 €';
}

/**
 * The price the store will actually charge, in the player's own currency and with their
 * own tax applied. Apple requires the StoreKit price to be the one on screen, and showing
 * a different figure would be misleading under the TRLGDCU anywhere.
 */
export function packPriceLabel(
  pack: ContentPack,
  products: StoreProducts,
  language: PackLanguage,
): string {
  if (pack.priceEur === 0) return formatPrice(0, language);
  const live = pack.productId ? products[pack.productId]?.priceString : undefined;
  return live ?? formatPrice(pack.priceEur, language);
}

/** Same price, labelled per pack so nobody reads it as a per-level charge. */
export function formatPackPrice(
  pack: ContentPack,
  products: StoreProducts,
  language: PackLanguage,
): string {
  if (pack.priceEur === 0) return formatPrice(0, language);
  return `${packPriceLabel(pack, products, language)} / pack`;
}
