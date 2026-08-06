import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { Settings, Flame, Trophy, Star, ShoppingBag } from 'lucide-react';

interface BottomBarProps {
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenStore: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onOpenSettings,
  onOpenAchievements,
  onOpenStore,
}) => {
  const { language, playerStats } = useGame();

  const dayLabel =
    playerStats.currentStreak === 1
      ? language === 'ca'
        ? 'dia'
        : language === 'es'
          ? 'día'
          : 'day'
      : getTranslation(language, 'days');

  const cell =
    'flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 h-12 rounded-xl active:scale-95 transition border';

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 safe-bottom px-2 pt-2 backdrop-blur-md bg-black/55 border-t border-white/10 shadow-[0_-8px_24px_rgba(0,0,0,0.35)]">
      <nav className="flex items-stretch gap-1.5 max-w-lg mx-auto w-full" aria-label="App bar">
        <div
          className={`${cell} bg-orange-500/20 border-orange-400/40 px-1`}
          title={`${getTranslation(language, 'streak')}: ${playerStats.currentStreak} ${dayLabel}`}
        >
          <Flame className="w-4 h-4 text-orange-300" />
          <span className="text-[11px] font-black text-amber-100 tabular-nums leading-none">
            {playerStats.currentStreak}
            <span className="font-semibold text-amber-200/75 ml-0.5">{dayLabel}</span>
          </span>
        </div>

        <div
          className={`${cell} bg-white/10 border-white/12 px-1`}
          title={getTranslation(language, 'stars')}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-black text-amber-200 tabular-nums leading-none">
            {playerStats.totalStars}
          </span>
        </div>

        <button
          onClick={onOpenStore}
          className={`${cell} bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/30`}
          aria-label={getTranslation(language, 'store')}
        >
          <ShoppingBag className="w-4 h-4 text-amber-300" />
          <span className="text-[10px] font-bold text-amber-200/90 leading-none truncate max-w-full px-0.5">
            {getTranslation(language, 'store')}
          </span>
        </button>

        <button
          onClick={onOpenAchievements}
          className={`${cell} bg-white/10 hover:bg-white/20 border-white/10`}
          aria-label={getTranslation(language, 'achievements')}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold text-white/80 leading-none truncate max-w-full px-0.5">
            {getTranslation(language, 'achievements')}
          </span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`${cell} bg-white/10 hover:bg-white/20 border-white/10`}
          aria-label={getTranslation(language, 'settings')}
        >
          <Settings className="w-4 h-4 text-slate-200" />
          <span className="text-[10px] font-bold text-white/80 leading-none truncate max-w-full px-0.5">
            {getTranslation(language, 'settings')}
          </span>
        </button>
      </nav>
    </footer>
  );
};
