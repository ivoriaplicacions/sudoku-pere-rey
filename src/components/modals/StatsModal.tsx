import React, { useId, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { localized } from '../../i18n/localized';
import { CONTENT_PACKS } from '../../data/packs';
import { formatDuration, summarisePlayer } from '../../utils/playerSummary';
import { X, BarChart3, Star, Flame, Clock, Gauge, Palette, Trophy } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Tile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}> = ({ icon, label, value, sub }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </div>
    <p className="mt-1 text-xl font-black tabular-nums leading-none text-white">{value}</p>
    {sub && <p className="mt-1 text-[11px] text-white/50 tabular-nums">{sub}</p>}
  </div>
);

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { language, playerStats, progressMap } = useGame();
  const titleId = useId();
  const dialogRef = useModalAccessibility(isOpen, onClose);

  const summary = useMemo(
    () => summarisePlayer(playerStats, progressMap),
    [playerStats, progressMap],
  );

  if (!isOpen) return null;

  const percent = (done: number, total: number) =>
    total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-md flex-col space-y-4 rounded-3xl border border-white/20 bg-slate-900 p-5 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h2 id={titleId} className="min-w-0 break-words text-lg font-black leading-tight">
              {getTranslation(language, 'stats')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={getTranslation(language, 'close')}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95"
          >
            <X className="h-5 w-5 text-white/80" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {summary.puzzlesCompleted === 0 && (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-xs text-white/70">
              {getTranslation(language, 'statsEmpty')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Tile
              icon={<Trophy className="h-3.5 w-3.5 text-amber-400" />}
              label={getTranslation(language, 'totalCompleted')}
              value={`${summary.puzzlesCompleted}`}
              sub={`/ ${summary.puzzlesTotal} · ${percent(summary.puzzlesCompleted, summary.puzzlesTotal)}%`}
            />
            <Tile
              icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              label={getTranslation(language, 'stars')}
              value={`${summary.totalStars}`}
              sub={`/ ${summary.maxStars}`}
            />
            <Tile
              icon={<Clock className="h-3.5 w-3.5 text-cyan-300" />}
              label={getTranslation(language, 'bestTime')}
              value={formatDuration(summary.bestTime)}
            />
            <Tile
              icon={<Gauge className="h-3.5 w-3.5 text-cyan-300" />}
              label={getTranslation(language, 'statsAverageTime')}
              value={formatDuration(summary.averageTime)}
            />
            <Tile
              icon={<Star className="h-3.5 w-3.5 text-amber-300" />}
              label={getTranslation(language, 'statsPerfect')}
              value={`${summary.perfectPuzzles}`}
            />
            <Tile
              icon={<Star className="h-3.5 w-3.5 text-emerald-300" />}
              label={getTranslation(language, 'statsFlawless')}
              value={`${summary.flawlessPuzzles}`}
            />
            <Tile
              icon={<Flame className="h-3.5 w-3.5 text-orange-300" />}
              label={getTranslation(language, 'streak')}
              value={`${summary.currentStreak}`}
            />
            <Tile
              icon={<Palette className="h-3.5 w-3.5 text-violet-300" />}
              label={getTranslation(language, 'statsThemes')}
              value={`${summary.themesUnlocked}`}
              sub={`/ ${summary.themesTotal}`}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                {getTranslation(language, 'statsPlayerLevel')}
              </span>
              <span className="text-sm font-black tabular-nums text-cyan-300">
                {summary.playerLevel}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] tabular-nums text-white/50">{summary.xp} XP</p>
          </div>

          <section className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/55">
              {getTranslation(language, 'statsByPack')}
            </h3>
            {summary.packs.map((pack) => {
              const meta = CONTENT_PACKS.find((candidate) => candidate.id === pack.packId);
              const pct = percent(pack.completed, pack.total);
              return (
                <div key={pack.packId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-xs font-bold text-white/90">
                      {meta ? localized(meta.name, language) : pack.packId}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-white/60">
                      {pack.completed} / {pack.total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] tabular-nums text-amber-300/80">
                    {pack.stars} / {pack.maxStars} ★
                  </p>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};
