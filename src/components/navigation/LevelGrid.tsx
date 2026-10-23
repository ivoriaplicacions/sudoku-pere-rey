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
import { getTheme } from '../../data/themes';
import { levelCardStyles } from '../../utils/levelCardTheme';

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
    theme,
  } = useGame();
  const isLightTheme = getTheme(theme).isLight === true;

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 pb-2">
      <div className="text-center space-y-1 my-2">
        <h2
          className={`text-2xl font-black tracking-tight flex items-center justify-center gap-2 ${
            isLightTheme ? 'text-slate-900' : 'text-white'
          }`}
        >
          <Sparkles className="w-6 h-6 text-amber-400 animate-bounce" />
          {getTranslation(language, 'selectLevel')}
        </h2>
        <p className={`text-xs ${isLightTheme ? 'text-slate-800' : 'text-white/70'}`}>
          {getTranslation(language, 'subtitle')}
        </p>
      </div>

      <ContinueBanner />

      {CONTENT_PACKS.map((pack) => {
        const packLevels = LEVEL_LIST.filter((l) => l.packId === pack.id);
        return (
          <section key={pack.id} className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-2">
              <h3
                className={`text-xs font-extrabold uppercase tracking-[0.18em] ${
                  isLightTheme ? 'text-amber-900' : 'text-amber-300/90'
                }`}
              >
                {localized(pack.name, language)}
              </h3>
              <span className={`text-[10px] font-bold ${isLightTheme ? 'text-slate-700' : 'text-white/50'}`}>
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

                const card = levelCardStyles({
                  isLight: isLightTheme,
                  isUnlocked,
                  needsPurchase: Boolean(needsPurchase),
                });

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
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl border ${card.card}`}
                  >
                    <div className="flex items-center justify-between z-10 relative">
                      <div className="flex items-center space-x-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${card.icon}`}
                        >
                          {lvlInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${card.levelLabel}`}
                            >
                              {getTranslation(language, 'level')} {lvlInfo.level}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${card.givenPill}`}
                            >
                              {lvlInfo.givenRange}
                            </span>
                          </div>
                          <h3
                            className={`font-extrabold text-base leading-tight ${card.title}`}
                          >
                            {localized(lvlInfo.name, language)}
                          </h3>
                          <p
                            className={`text-xs mt-0.5 ${card.description}`}
                          >
                            {localized(lvlInfo.description, language)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        {isUnlocked ? (
                          <>
                            <div className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full border ${card.starsPill}`}>
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>
                                {levelStars} / {MAX_STARS_PER_LEVEL}
                              </span>
                            </div>
                            <span className={`text-[11px] font-medium ${card.completedText}`}>
                              {completedCount} / {PUZZLES_PER_LEVEL}{' '}
                              {getTranslation(language, 'totalCompleted')}
                            </span>
                          </>
                        ) : needsPurchase ? (
                          <div
                            className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              isLightTheme
                                ? 'text-amber-900 bg-amber-500/15 border-amber-600/25'
                                : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{getTranslation(language, 'buy')}</span>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              isLightTheme
                                ? 'text-rose-900 bg-rose-500/15 border-rose-600/30'
                                : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                            }`}
                          >
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
                      <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${card.progressTrack}`}>
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
