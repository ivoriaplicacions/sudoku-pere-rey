import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import {
  BILLABLE_PRODUCT_IDS,
  CONTENT_PACKS,
  getPackByProductId,
} from '../data/packs';

const STORAGE_KEY = 'maestros_owned_packs_v1';

function readStoredOwned(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    return [...new Set(['pack1', ...parsed])];
  } catch {
    return ['pack1'];
  }
}

function writeOwned(packIds: string[]): void {
  const owned = [...new Set(['pack1', ...packIds])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
}

function markOwned(packId: string): string[] {
  const owned = readStoredOwned();
  if (!owned.includes(packId)) owned.push(packId);
  writeOwned(owned);
  return owned;
}

/** Pack 1 is always free and owned */
export function getOwnedPacks(): string[] {
  return readStoredOwned();
}

export function isPackOwned(packId: string): boolean {
  const pack = CONTENT_PACKS.find((p) => p.id === packId);
  if (!pack) return false;
  if (pack.priceEur === 0) return true;
  return getOwnedPacks().includes(packId);
}

export function isLevelAccessible(level: number): boolean {
  const pack = CONTENT_PACKS.find((p) => level >= p.levelStart && level <= p.levelEnd);
  if (!pack) return false;
  if (!pack.available) return false;
  return isPackOwned(pack.id);
}

async function billingAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    return Boolean(isBillingSupported);
  } catch {
    return false;
  }
}

/**
 * Sync owned packs from Google Play / App Store purchases into local storage.
 */
export async function syncPurchasesFromStore(): Promise<string[]> {
  if (!(await billingAvailable())) return getOwnedPacks();

  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
    });

    const owned = new Set(getOwnedPacks());
    for (const purchase of purchases ?? []) {
      const productId = purchase.productIdentifier;
      if (!productId) continue;
      const pack = getPackByProductId(productId);
      if (pack) owned.add(pack.id);
    }
    writeOwned([...owned]);
    return [...owned];
  } catch (err) {
    console.warn('syncPurchasesFromStore failed', err);
    return getOwnedPacks();
  }
}

/**
 * Purchase a content pack via Google Play Billing on Android (or App Store on iOS).
 * On web / unsupported billing, simulates purchase for local development.
 */
export async function purchasePack(packId: string): Promise<{ ok: boolean; error?: string }> {
  const pack = CONTENT_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: false, error: 'pack_not_found' };
  if (pack.priceEur === 0) return { ok: true };
  if (!pack.available) return { ok: false, error: 'pack_not_available' };
  if (isPackOwned(packId)) return { ok: true };
  if (!pack.productId) return { ok: false, error: 'missing_product_id' };

  const useBilling = await billingAvailable();

  if (!useBilling) {
    // Dev / web fallback so the store UI can be exercised without Play Console.
    markOwned(packId);
    return { ok: true };
  }

  try {
    await NativePurchases.purchaseProduct({
      productIdentifier: pack.productId,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
    });
    markOwned(packId);
    await syncPurchasesFromStore();
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // User cancelled is not a hard failure for the UI.
    if (/cancel/i.test(message)) {
      return { ok: false, error: 'cancelled' };
    }
    console.warn('purchasePack failed', err);
    return { ok: false, error: 'purchase_failed' };
  }
}

export async function restorePurchases(): Promise<string[]> {
  if (!(await billingAvailable())) {
    return getOwnedPacks();
  }

  try {
    await NativePurchases.restorePurchases();
  } catch (err) {
    console.warn('restorePurchases native call failed', err);
  }

  return syncPurchasesFromStore();
}

/** Prefetch product metadata (price, title) when billing is available. */
export async function loadStoreProducts(): Promise<
  Record<string, { title?: string; priceString?: string }>
> {
  if (!(await billingAvailable()) || BILLABLE_PRODUCT_IDS.length === 0) {
    return {};
  }

  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: BILLABLE_PRODUCT_IDS,
      productType: PURCHASE_TYPE.INAPP,
    });

    const map: Record<string, { title?: string; priceString?: string }> = {};
    for (const product of products ?? []) {
      if (!product.identifier) continue;
      map[product.identifier] = {
        title: product.title,
        priceString: product.priceString,
      };
    }
    return map;
  } catch (err) {
    console.warn('loadStoreProducts failed', err);
    return {};
  }
}
