import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { Settings, Flame, Trophy, Star } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';

interface HeaderBarProps {
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenSettings, onOpenAchievements }) => {
  const { language, playerStats } = useGame();

  const dayLabel =
    playerStats.currentStreak === 1
      ? language === 'ca'
        ? 'dia'
        : 'día'
      : getTranslation(language, 'days');

  return (
    <header className="w-full px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 backdrop-blur-md bg-black/40 border-b border-white/10 text-white shadow-lg sticky top-0 z-30">
      <div className="min-w-0 shrink">
        <BrandLogo compact />
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Streak — compact pill, same language as the stars chip */}
        <div
          className="flex items-center gap-1.5 h-9 pl-1.5 pr-2.5 rounded-xl bg-orange-500/20 border border-orange-400/40"
          title={`${getTranslation(language, 'streak')}: ${playerStats.currentStreak} ${dayLabel}`}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black text-amber-100 tabular-nums leading-none">
            {playerStats.currentStreak}
          </span>
          <span className="text-[11px] font-semibold text-amber-200/80 leading-none">
            {dayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 h-9 px-2.5 rounded-xl bg-white/10 border border-white/12">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-black text-amber-200 tabular-nums leading-none">
            {playerStats.totalStars}
          </span>
        </div>

        <button
          onClick={onOpenAchievements}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10"
          aria-label={getTranslation(language, 'achievements')}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onOpenSettings}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10"
          aria-label={getTranslation(language, 'settings')}
        >
          <Settings className="w-4 h-4 text-slate-200" />
        </button>
      </div>
    </header>
  );
};
