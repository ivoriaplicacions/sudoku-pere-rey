import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { localized } from '../../i18n/localized';
import { achievementsData } from '../../data/achievements';
import { X, Trophy, Lock } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { language, playerStats } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-5 text-white space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black">{getTranslation(language, 'achievements')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* List of achievements */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {achievementsData.map((ach) => {
            const isUnlocked = playerStats.unlockedAchievements.includes(ach.id) || playerStats.puzzlesCompleted > 0 && ach.id === 'first_win';

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-3 ${
                  isUnlocked
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-md shadow-amber-950/30'
                    : 'bg-black/40 border-white/10 text-white/50 opacity-60'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                  isUnlocked ? 'bg-amber-500/20 border border-amber-400/40' : 'bg-white/5'
                }`}>
                  {isUnlocked ? ach.icon : <Lock className="w-4 h-4 text-white/40" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-white">
                      {localized(ach.title, language)}
                    </h3>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {localized(ach.description, language)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
