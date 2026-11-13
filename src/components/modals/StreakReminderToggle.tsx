import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { isReminderAvailable } from '../../services/streakReminder';

/**
 * Settings switch for the streak reminder. Only on a phone: the web has no
 * local notifications worth relying on.
 */
export const StreakReminderToggle: React.FC = () => {
  const { language, reminderEnabled, setReminderEnabled } = useGame();
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isReminderAvailable()) return null;
  const t = (key: string) => getTranslation(language, key);

  const toggle = async () => {
    setBusy(true);
    const result = await setReminderEnabled(!reminderEnabled);
    setDenied(result === 'denied');
    setBusy(false);
  };

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <span className="pr-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Bell className="w-4 h-4 text-cyan-300" />
            {t('reminderSetting')}
          </span>
          <span className="block text-[11px] text-white/60 leading-snug mt-0.5">{t('reminderSettingHelp')}</span>
        </span>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy}
          aria-label={`${t('reminderSetting')}: ${t(reminderEnabled ? 'enabled' : 'disabled')}`}
          aria-pressed={reminderEnabled}
          className={`w-12 h-7 rounded-full transition-all relative shrink-0 disabled:opacity-60 ${
            reminderEnabled ? 'bg-cyan-500' : 'bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-all absolute top-1 ${
              reminderEnabled ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
      {denied && (
        <p role="status" className="mt-2 text-xs font-bold text-rose-300">
          {t('reminderDenied')}
        </p>
      )}
    </div>
  );
};
