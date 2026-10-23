import React from 'react';
import { BrandLogo } from '../BrandLogo';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { Home } from 'lucide-react';

/** Compact single-line title with safe-area spacing below the status bar. */
export const HeaderBar: React.FC<{ showHome?: boolean; onHome?: () => void }> = ({
  showHome = false,
  onHome,
}) => {
  const { language } = useGame();

  return (
    <header className="relative w-full sticky top-0 z-30 safe-top px-3 pb-2.5 backdrop-blur-md bg-black/45 border-b border-white/10 shadow-lg">
      <BrandLogo header />
      {showHome && onHome && (
        <button
          type="button"
          onClick={onHome}
          title={getTranslation(language, 'home')}
          aria-label={getTranslation(language, 'home')}
          className="absolute right-3 bottom-2 flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-white/10 text-white/90 transition hover:bg-white/20 active:scale-95"
        >
          <Home className="h-5 w-5" />
        </button>
      )}
    </header>
  );
};
