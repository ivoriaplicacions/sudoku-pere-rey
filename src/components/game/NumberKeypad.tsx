import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { Edit3, Eraser, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';

export const NumberKeypad: React.FC = () => {
  const {
    language,
    board,
    inputNumber,
    eraseCell,
    giveHint,
    restartPuzzle,
    isNotesMode,
    setIsNotesMode,
    isPaused,
    setIsPaused,
    hintsUsed,
  } = useGame();

  // Count placed instances of each number 1-9
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  board.forEach(row => {
    row.forEach(cell => {
      if (cell.value >= 1 && cell.value <= 9 && !cell.isError) {
        counts[cell.value] = (counts[cell.value] || 0) + 1;
      }
    });
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-3 px-2">
      {/* Utility Action Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {/* Restart */}
        <button
          onClick={restartPuzzle}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10 text-white/90"
        >
          <RotateCcw className="w-4 h-4 text-cyan-300" />
          <span className="text-[10px] font-semibold mt-1">{getTranslation(language, 'restart')}</span>
        </button>

        {/* Erase */}
        <button
          onClick={eraseCell}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10 text-white/90"
        >
          <Eraser className="w-4 h-4 text-rose-300" />
          <span className="text-[10px] font-semibold mt-1">{getTranslation(language, 'eraser')}</span>
        </button>

        {/* Pencil Notes Toggle */}
        <button
          onClick={() => setIsNotesMode(prev => !prev)}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition border active:scale-95 ${
            isNotesMode
              ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
              : 'bg-white/10 border-white/10 hover:bg-white/20 text-white/90'
          }`}
        >
          <Edit3 className="w-4 h-4 text-amber-300" />
          <span className="text-[10px] font-semibold mt-1">
            {getTranslation(language, 'notes')} {isNotesMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Hint */}
        <button
          onClick={giveHint}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10 text-white/90 relative"
        >
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-semibold mt-1">{getTranslation(language, 'hint')}</span>
          {hintsUsed > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {hintsUsed}
            </span>
          )}
        </button>

        {/* Pause / Resume */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10 text-white/90"
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-purple-300" />}
          <span className="text-[10px] font-semibold mt-1">
            {isPaused ? getTranslation(language, 'resume') : getTranslation(language, 'pause')}
          </span>
        </button>
      </div>

      {/* Thumb-optimized Number Keypad 1-9 */}
      <div className="grid grid-cols-9 gap-1.5 pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const count = counts[num] || 0;
          const isCompleted = count >= 9;

          return (
            <button
              key={num}
              disabled={isCompleted}
              onClick={() => inputNumber(num)}
              className={`aspect-square rounded-2xl font-black text-xl sm:text-2xl flex flex-col items-center justify-center transition-all duration-150 border active:scale-90 ${
                isCompleted
                  ? 'bg-black/30 border-white/5 text-white/20 cursor-not-allowed'
                  : isNotesMode
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:bg-amber-900/60 shadow-lg shadow-amber-950/40'
                  : 'bg-slate-900/70 border-white/20 text-white hover:bg-slate-800/90 shadow-lg shadow-black/50'
              }`}
            >
              <span>{num}</span>
              <span className="text-[9px] font-medium opacity-60 leading-none">
                {9 - count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
