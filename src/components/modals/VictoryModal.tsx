import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { Star, Trophy, Clock, ArrowRight } from 'lucide-react';

export const VictoryModal: React.FC = () => {
  const { language, victoryData, closeVictoryModal, selectedPuzzle, puzzles, startPuzzle } = useGame();

  if (!victoryData) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNextPuzzle = () => {
    closeVictoryModal();
    if (selectedPuzzle) {
      const nextP = puzzles.find(
        p => p.level === selectedPuzzle.level && p.puzzleNumber === selectedPuzzle.puzzleNumber + 1
      );
      if (nextP) {
        startPuzzle(nextP);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border border-amber-500/40 rounded-3xl p-6 text-center text-white space-y-5 shadow-2xl shadow-amber-500/20 relative overflow-hidden">
        
        {/* Glowing background star burst */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy Header */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
          <Trophy className="w-10 h-10 text-slate-950" />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {getTranslation(language, 'congratulations')}
          </h2>
          <p className="text-xs text-white/70 mt-1">
            {getTranslation(language, 'puzzleCompleted')}
          </p>
        </div>

        {/* Stars Earned Animation */}
        <div className="flex justify-center items-center space-x-2 py-2">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-9 h-9 transition-all duration-500 ${
                starIdx <= victoryData.stars
                  ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : 'text-white/20 fill-white/10'
              }`}
            />
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {getTranslation(language, 'timeElapsed')}
            </span>
            <span className="font-extrabold text-cyan-300 text-base mt-0.5">
              {formatTime(victoryData.time)}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-white/60 text-[11px] flex items-center gap-1">
              ⭐ {getTranslation(language, 'xpEarned')}
            </span>
            <span className="font-extrabold text-amber-300 text-base mt-0.5">
              +{victoryData.xpEarned} XP
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleNextPuzzle}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition"
          >
            <span>{getTranslation(language, 'nextPuzzle')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={closeVictoryModal}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/90 font-bold text-xs active:scale-95 transition border border-white/10"
          >
            {getTranslation(language, 'backToPuzzles')}
          </button>
        </div>
      </div>
    </div>
  );
};
