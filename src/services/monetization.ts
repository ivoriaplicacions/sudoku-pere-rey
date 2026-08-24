import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import {
  BILLABLE_PRODUCT_IDS,
  CONTENT_PACKS,
  getPackByProductId,
} from '../data/packs';

const STORAGE_KEY = 'maestros_owned_packs_v1';
const FREE_PACK_ID = 'pack1';

export type PurchaseResult = { ok: boolean; error?: string };
export type RestoreResult = PurchaseResult & { packs: string[] };

function withFreePack(packIds: string[]): string[] {
  return [...new Set([FREE_PACK_ID, ...packIds])];
}

function readStoredOwned(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    return withFreePack(parsed);
  } catch {
    return [FREE_PACK_ID];
  }
}

function writeOwned(packIds: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withFreePack(packIds)));
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

/** Web + Vite dev only. Never grant packs on a native build without a store receipt. */
function canSimulatePurchases(): boolean {
  return !Capacitor.isNativePlatform() && import.meta.env.DEV;
}

/**
 * Replace paid ownership from store receipts. Pack 1 is always kept.
 * Local storage is a cache, not the source of truth when billing works.
 */
export async function syncPurchasesFromStore(): Promise<string[]> {
  if (!(await billingAvailable())) return getOwnedPacks();

  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
    });

    const owned = new Set<string>([FREE_PACK_ID]);
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

export async function purchasePack(packId: string): Promise<PurchaseResult> {
  const pack = CONTENT_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: false, error: 'pack_not_found' };
  if (pack.priceEur === 0) return { ok: true };
  if (!pack.available) return { ok: false, error: 'pack_not_available' };
  if (isPackOwned(packId)) return { ok: true };
  if (!pack.productId) return { ok: false, error: 'missing_product_id' };

  const useBilling = await billingAvailable();

  if (!useBilling) {
    if (canSimulatePurchases()) {
      writeOwned([...getOwnedPacks(), packId]);
      return { ok: true };
    }
    return { ok: false, error: 'billing_unavailable' };
  }

  try {
    await NativePurchases.purchaseProduct({
      productIdentifier: pack.productId,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
    });
    const synced = await syncPurchasesFromStore();
    if (!synced.includes(packId)) {
      writeOwned([...synced, packId]);
    }
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(message)) {
      return { ok: false, error: 'cancelled' };
    }
    console.warn('purchasePack failed', err);
    return { ok: false, error: 'purchase_failed' };
  }
}

export async function restorePurchases(): Promise<RestoreResult> {
  if (canSimulatePurchases()) {
    return { ok: true, packs: getOwnedPacks() };
  }

  if (!(await billingAvailable())) {
    return { ok: false, error: 'billing_unavailable', packs: getOwnedPacks() };
  }

  try {
    await NativePurchases.restorePurchases();
    const packs = await syncPurchasesFromStore();
    return { ok: true, packs };
  } catch (err) {
    console.warn('restorePurchases native call failed', err);
    return { ok: false, error: 'restore_failed', packs: getOwnedPacks() };
  }
}

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
