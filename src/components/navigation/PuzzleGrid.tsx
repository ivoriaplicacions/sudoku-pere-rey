import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { ArrowLeft, Star, Clock, CheckCircle2, Play } from 'lucide-react';

export const PuzzleGrid: React.FC = () => {
  const { language, selectedLevel, puzzles, progressMap, startPuzzle, setView } = useGame();

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
          className="flex items-center space-x-2 text-xs font-bold text-white/90 bg-white/15 px-3 py-2 rounded-xl hover:bg-white/20 active:scale-95 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{getTranslation(language, 'backToLevels')}</span>
        </button>

        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30">
          {getTranslation(language, 'level')} {selectedLevel}
        </span>
      </div>

      <div className="text-center my-2 space-y-1">
        <h2 className="text-2xl font-black text-white tracking-tight">
          {getTranslation(language, 'selectPuzzle')}
        </h2>
        <p className="text-xs text-white/70">
          20 Sudokus resolubles amb repte progressiu
        </p>
      </div>

      {/* Grid of puzzles */}
      <div className="grid grid-cols-2 gap-3.5">
        {levelPuzzles.map((puzzle) => {
          const prog = progressMap[puzzle.id];
          const isCompleted = prog && prog.completed;
          const stars = prog ? prog.stars : 0;
          const bestTime = prog && prog.bestTime ? formatTime(prog.bestTime) : getTranslation(language, 'noRecord');

          return (
            <button
              key={puzzle.id}
              onClick={() => startPuzzle(puzzle)}
              className={`p-4 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl border text-left flex flex-col justify-between ${
                isCompleted
                  ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/60 border-white/20 hover:bg-slate-800/80 shadow-lg shadow-black/40'
              } active:scale-95`}
            >
              {/* Header: Puzzle Number & Status */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-base">
                  #{puzzle.puzzleNumber}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-3 h-3 text-white/80 fill-white ml-0.5" />
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
                        : 'text-white/20 fill-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between text-[11px] text-white/70 border-t border-white/10 pt-2 mt-1">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{bestTime}</span>
                </span>
                <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                  {puzzle.givenCount} givens
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
