/**
 * A second copy of the player's data in the platform's own storage.
 *
 * The game reads and writes the WebView's localStorage: it is synchronous, which
 * the whole app relies on. But that storage belongs to the WebView, and the
 * system may clear it (iOS does under storage pressure, and a WebView update can
 * lose it). So every write is also sent to native storage: UserDefaults on iOS,
 * SharedPreferences on Android, both covered by the system's backups.
 *
 * At startup, before the app reads anything, reconcileWithNative brings the two
 * together. A key missing from the WebView is restored from the native copy; a
 * key the WebView has is copied to native storage. The first launch after this
 * update therefore copies everything across, which is the migration, and every
 * later launch repairs whichever side lost data.
 *
 * On the web there is no native storage and all of this does nothing.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/** What native storage has to offer. Tests pass their own. */
export interface NativeStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const preferencesStorage: NativeStorage = {
  get: async (key) => (await Preferences.get({ key })).value,
  set: (key, value) => Preferences.set({ key, value }),
  remove: (key) => Preferences.remove({ key }),
};

let storage: NativeStorage | null = null;
let mirrored: ReadonlySet<string> = new Set();

/**
 * Turns the native copy on for these keys. Called once at startup with the
 * platform's storage; tests call it with a fake.
 */
export function configureNativeStore(keys: readonly string[], native: NativeStorage | null): void {
  storage = native;
  mirrored = new Set(keys);
}

/** The platform's storage on a phone, or null on the web. */
export function platformNativeStorage(): NativeStorage | null {
  return Capacitor.isNativePlatform() ? preferencesStorage : null;
}

/**
 * Sends one write to native storage. Fire and forget: the game never waits on
 * it, and a failure only means the backup copy is a write behind.
 */
export function mirrorToNative(key: string, value: string | null): void {
  if (!storage || !mirrored.has(key)) return;
  const write = value === null ? storage.remove(key) : storage.set(key, value);
  write.catch(() => {
    // The next launch copies the WebView's value across again.
  });
}

export interface ReconcileReport {
  /** Keys the WebView had lost and got back from native storage. */
  restored: string[];
  /** Keys copied from the WebView to native storage. */
  copied: string[];
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Brings the WebView and native storage together, key by key. The WebView wins
 * where both have a value: it is what the game has been writing to.
 */
export async function reconcileWithNative(): Promise<ReconcileReport> {
  const report: ReconcileReport = { restored: [], copied: [] };
  if (!storage) return report;
  const native = storage;

  for (const key of mirrored) {
    try {
      const local = readLocal(key);
      const saved = await native.get(key);
      if (local === null && saved !== null) {
        if (writeLocal(key, saved)) report.restored.push(key);
      } else if (local !== null && local !== saved) {
        await native.set(key, local);
        report.copied.push(key);
      }
    } catch {
      // One key failing must not stop the rest, nor the app from starting.
    }
  }
  return report;
}

/**
 * Startup step: reconcile, but never hold the app up for long. If native
 * storage does not answer in time the game starts with what the WebView has.
 */
export async function reconcileBeforeStart(timeoutMs = 2500): Promise<ReconcileReport | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([reconcileWithNative(), timeout]);
}
