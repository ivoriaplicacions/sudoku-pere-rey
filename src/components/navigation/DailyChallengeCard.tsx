import React, { useState } from 'react';
import { CalendarDays, ChevronDown, Play, Star } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import {
  dailyPuzzleId,
  dateKey,
  formatDay,
  formatMonth,
  monthCalendar,
  techniqueForDate,
  weekdayInitials,
} from '../../utils/dailyChallenge';
import { techniqueName } from '../../utils/hintExplainer';

/**
 * Today's sudoku, the same for every player, and a calendar of the month with
 * the days already played. Earlier days of the month can still be played.
 */
export const DailyChallengeCard: React.FC = () => {
  const { language, progressMap, startDailyChallenge, savedDailySession } = useGame();
  const [preparing, setPreparing] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Read when the card renders: a session that runs past midnight sees the new day.
  const today = dateKey();
  const todayResult = progressMap[dailyPuzzleId(today)];
  // Starting today's challenge again picks up where the player left it.
  const todayInProgress = savedDailySession?.puzzleId === dailyPuzzleId(today);
  const t = (key: string, params?: Record<string, string | number>) => getTranslation(language, key, params);

  const play = async (key: string) => {
    if (preparing) return;
    setPreparing(key);
    try {
      await startDailyChallenge(key);
    } finally {
      setPreparing(null);
    }
  };

  const month = monthCalendar(today);
  const playedThisMonth = month.days.filter((day) => progressMap[dailyPuzzleId(day.key)]?.completed).length;

  return (
    <section className="rounded-2xl border border-indigo-300/40 bg-gradient-to-r from-indigo-800/85 to-violet-800/80 p-4 text-white shadow-lg shadow-indigo-950/40">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/40 bg-indigo-300/20">
          <CalendarDays className="h-5 w-5 text-indigo-100" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-200">
            {t('dailyChallenge')} · {formatDay(today, language)}
          </p>
          <p className="mt-0.5 text-base font-black leading-tight">{techniqueName(techniqueForDate(today), language)}</p>
          <p className="mt-0.5 text-xs text-white/70">{t('dailySameForEveryone')}</p>
        </div>
        {todayResult?.completed ? (
          <div className="flex shrink-0 flex-col items-center" aria-label={t('dailyDoneStars', { stars: todayResult.stars })}>
            <span className="flex items-center gap-0.5">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  className={`h-4 w-4 ${n <= todayResult.stars ? 'fill-amber-300 text-amber-300' : 'text-white/30'}`}
                />
              ))}
            </span>
            <span className="mt-1 text-[11px] font-bold text-emerald-200">{t('dailyDone')}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void play(today)}
            disabled={preparing !== null}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2.5 text-sm font-black text-slate-950 transition active:scale-95 disabled:opacity-70"
          >
            <Play className="h-4 w-4 fill-slate-950" />
            {preparing === today ? t('dailyPreparing') : todayInProgress ? t('dailyContinue') : t('dailyPlay')}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowCalendar((open) => !open)}
        aria-expanded={showCalendar}
        className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/85 transition hover:bg-white/15"
      >
        <span>
          {t('dailyCalendar')} · {t('dailyPlayedThisMonth', { count: playedThisMonth })}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
      </button>

      {showCalendar && (
        <div className="mt-3 space-y-2">
          <p className="text-center text-xs font-bold text-white/80">
            {formatMonth(month.year, month.month, language)}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdayInitials(language).map((initial, index) => (
              <span key={index} className="text-[10px] font-bold uppercase text-white/50">
                {initial}
              </span>
            ))}
            {Array.from({ length: month.firstWeekday }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {month.days.map((day) => {
              const result = progressMap[dailyPuzzleId(day.key)];
              const done = Boolean(result?.completed);
              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={day.isFuture || preparing !== null}
                  onClick={() => void play(day.key)}
                  aria-label={`${formatDay(day.key, language)}${done ? ` · ${t('dailyDoneStars', { stars: result.stars })}` : ''}`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-bold transition ${
                    done
                      ? 'bg-amber-400/90 text-slate-950'
                      : day.isFuture
                        ? 'text-white/25'
                        : 'bg-white/10 text-white hover:bg-white/20'
                  } ${day.isToday ? 'ring-2 ring-white' : ''}`}
                >
                  <span>{preparing === day.key ? '…' : day.day}</span>
                  {done && <span className="text-[8px] leading-none">{'★'.repeat(result.stars)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
