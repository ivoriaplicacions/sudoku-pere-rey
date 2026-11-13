import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const STATUS_BAR_BG = '#030712';

export async function bootstrapNative(): Promise<void> {
  // Android paints the bar itself (and, from Android 15, shows the dark window
  // background behind it), so white icons are right whatever the theme. iOS draws
  // the page under the bar instead; see matchStatusBarToPage.
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: STATUS_BAR_BG });
  } catch {
    // Status bar plugin unavailable in some emulators
  }
}

/**
 * On iOS the page runs under the status bar (viewport-fit=cover), so the clock
 * and battery have to contrast with whatever the top of the page shows: dark
 * text over a light theme, white text over a dark theme or a modal's backdrop.
 */
export async function matchStatusBarToPage(pageTopIsLight: boolean): Promise<void> {
  if (Capacitor.getPlatform() !== 'ios') return;

  try {
    // Style.Light is "dark text for light backgrounds" and Style.Dark the reverse.
    await StatusBar.setStyle({ style: pageTopIsLight ? Style.Light : Style.Dark });
  } catch {
    // Status bar plugin unavailable in some simulators
  }
}

export async function hideNativeSplash(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    // Splash plugin unavailable in some simulators
  }
}

export async function exitNativeApp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await App.exitApp();
  } catch {
    // ignore
  }
}
