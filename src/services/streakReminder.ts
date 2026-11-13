/**
 * An optional reminder to keep the daily streak, as a local notification.
 *
 * Off until the player turns it on. Everything happens on the phone: the
 * notification is scheduled by the device and no data leaves it.
 *
 * There is only ever one reminder pending, at 20:00 on the next day the player
 * has not played yet. Each game moves it on. A player who stops opening the app
 * gets one reminder, not one a day.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getTranslation } from '../i18n/translations';
import type { Language, PlayerStats } from '../types/sudoku';
import { localDateStamp } from '../utils/streak';
import { STORAGE_KEYS, safeGetItem, safeSetItem } from './persistence';

export const REMINDER_ID = 2001;
export const REMINDER_HOUR = 20;

export function isReminderAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export function loadReminderEnabled(): boolean {
  return safeGetItem(STORAGE_KEYS.streakReminder) === 'true';
}

function atHour(date: Date, hour: number): Date {
  const at = new Date(date);
  at.setHours(hour, 0, 0, 0);
  return at;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * When the next reminder should go off: today at 20:00 if the player has not
 * played today and it is not 20:00 yet, otherwise tomorrow at 20:00.
 */
export function nextReminderAt(now: Date, lastPlayedDate: string): Date {
  const today = atHour(now, REMINDER_HOUR);
  const playedToday = lastPlayedDate === localDateStamp(now);
  if (!playedToday && now < today) return today;
  return addDays(today, 1);
}

/** The text of the reminder for the day it goes off. */
export function reminderText(
  at: Date,
  stats: Pick<PlayerStats, 'lastPlayedDate' | 'currentStreak'>,
  language: Language,
): { title: string; body: string } {
  // The streak is still alive on that day only if the player played the day before.
  const alive = stats.lastPlayedDate === localDateStamp(addDays(at, -1)) && stats.currentStreak > 0;
  return {
    title: getTranslation(language, 'reminderTitle'),
    body: !alive
      ? getTranslation(language, 'reminderNoStreak')
      : stats.currentStreak === 1
        ? getTranslation(language, 'reminderStreakOne')
        : getTranslation(language, 'reminderStreak', { count: stats.currentStreak }),
  };
}

/** Replaces the pending reminder with the next one. Does nothing if it is off. */
export async function rescheduleReminder(
  stats: Pick<PlayerStats, 'lastPlayedDate' | 'currentStreak'>,
  language: Language,
  now: Date = new Date(),
): Promise<void> {
  if (!isReminderAvailable() || !loadReminderEnabled()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    const at = nextReminderAt(now, stats.lastPlayedDate);
    const { title, body } = reminderText(at, stats, language);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title,
          body,
          schedule: { at, allowWhileIdle: true },
          // Not exact on purpose. Android would otherwise send the player to the
          // system "Alarms & reminders" screen to grant exact alarms, a permission
          // the app does not even declare (see AndroidManifest.xml). A reminder a
          // few minutes late is fine.
          isExactNotification: false,
        },
      ],
    });
  } catch {
    // Permission withdrawn in the system settings, or the plugin is missing.
  }
}

export type EnableResult = 'enabled' | 'denied' | 'unavailable';

/** Asks the system for permission, and schedules the first reminder if given. */
export async function enableReminder(
  stats: Pick<PlayerStats, 'lastPlayedDate' | 'currentStreak'>,
  language: Language,
): Promise<EnableResult> {
  if (!isReminderAvailable()) return 'unavailable';
  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return 'denied';
  } catch {
    return 'unavailable';
  }
  safeSetItem(STORAGE_KEYS.streakReminder, 'true');
  await rescheduleReminder(stats, language);
  return 'enabled';
}

export async function disableReminder(): Promise<void> {
  safeSetItem(STORAGE_KEYS.streakReminder, 'false');
  if (!isReminderAvailable()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch {
    // Nothing pending.
  }
}
