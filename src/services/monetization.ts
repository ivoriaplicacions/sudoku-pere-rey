import { CONTENT_PACKS } from '../data/packs';

const STORAGE_KEY = 'maestros_owned_packs_v1';

/** Pack 1 is always free and owned */
export function getOwnedPacks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    const owned = new Set<string>(['pack1', ...parsed]);
    return [...owned];
  } catch {
    return ['pack1'];
  }
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

/**
 * Purchase a content pack. Uses native IAP on mobile when integrated;
 * on web simulates purchase for development.
 */
export async function purchasePack(packId: string): Promise<{ ok: boolean; error?: string }> {
  const pack = CONTENT_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: false, error: 'pack_not_found' };
  if (pack.priceEur === 0) return { ok: true };
  if (!pack.available) return { ok: false, error: 'pack_not_available' };
  if (isPackOwned(packId)) return { ok: true };

  // TODO: wire Google Play Billing / App Store IAP via Capacitor plugin
  const owned = getOwnedPacks();
  owned.push(packId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(owned)]));
  return { ok: true };
}

export async function restorePurchases(): Promise<string[]> {
  // TODO: restore from store; for now return local owned packs
  return getOwnedPacks();
}
