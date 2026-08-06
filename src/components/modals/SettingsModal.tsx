import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { localized } from '../../i18n/localized';
import { themes } from '../../data/themes';
import type { Language, ThemeId } from '../../types/sudoku';
import { X, Palette, CheckCircle, Globe, Vibrate } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES: { id: Language; labelKey: string }[] = [
  { id: 'ca', labelKey: 'catalan' },
  { id: 'es', labelKey: 'spanish' },
  { id: 'en', labelKey: 'english' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    autoCheckErrors,
    setAutoCheckErrors,
    hapticsEnabled,
    setHapticsEnabled,
  } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fade-in">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-black">{getTranslation(language, 'settings')}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-8">
        <section className="space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {getTranslation(language, 'language')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map(({ id, labelKey }) => (
              <button
                key={id}
                onClick={() => setLanguage(id)}
                className={`py-2.5 rounded-xl text-sm font-bold transition active:scale-[0.98] ${
                  language === id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {getTranslation(language, labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-xs font-extrabold uppercase tracking-wider text-white/70">
            {getTranslation(language, 'theme')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(themes) as ThemeId[]).map((themeKey) => {
              const th = themes[themeKey];
              const isSelected = theme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className={`rounded-2xl border overflow-hidden text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="relative aspect-[4/3]">
                    <img
                      src={th.bgImage}
                      alt={localized(th.name, language)}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between gap-1">
                      <span className="text-xs font-bold text-white leading-snug drop-shadow">
                        {localized(th.name, language)}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-cyan-300 shrink-0" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-sm font-bold pr-3">{getTranslation(language, 'autoCheckErrors')}</span>
            <button
              onClick={() => setAutoCheckErrors(!autoCheckErrors)}
              className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
                autoCheckErrors ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all absolute top-1 ${
                  autoCheckErrors ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-sm font-bold pr-3 flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-cyan-300" />
              {getTranslation(language, 'haptics')}
            </span>
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
                hapticsEnabled ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all absolute top-1 ${
                  hapticsEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </section>

        <footer className="pt-4 pb-2 border-t border-white/10 text-center space-y-1.5">
          <p className="text-base font-extrabold tracking-wide text-amber-300/95">
            {getTranslation(language, 'footerPublisher')}
          </p>
          <p className="text-xs font-medium text-white/50 leading-relaxed px-2">
            {getTranslation(language, 'appName')}
          </p>
        </footer>
      </div>
    </div>
  );
};
