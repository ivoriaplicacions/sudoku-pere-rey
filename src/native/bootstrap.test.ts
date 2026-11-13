import { beforeEach, describe, expect, it, vi } from 'vitest';

const statusBar = {
  setStyle: vi.fn().mockResolvedValue(undefined),
  setBackgroundColor: vi.fn().mockResolvedValue(undefined),
};
let platform = 'ios';
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => platform, isNativePlatform: () => platform !== 'web' },
}));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: statusBar,
  Style: { Dark: 'DARK', Light: 'LIGHT', Default: 'DEFAULT' },
}));
vi.mock('@capacitor/app', () => ({ App: { exitApp: vi.fn() } }));
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: { hide: vi.fn() } }));

const { bootstrapNative, matchStatusBarToPage } = await import('./bootstrap');

beforeEach(() => {
  platform = 'ios';
  Object.values(statusBar).forEach((fn) => fn.mockClear());
});

describe('status bar on iOS', () => {
  it('uses dark text over a light page', async () => {
    await matchStatusBarToPage(true);
    expect(statusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('uses white text over a dark page', async () => {
    await matchStatusBarToPage(false);
    expect(statusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
  });

  it('is left to the theme at startup, not forced to white text', async () => {
    await bootstrapNative();
    expect(statusBar.setStyle).not.toHaveBeenCalled();
  });

  it('keeps going if the plugin is missing', async () => {
    statusBar.setStyle.mockRejectedValueOnce(new Error('not implemented'));
    await expect(matchStatusBarToPage(true)).resolves.toBeUndefined();
  });
});

describe('status bar on Android', () => {
  beforeEach(() => {
    platform = 'android';
  });

  it('keeps white icons on the dark bar at startup', async () => {
    await bootstrapNative();
    expect(statusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
    expect(statusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#030712' });
  });

  it('does not follow the theme, because the bar behind the icons is always dark', async () => {
    await matchStatusBarToPage(true);
    expect(statusBar.setStyle).not.toHaveBeenCalled();
  });
});

describe('status bar on the web', () => {
  it('does nothing', async () => {
    platform = 'web';
    await bootstrapNative();
    await matchStatusBarToPage(true);
    expect(statusBar.setStyle).not.toHaveBeenCalled();
  });
});
