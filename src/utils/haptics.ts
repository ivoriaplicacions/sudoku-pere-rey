import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

async function run(fn: () => Promise<void>): Promise<void> {
  if (!enabled || !Capacitor.isNativePlatform()) return;
  try {
    await fn();
  } catch {
    // Haptics unavailable on this device
  }
}

export function hapticTap(): void {
  void run(() => Haptics.impact({ style: ImpactStyle.Light }));
}

export function hapticSelect(): void {
  void run(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

export function hapticError(): void {
  void run(() => Haptics.notification({ type: NotificationType.Error }));
}

export function hapticSuccess(): void {
  void run(() => Haptics.notification({ type: NotificationType.Success }));
}
