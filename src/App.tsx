import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { themes } from './data/themes';
import { HeaderBar } from './components/navigation/HeaderBar';
import { BottomBar } from './components/navigation/BottomBar';
import { LevelGrid } from './components/navigation/LevelGrid';
import { PuzzleGrid } from './components/navigation/PuzzleGrid';
import { SudokuBoard } from './components/game/SudokuBoard';
import { NumberKeypad } from './components/game/NumberKeypad';
import { VictoryModal } from './components/modals/VictoryModal';
import { AchievementsModal } from './components/modals/AchievementsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { StoreModal } from './components/modals/StoreModal';
import { IntroSplash } from './components/IntroSplash';
import { getTranslation } from './i18n/translations';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    language,
    theme,
    view,
    setView,
    selectedPuzzle,
    timerSeconds,
    mistakes,
    isPaused,
    setIsPaused,
  } = useGame();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introKey, setIntroKey] = useState(0);
  const wasHiddenRef = useRef(false);

  const finishIntro = useCallback(() => setShowIntro(false), []);

  const replayIntro = useCallback(() => {
    setIntroKey((k) => k + 1);
    setShowIntro(true);
  }, []);

  // Replay intro every time the app returns to the foreground
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
        return;
      }
      if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        replayIntro();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) replayIntro();
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [replayIntro]);

  const currentTheme = themes[theme];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans text-slate-100 bg-slate-950 select-none">
      {showIntro && <IntroSplash key={introKey} onFinished={finishIntro} />}

      <div
        className="fixed inset-0 bg-cover bg-center transition-all duration-700 z-0 scale-105"
        style={{ backgroundImage: `url(${currentTheme.bgImage})` }}
      />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <HeaderBar />

        <main
          className={`flex-1 flex flex-col justify-center items-center p-2 sm:p-4 ${
            view !== 'game' ? 'app-main-pad' : 'pb-4'
          }`}
        >
          {view === 'level-select' && <LevelGrid />}

          {view === 'puzzle-select' && <PuzzleGrid />}

          {view === 'game' && selectedPuzzle && (
            <div className="w-full max-w-md space-y-3 pb-8">
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => setView('puzzle-select')}
                  className="flex items-center space-x-1.5 text-xs font-bold text-white/90 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 hover:bg-black/60 active:scale-95 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{getTranslation(language, 'puzzle')} #{selectedPuzzle.puzzleNumber}</span>
                </button>

                <div className="flex items-center space-x-3 text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="flex items-center space-x-1 text-cyan-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(timerSeconds)}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{mistakes}</span>
                  </div>
                </div>
              </div>

              {isPaused ? (
                <div className="w-full aspect-square bg-black/80 backdrop-blur-xl rounded-3xl border border-white/20 flex flex-col items-center justify-center space-y-4 text-center p-6">
                  <span className="text-4xl">⏸️</span>
                  <h3 className="text-2xl font-black text-white">
                    {getTranslation(language, 'gamePaused')}
                  </h3>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition"
                  >
                    {getTranslation(language, 'resume')}
                  </button>
                </div>
              ) : (
                <SudokuBoard />
              )}

              {!isPaused && <NumberKeypad />}
            </div>
          )}
        </main>

        {view !== 'game' && (
          <BottomBar
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onOpenStore={() => setIsStoreOpen(true)}
          />
        )}
      </div>

      <VictoryModal />
      <AchievementsModal isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <StoreModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}

export default App;
