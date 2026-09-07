import React from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { localized } from '../../i18n/localized';
import { Lock, Star, Sparkles, ShoppingBag } from 'lucide-react';
import { PUZZLES_PER_LEVEL } from '../../utils/sudokuLogic';
import { CONTENT_PACKS, formatPackPrice, getPackForLevel } from '../../data/packs';
import { completionsNeededForLevel, requiresProgressGate } from '../../utils/levelProgress';
import { buildLevelList } from '../../data/levels';
import { ContinueBanner } from './ContinueBanner';

const LEVEL_LIST = buildLevelList();
const MAX_STARS_PER_LEVEL = PUZZLES_PER_LEVEL * 3;

export const LevelGrid: React.FC<{ onOpenStore?: () => void }> = ({ onOpenStore }) => {
  const {
    language,
    setSelectedLevel,
    setView,
    progressMap,
    playerStats,
    canAccessLevel,
    canPlayLevel,
    storeProducts,
  } = useGame();

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 pb-2">
      <div className="text-center space-y-1 my-2">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
          {getTranslation(language, 'selectLevel')}
        </h2>
        <p className="text-xs text-white/70">{getTranslation(language, 'subtitle')}</p>
      </div>

      <ContinueBanner />

      {CONTENT_PACKS.map((pack) => {
        const packLevels = LEVEL_LIST.filter((l) => l.packId === pack.id);
        return (
          <section key={pack.id} className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-300/90">
                {localized(pack.name, language)}
              </h3>
              <span className="text-[10px] font-bold text-white/50">
                {formatPackPrice(pack, storeProducts, language)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {packLevels.map((lvlInfo) => {
                const packAccessible = canAccessLevel(lvlInfo.level);
                const isUnlocked = canPlayLevel(lvlInfo.level);
                const packMeta = getPackForLevel(lvlInfo.level);
                const needsPurchase = !packAccessible && packMeta && packMeta.priceEur > 0;
                // Only the free pack is still gated by progress, so only it counts down.
                const progressLeft = requiresProgressGate(lvlInfo.level)
                  ? Math.max(
                      0,
                      completionsNeededForLevel(lvlInfo.level) - playerStats.puzzlesCompleted,
                    )
                  : 0;

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
                    disabled={!isUnlocked && !needsPurchase}
                    onClick={() => {
                      if (needsPurchase) {
                        onOpenStore?.();
                        return;
                      }
                      if (!isUnlocked) return;
                      setSelectedLevel(lvlInfo.level);
                      setView('puzzle-select');
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl border ${
                      isUnlocked
                        ? 'bg-slate-900/60 hover:bg-slate-800/80 border-white/20 active:scale-[0.98] shadow-lg shadow-black/40 group'
                        : needsPurchase
                          ? 'bg-amber-950/35 border-amber-400/35 active:scale-[0.98]'
                          : 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between z-10 relative">
                      <div className="flex items-center space-x-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                            isUnlocked
                              ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20'
                              : 'bg-white/5'
                          }`}
                        >
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
                              <span>
                                {levelStars} / {MAX_STARS_PER_LEVEL}
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-medium">
                              {completedCount} / {PUZZLES_PER_LEVEL}{' '}
                              {getTranslation(language, 'totalCompleted')}
                            </span>
                          </>
                        ) : needsPurchase ? (
                          <div className="flex items-center space-x-1 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{getTranslation(language, 'buy')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-xs font-semibold text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {progressLeft > 0
                                ? getTranslation(language, 'unlockProgress', { count: progressLeft })
                                : getTranslation(language, 'locked')}
                            </span>
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
          </section>
        );
      })}
    </div>
  );
};
