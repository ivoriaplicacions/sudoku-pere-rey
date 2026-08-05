import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { localized } from '../../i18n/localized';
import { Lock, Star, Sparkles } from 'lucide-react';
import type { LevelInfo } from '../../types/sudoku';
import { PUZZLES_PER_LEVEL } from '../../utils/sudokuLogic';

const LEVEL_LIST: LevelInfo[] = [
  { level: 1, name: { ca: 'Iniciació', es: 'Iniciación' }, givenRange: '50 números', icon: '🌱', description: { ca: 'Perfecte per començar', es: 'Perfecto para empezar' } },
  { level: 2, name: { ca: 'Fàcil', es: 'Fácil' }, givenRange: '46 números', icon: '⭐', description: { ca: 'Molt accessible', es: 'Muy accesible' } },
  { level: 3, name: { ca: 'Principiant', es: 'Principiante' }, givenRange: '42 números', icon: '🧩', description: { ca: 'Desafiament suau', es: 'Desafío suave' } },
  { level: 4, name: { ca: 'Mitjà', es: 'Medio' }, givenRange: '39 números', icon: '🔥', description: { ca: 'Agilitat mental', es: 'Agilidad mental' } },
  { level: 5, name: { ca: 'Intermedi', es: 'Intermedio' }, givenRange: '37 números', icon: '🎯', description: { ca: 'Nivell equilibrat', es: 'Nivel equilibrado' } },
  { level: 6, name: { ca: 'Avançat', es: 'Avanzado' }, givenRange: '35 números', icon: '⚡', description: { ca: 'Requereix concentració', es: 'Requiere concentración' } },
  { level: 7, name: { ca: 'Desafiament', es: 'Desafío' }, givenRange: '33 números', icon: '🏆', description: { ca: 'Tècniques avançades', es: 'Técnicas avanzadas' } },
  { level: 8, name: { ca: 'Expert', es: 'Experto' }, givenRange: '32 números', icon: '💎', description: { ca: 'Per a jugadors versats', es: 'Para jugadores versados' } },
  { level: 9, name: { ca: 'Extrem', es: 'Extremo' }, givenRange: '31 números', icon: '🌌', description: { ca: 'Dificultat màxima', es: 'Máxima dificultad' } },
  { level: 10, name: { ca: 'Mestre', es: 'Maestro' }, givenRange: '30 números', icon: '👑', description: { ca: 'Només per als millors', es: 'Solo para los mejores' } },
];

const MAX_STARS_PER_LEVEL = PUZZLES_PER_LEVEL * 3;

export const LevelGrid: React.FC = () => {
  const { language, setSelectedLevel, setView, progressMap, playerStats } = useGame();

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 pb-20">
      <div className="text-center space-y-1 my-2">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
          {getTranslation(language, 'selectLevel')}
        </h2>
        <p className="text-xs text-white/70">
          {getTranslation(language, 'subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {LEVEL_LIST.map((lvlInfo) => {
          const isUnlocked = lvlInfo.level === 1 || playerStats.puzzlesCompleted >= (lvlInfo.level - 1) * 2;

          let levelStars = 0;
          let completedCount = 0;
          for (let p = 1; p <= PUZZLES_PER_LEVEL; p++) {
            const prog = progressMap[`L${lvlInfo.level}_P${p}`];
            if (prog && prog.completed) {
              completedCount++;
              levelStars += prog.stars;
            }
          }

          const levelProgressPct = (completedCount / PUZZLES_PER_LEVEL) * 100;

          return (
            <button
              key={lvlInfo.level}
              disabled={!isUnlocked}
              onClick={() => {
                setSelectedLevel(lvlInfo.level);
                setView('puzzle-select');
              }}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl border ${
                isUnlocked
                  ? 'bg-slate-900/60 hover:bg-slate-800/80 border-white/20 active:scale-[0.98] shadow-lg shadow-black/40 group'
                  : 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between z-10 relative">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                    isUnlocked ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20' : 'bg-white/5'
                  }`}>
                    {lvlInfo.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        {getTranslation(language, 'level')} {lvlInfo.level}
                      </span>
                      <span className="text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                        {lvlInfo.givenRange}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-white text-base leading-tight">
                      {localized(lvlInfo.name, language)}
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {localized(lvlInfo.description, language)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  {isUnlocked ? (
                    <>
                      <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{levelStars} / {MAX_STARS_PER_LEVEL}</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {completedCount} / {PUZZLES_PER_LEVEL} {getTranslation(language, 'totalCompleted')}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center space-x-1 text-xs font-semibold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{getTranslation(language, 'locked')}</span>
                    </div>
                  )}
                </div>
              </div>

              {isUnlocked && (
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-500"
                    style={{ width: `${levelProgressPct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
