import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn().mockResolvedValue({ notifications: [] }),
  cancel: vi.fn().mockResolvedValue(undefined),
};
let native = true;
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));

const {
  REMINDER_ID,
  disableReminder,
  enableReminder,
  loadReminderEnabled,
  nextReminderAt,
  reminderText,
  rescheduleReminder,
} = await import('./streakReminder');

// Local times: the reminder follows the player's own clock.
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

beforeEach(() => {
  localStorage.clear();
  native = true;
  Object.values(plugin).forEach((fn) => fn.mockClear());
  plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
});

describe('when the reminder goes off', () => {
  it('today at 20:00 if the player has not played yet today', () => {
    expect(nextReminderAt(at(13, 9), '2026-11-12')).toEqual(at(13, 20));
  });

  it('tomorrow at 20:00 once the player has played today', () => {
    expect(nextReminderAt(at(13, 9), '2026-11-13')).toEqual(at(14, 20));
  });

  it('tomorrow at 20:00 if it is already past 20:00', () => {
    expect(nextReminderAt(at(13, 21, 30), '2026-11-12')).toEqual(at(14, 20));
  });

  it('crosses into the next month', () => {
    expect(nextReminderAt(at(30, 22), '2026-11-30')).toEqual(new Date(2026, 11, 1, 20));
  });
});

describe('what it says', () => {
  it('names the streak while it is still alive', () => {
    const text = reminderText(at(14, 20), { lastPlayedDate: '2026-11-13', currentStreak: 6 }, 'es');
    expect(text.body).toBe('Tu racha de 6 días sigue viva: juega un sudoku hoy para no perderla.');
  });

  it('does not say "1 days" for a streak that started yesterday', () => {
    const text = reminderText(at(14, 20), { lastPlayedDate: '2026-11-13', currentStreak: 1 }, 'es');
    expect(text.body).toBe('Ayer empezaste una racha: juega un sudoku hoy para alargarla.');
  });

  it('does not boast of a streak that is already broken', () => {
    const text = reminderText(at(14, 20), { lastPlayedDate: '2026-11-10', currentStreak: 6 }, 'es');
    expect(text.body).toBe('El sudoku de hoy te espera, y también el reto diario.');
  });

  it('reads well in the three languages', () => {
    for (const language of ['ca', 'es', 'en'] as const) {
      const text = reminderText(at(14, 20), { lastPlayedDate: '2026-11-13', currentStreak: 2 }, language);
      expect(text.title).toBe('SUDOKU KING');
      expect(text.body).not.toMatch(/[{}]|undefined/);
    }
  });
});

describe('turning it on and off', () => {
  const stats = { lastPlayedDate: '2026-11-13', currentStreak: 3 };

  it('is off until the player turns it on', () => {
    expect(loadReminderEnabled()).toBe(false);
  });

  it('asks the system for permission only when it is not granted yet', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.requestPermissions.mockResolvedValue({ display: 'granted' });
    expect(await enableReminder(stats, 'es')).toBe('enabled');
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
    expect(loadReminderEnabled()).toBe(true);
  });

  it('stays off if the player refuses the permission', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.requestPermissions.mockResolvedValue({ display: 'denied' });
    expect(await enableReminder(stats, 'es')).toBe('denied');
    expect(loadReminderEnabled()).toBe(false);
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('keeps exactly one reminder pending: the old one is cancelled first', async () => {
    await enableReminder(stats, 'es');
    await rescheduleReminder(stats, 'es');
    expect(plugin.cancel).toHaveBeenLastCalledWith({ notifications: [{ id: REMINDER_ID }] });
    const lastSchedule = plugin.schedule.mock.calls.at(-1)?.[0];
    expect(lastSchedule.notifications).toHaveLength(1);
    expect(lastSchedule.notifications[0].id).toBe(REMINDER_ID);
    expect(lastSchedule.notifications[0].schedule.allowWhileIdle).toBe(true);
    // An exact alarm would send the player to Android's "Alarms & reminders" screen.
    expect(lastSchedule.notifications[0].isExactNotification).toBe(false);
  });

  it('schedules nothing while it is off', async () => {
    await rescheduleReminder(stats, 'es');
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('turning it off cancels the pending reminder', async () => {
    await enableReminder(stats, 'es');
    await disableReminder();
    expect(loadReminderEnabled()).toBe(false);
    expect(plugin.cancel).toHaveBeenLastCalledWith({ notifications: [{ id: REMINDER_ID }] });
  });

  it('is not offered on the web', async () => {
    native = false;
    expect(await enableReminder(stats, 'es')).toBe('unavailable');
    expect(plugin.schedule).not.toHaveBeenCalled();
  });
});
