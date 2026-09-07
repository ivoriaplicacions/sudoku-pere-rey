import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
  isNative: false,
  billingSupported: false,
  purchases: [] as { productIdentifier: string }[],
  products: [] as { identifier: string; title?: string; priceString?: string }[],
  purchaseProduct: vi.fn(async () => undefined),
  restorePurchases: vi.fn(async () => undefined),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.isNative },
}));

vi.mock('@capgo/native-purchases', () => ({
  PURCHASE_TYPE: { INAPP: 'inapp' },
  NativePurchases: {
    isBillingSupported: async () => ({ isBillingSupported: native.billingSupported }),
    getPurchases: async () => ({ purchases: native.purchases }),
    getProducts: async () => ({ products: native.products }),
    purchaseProduct: (...args: unknown[]) => native.purchaseProduct(...(args as [])),
    restorePurchases: () => native.restorePurchases(),
  },
}));

import { CONTENT_PACKS } from '../data/packs';
import {
  getOwnedPacks,
  isLevelAccessible,
  isPackOwned,
  loadStoreProducts,
  purchasePack,
  restorePurchases,
  syncPurchasesFromStore,
} from './monetization';

const STORAGE_KEY = 'maestros_owned_packs_v1';
const FREE = CONTENT_PACKS.find((p) => p.priceEur === 0)!;
const PAID = CONTENT_PACKS.find((p) => p.priceEur > 0)!;
const OTHER_PAID = CONTENT_PACKS.filter((p) => p.priceEur > 0)[1]!;

beforeEach(() => {
  localStorage.clear();
  native.isNative = false;
  native.billingSupported = false;
  native.purchases = [];
  native.products = [];
  native.purchaseProduct.mockClear();
  native.restorePurchases.mockClear();
});

describe('ownership', () => {
  it('always owns the free pack, even with nothing stored', () => {
    expect(getOwnedPacks()).toContain(FREE.id);
    expect(isPackOwned(FREE.id)).toBe(true);
  });

  it('survives corrupt storage without losing the free pack', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(getOwnedPacks()).toEqual([FREE.id]);
  });

  it('does not own a paid pack by default', () => {
    expect(isPackOwned(PAID.id)).toBe(false);
  });

  it('rejects a pack id that does not exist', () => {
    expect(isPackOwned('pack-does-not-exist')).toBe(false);
  });
});

describe('isLevelAccessible', () => {
  it('opens free levels and closes paid ones', () => {
    expect(isLevelAccessible(FREE.levelStart)).toBe(true);
    expect(isLevelAccessible(PAID.levelStart)).toBe(false);
  });

  it('opens a paid pack once it is owned', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([PAID.id]));
    expect(isLevelAccessible(PAID.levelStart)).toBe(true);
    expect(isLevelAccessible(PAID.levelEnd)).toBe(true);
  });

  it('closes a level that belongs to no pack', () => {
    expect(isLevelAccessible(9999)).toBe(false);
  });
});

describe('purchasePack on a native build', () => {
  // The guard that stops a signed build from handing out paid content for free.
  it('never grants a pack when billing is unavailable', async () => {
    native.isNative = true;
    native.billingSupported = false;

    const result = await purchasePack(PAID.id);

    expect(result).toEqual({ ok: false, error: 'billing_unavailable' });
    expect(isPackOwned(PAID.id)).toBe(false);
    expect(native.purchaseProduct).not.toHaveBeenCalled();
  });

  it('grants the pack after the store confirms the receipt', async () => {
    native.isNative = true;
    native.billingSupported = true;
    native.purchaseProduct.mockImplementationOnce(async () => {
      native.purchases = [{ productIdentifier: PAID.productId! }];
    });

    const result = await purchasePack(PAID.id);

    expect(result.ok).toBe(true);
    expect(isPackOwned(PAID.id)).toBe(true);
  });

  it('reports a cancelled purchase without granting anything', async () => {
    native.isNative = true;
    native.billingSupported = true;
    native.purchaseProduct.mockRejectedValueOnce(new Error('Purchase was cancelled by user'));

    const result = await purchasePack(PAID.id);

    expect(result).toEqual({ ok: false, error: 'cancelled' });
    expect(isPackOwned(PAID.id)).toBe(false);
  });

  it('is a no-op for the free pack', async () => {
    native.isNative = true;
    await expect(purchasePack(FREE.id)).resolves.toEqual({ ok: true });
    expect(native.purchaseProduct).not.toHaveBeenCalled();
  });
});

describe('syncPurchasesFromStore', () => {
  it('treats receipts as the source of truth and drops stale local claims', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([PAID.id, OTHER_PAID.id]));
    native.isNative = true;
    native.billingSupported = true;
    native.purchases = [{ productIdentifier: OTHER_PAID.productId! }];

    const owned = await syncPurchasesFromStore();

    expect(owned).toContain(FREE.id);
    expect(owned).toContain(OTHER_PAID.id);
    expect(owned).not.toContain(PAID.id);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).not.toContain(PAID.id);
  });

  it('leaves the cache alone when there is no billing to ask', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([PAID.id]));
    native.isNative = true;
    native.billingSupported = false;

    await expect(syncPurchasesFromStore()).resolves.toContain(PAID.id);
  });

  it('ignores receipts for products the app does not know', async () => {
    native.isNative = true;
    native.billingSupported = true;
    native.purchases = [{ productIdentifier: 'some_other_app_product' }];

    await expect(syncPurchasesFromStore()).resolves.toEqual([FREE.id]);
  });
});

describe('restorePurchases', () => {
  it('fails loudly on a native build without billing', async () => {
    native.isNative = true;
    native.billingSupported = false;

    const result = await restorePurchases();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('billing_unavailable');
  });

  it('re-reads ownership from the store', async () => {
    native.isNative = true;
    native.billingSupported = true;
    native.purchases = [{ productIdentifier: PAID.productId! }];

    const result = await restorePurchases();

    expect(result.ok).toBe(true);
    expect(result.packs).toContain(PAID.id);
    expect(native.restorePurchases).toHaveBeenCalledOnce();
  });
});

describe('loadStoreProducts', () => {
  it('returns nothing when there is no billing, so the UI keeps its fallback', async () => {
    await expect(loadStoreProducts()).resolves.toEqual({});
  });

  it('maps products by identifier so prices can be looked up', async () => {
    native.isNative = true;
    native.billingSupported = true;
    native.products = [
      { identifier: PAID.productId!, title: 'Pack II', priceString: '$1.29' },
    ];

    await expect(loadStoreProducts()).resolves.toEqual({
      [PAID.productId!]: { title: 'Pack II', priceString: '$1.29' },
    });
  });
});
