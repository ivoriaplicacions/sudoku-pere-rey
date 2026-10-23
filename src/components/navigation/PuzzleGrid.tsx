import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { ArrowLeft, Star, Clock, CheckCircle2, Play } from 'lucide-react';
import { ContinueBanner } from './ContinueBanner';
import { getTheme } from '../../data/themes';
import { puzzleCardStyles } from '../../utils/puzzleCardTheme';

export const PuzzleGrid: React.FC = () => {
  const { language, selectedLevel, puzzles, progressMap, startPuzzle, setView, savedSession, theme } =
    useGame();
  const isLightTheme = getTheme(theme).isLight === true;

  // Filter puzzles for selected level
  const levelPuzzles = puzzles.filter(p => p.level === selectedLevel);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 pb-2">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('level-select')}
          className={`flex items-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/20 active:scale-95 transition ${
            isLightTheme ? 'text-white bg-slate-900/75' : 'text-white/90 bg-white/15'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{getTranslation(language, 'backToLevels')}</span>
        </button>

        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30">
          {getTranslation(language, 'level')} {selectedLevel}
        </span>
      </div>

      <div className="text-center my-2 space-y-1">
        <h2 className={`text-2xl font-black tracking-tight ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
          {getTranslation(language, 'selectPuzzle')}
        </h2>
        <p className={`text-xs ${isLightTheme ? 'text-slate-800' : 'text-white/70'}`}>
          {getTranslation(language, 'puzzleSelectSubtitle')}
        </p>
      </div>

      {savedSession?.level === selectedLevel && <ContinueBanner />}

      {/* Grid of puzzles */}
      <div className="grid grid-cols-2 gap-3.5">
        {levelPuzzles.map((puzzle) => {
          const prog = progressMap[puzzle.id];
          const isCompleted = prog && prog.completed;
          const isInProgress = savedSession?.puzzleId === puzzle.id;
          const stars = prog ? prog.stars : 0;
          const bestTime = prog && prog.bestTime ? formatTime(prog.bestTime) : getTranslation(language, 'noRecord');
          const card = puzzleCardStyles({
            isLight: isLightTheme,
            isInProgress,
            isCompleted: Boolean(isCompleted),
          });

          return (
            <button
              key={puzzle.id}
              onClick={() => startPuzzle(puzzle)}
              className={`p-4 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl border text-left flex flex-col justify-between active:scale-95 ${card.card}`}
            >
              {/* Header: Puzzle Number & Status */}
              <div className="flex items-center justify-between">
                <span className={`font-extrabold text-base ${card.number}`}>
                  #{puzzle.puzzleNumber}
                </span>
                {isInProgress ? (
                  <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    {getTranslation(language, 'inProgress')}
                  </span>
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${card.idleBadge}`}>
                    <Play className="w-3 h-3 text-emerald-600 fill-emerald-600 ml-0.5" />
                  </div>
                )}
              </div>

              {/* Stars display */}
              <div className="flex items-center space-x-1 my-2">
                {[1, 2, 3].map((starIndex) => (
                  <Star
                    key={starIndex}
                    className={`w-4 h-4 ${
                      starIndex <= stars
                        ? 'text-amber-400 fill-amber-400 animate-pulse'
                        : card.emptyStar
                    }`}
                  />
                ))}
              </div>

              {/* Footer info */}
              <div className={`flex items-center justify-between text-[11px] border-t pt-2 mt-1 ${card.footer} ${card.divider}`}>
                <span className="flex items-center space-x-1">
                  <Clock className={`w-3 h-3 ${isLightTheme ? 'text-cyan-700' : 'text-cyan-400'}`} />
                  <span>{bestTime}</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${card.givenPill}`}>
                  {getTranslation(language, 'givenCount', { count: puzzle.givenCount })}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
