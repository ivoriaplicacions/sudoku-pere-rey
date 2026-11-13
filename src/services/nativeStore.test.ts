import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configureNativeStore, mirrorToNative, reconcileBeforeStart, reconcileWithNative } from './nativeStore';
import type { NativeStorage } from './nativeStore';
import { NATIVE_BACKUP_KEYS, STORAGE_KEYS, safeRemoveItem, safeSetItem } from './persistence';

/** A stand-in for UserDefaults / SharedPreferences. */
function fakeNative(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage: NativeStorage & { values: Map<string, string> } = {
    values,
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
  };
  return storage;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => localStorage.clear());
afterEach(() => configureNativeStore([], null));

describe('writes are mirrored to native storage', () => {
  it('copies every write and removal of a backed-up key', async () => {
    const native = fakeNative();
    configureNativeStore(NATIVE_BACKUP_KEYS, native);

    safeSetItem(STORAGE_KEYS.stats, '{"xp":10}');
    await flush();
    expect(native.values.get(STORAGE_KEYS.stats)).toBe('{"xp":10}');

    safeRemoveItem(STORAGE_KEYS.stats);
    await flush();
    expect(native.values.has(STORAGE_KEYS.stats)).toBe(false);
  });

  it('leaves keys it was not asked to keep alone', async () => {
    const native = fakeNative();
    configureNativeStore(NATIVE_BACKUP_KEYS, native);
    safeSetItem('something_else', 'x');
    await flush();
    expect(native.values.size).toBe(0);
  });

  it('does nothing on the web', () => {
    configureNativeStore(NATIVE_BACKUP_KEYS, null);
    expect(() => mirrorToNative(STORAGE_KEYS.stats, 'x')).not.toThrow();
  });

  it('never lets a failing native write reach the game', async () => {
    const broken: NativeStorage = {
      get: () => Promise.reject(new Error('down')),
      set: () => Promise.reject(new Error('down')),
      remove: () => Promise.reject(new Error('down')),
    };
    configureNativeStore(NATIVE_BACKUP_KEYS, broken);
    expect(() => safeSetItem(STORAGE_KEYS.stats, 'x')).not.toThrow();
    await flush();
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe('x');
  });
});

describe('reconciling at startup', () => {
  it('first launch after the update: copies what the WebView has to native storage', async () => {
    localStorage.setItem(STORAGE_KEYS.progress, '{"L1_P1":{}}');
    localStorage.setItem(STORAGE_KEYS.stats, '{"xp":900}');
    const native = fakeNative();
    configureNativeStore(NATIVE_BACKUP_KEYS, native);

    const report = await reconcileWithNative();
    expect(report.copied.sort()).toEqual([STORAGE_KEYS.progress, STORAGE_KEYS.stats].sort());
    expect(report.restored).toEqual([]);
    expect(native.values.get(STORAGE_KEYS.stats)).toBe('{"xp":900}');
  });

  it('WebView storage cleared by the system: restores everything from native storage', async () => {
    const native = fakeNative({
      [STORAGE_KEYS.stats]: '{"xp":900,"totalStars":12}',
      [STORAGE_KEYS.theme]: 'cosmic',
      [STORAGE_KEYS.catalogue]: '2',
    });
    configureNativeStore(NATIVE_BACKUP_KEYS, native);

    const report = await reconcileWithNative();
    expect(report.restored.sort()).toEqual([STORAGE_KEYS.catalogue, STORAGE_KEYS.stats, STORAGE_KEYS.theme].sort());
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe('{"xp":900,"totalStars":12}');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('cosmic');
  });

  it('the WebView wins when both have a value: it is what the game was writing to', async () => {
    localStorage.setItem(STORAGE_KEYS.stats, '{"xp":1000}');
    const native = fakeNative({ [STORAGE_KEYS.stats]: '{"xp":900}' });
    configureNativeStore(NATIVE_BACKUP_KEYS, native);

    await reconcileWithNative();
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe('{"xp":1000}');
    expect(native.values.get(STORAGE_KEYS.stats)).toBe('{"xp":1000}');
  });

  it('does nothing when both already agree', async () => {
    localStorage.setItem(STORAGE_KEYS.stats, '{"xp":5}');
    const native = fakeNative({ [STORAGE_KEYS.stats]: '{"xp":5}' });
    configureNativeStore(NATIVE_BACKUP_KEYS, native);
    expect(await reconcileWithNative()).toEqual({ restored: [], copied: [] });
  });

  it('keeps the owned-packs cache in the native copy too', () => {
    expect(NATIVE_BACKUP_KEYS).toContain('maestros_owned_packs_v1');
  });

  it('a key that fails does not stop the others', async () => {
    const native = fakeNative({ [STORAGE_KEYS.theme]: 'zen' });
    const flaky: NativeStorage = {
      ...native,
      get: (key) => (key === STORAGE_KEYS.stats ? Promise.reject(new Error('bad')) : native.get(key)),
    };
    configureNativeStore(NATIVE_BACKUP_KEYS, flaky);
    const report = await reconcileWithNative();
    expect(report.restored).toEqual([STORAGE_KEYS.theme]);
  });

  it('does not hold the app up if native storage never answers', async () => {
    const stuck: NativeStorage = {
      get: () => new Promise(() => {}),
      set: () => new Promise(() => {}),
      remove: () => new Promise(() => {}),
    };
    configureNativeStore(NATIVE_BACKUP_KEYS, stuck);
    const started = Date.now();
    expect(await reconcileBeforeStart(50)).toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('on the web reports nothing and touches nothing', async () => {
    localStorage.setItem(STORAGE_KEYS.stats, '{"xp":5}');
    configureNativeStore(NATIVE_BACKUP_KEYS, null);
    expect(await reconcileWithNative()).toEqual({ restored: [], copied: [] });
  });
});
