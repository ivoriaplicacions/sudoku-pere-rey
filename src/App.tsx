import React, { useState, useCallback, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { GameProvider, useGame } from './context/GameContext';
import { getTheme } from './data/themes';
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
import { LegalModal, type LegalModalHandle } from './components/modals/LegalModal';
import { IntroSplash } from './components/IntroSplash';
import { getTranslation } from './i18n/translations';
import { hasSeenIntro, markIntroSeen } from './services/persistence';
import { exitNativeApp, hideNativeSplash } from './native/bootstrap';
import { usePhysicalKeyboard } from './hooks/usePhysicalKeyboard';
import { moveSelection } from './utils/boardHelpers';
import { ArrowLeft, Clock, AlertTriangle } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    language,
    theme,
    view,
    setView,
    selectedPuzzle,
    setSelectedCell,
    timerSeconds,
    mistakes,
    isPaused,
    setIsPaused,
    setIsNotesMode,
    inputNumber,
    eraseCell,
    undoMove,
    victoryData,
    closeVictoryModal,
  } = useGame();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const legalModalRef = useRef<LegalModalHandle>(null);
  const [showIntro, setShowIntro] = useState(() => !hasSeenIntro());
  const [introKey, setIntroKey] = useState(0);

  const finishIntro = useCallback(() => {
    markIntroSeen();
    setShowIntro(false);
  }, []);

  const replayIntro = useCallback(() => {
    setIntroKey((k) => k + 1);
    setShowIntro(true);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener('backButton', () => {
      if (showIntro) {
        finishIntro();
        return;
      }
      if (isLegalOpen) {
        if (legalModalRef.current?.closeNestedDoc()) return;
        setIsLegalOpen(false);
        return;
      }
      if (isStoreOpen) {
        setIsStoreOpen(false);
        return;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      if (isAchievementsOpen) {
        setIsAchievementsOpen(false);
        return;
      }
      if (victoryData) {
        closeVictoryModal();
        return;
      }
      if (view === 'game') {
        setView('puzzle-select');
        return;
      }
      if (view === 'puzzle-select') {
        setView('level-select');
        return;
      }
      void exitNativeApp();
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [
    showIntro,
    finishIntro,
    isStoreOpen,
    isLegalOpen,
    isSettingsOpen,
    isAchievementsOpen,
    victoryData,
    closeVictoryModal,
    view,
    setView,
  ]);

  const modalBlocking =
    showIntro ||
    isSettingsOpen ||
    isAchievementsOpen ||
    isStoreOpen ||
    isLegalOpen ||
    Boolean(victoryData);

  usePhysicalKeyboard({
    enabled: view === 'game' && !modalBlocking,
    isPaused,
    onDigit: inputNumber,
    onErase: eraseCell,
    onTogglePause: () => setIsPaused(!isPaused),
    onToggleNotes: () => setIsNotesMode((prev) => !prev),
    onUndo: undoMove,
    // Functional update: a held arrow key fires faster than React re-renders, and
    // reading selectedCell from the closure would drop every repeat but the last.
    onMove: (rowDelta, colDelta) =>
      setSelectedCell((current) => moveSelection(current, rowDelta, colDelta)),
  });

  useEffect(() => {
    void hideNativeSplash();
  }, []);

  const currentTheme = getTheme(theme);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans text-slate-100 bg-slate-950 select-none">
      {showIntro && <IntroSplash key={introKey} onFinished={finishIntro} />}

      <div
        className="fixed inset-0 z-0 transition-all duration-700"
        style={{ background: currentTheme.appBg }}
      />

      <div
        className="relative z-10 flex flex-col min-h-screen w-full"
        aria-hidden={showIntro}
      >
        <HeaderBar />

        <main
          className={`flex-1 flex flex-col justify-center items-center p-2 sm:p-4 ${
            view !== 'game' ? 'app-main-pad' : 'pb-4'
          }`}
        >
          {view === 'level-select' && <LevelGrid onOpenStore={() => setIsStoreOpen(true)} />}

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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReplayIntro={replayIntro}
        onOpenLegal={() => {
          setIsSettingsOpen(false);
          setIsLegalOpen(true);
        }}
      />
      <LegalModal ref={legalModalRef} isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
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
