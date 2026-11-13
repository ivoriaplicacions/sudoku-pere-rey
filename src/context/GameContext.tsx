import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type {
  Language,
  ThemeId,
  PuzzleProgress,
  PlayerStats,
  CellState,
  CellPosition,
  HistoryEntry,
  Puzzle,
  InProgressSession,
} from '../types/sudoku';
import {
  generateAllPuzzles,
  calculateStars,
  MAX_HINTS_PER_PUZZLE,
} from '../utils/sudokuLogic';
import { canPlayLevel as isLevelPlayable } from '../utils/levelProgress';
import { isThemeUnlocked } from '../utils/themeUnlocks';
import { audioSynth } from '../utils/audio';
import {
  getOwnedPacks,
  isLevelAccessible,
  loadStoreProducts,
  purchasePack as purchasePackService,
  restorePurchases as restorePurchasesService,
  syncPurchasesFromStore,
  type PurchaseResult,
  type RestoreResult,
} from '../services/monetization';
import type { StoreProducts } from '../data/packs';
import {
  loadLanguage,
  saveLanguage,
  loadHapticsEnabled,
  saveHapticsEnabled,
  loadProgressMap,
  loadCarriedStars,
  saveProgressMap,
  loadPlayerStats,
  savePlayerStats,
  loadSession,
  saveSession,
  clearSession,
  buildSession,
  deserializeBoard,
  loadTheme,
  saveTheme,
  loadSoundEnabled,
  saveSoundEnabled,
  loadAutoCheckErrors,
  saveAutoCheckErrors,
  loadDigitFirst,
  saveDigitFirst,
} from '../services/persistence';
import {
  hapticTap,
  hapticSelect,
  hapticError,
  hapticSuccess,
  setHapticsEnabled,
} from '../utils/haptics';
import {
  cloneBoard,
  snapshotCell,
  snapshotHouse,
  clearNotesForDigit,
  fillAllNotes,
  restoreHistoryEntry,
} from '../utils/boardHelpers';
import { applyDailyStreak } from '../utils/streak';
import { explainNextStep, type ExplainedHint } from '../utils/hintExplainer';
import { evaluateNewAchievements } from '../data/achievements';
import confetti from 'canvas-confetti';

export interface ActiveHint {
  hint: ExplainedHint;
  index: number;
}

interface GameContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  view: 'level-select' | 'puzzle-select' | 'game';
  setView: (view: 'level-select' | 'puzzle-select' | 'game') => void;

  selectedLevel: number;
  setSelectedLevel: (lvl: number) => void;
  selectedPuzzle: Puzzle | null;
  setSelectedPuzzle: (p: Puzzle | null) => void;

  puzzles: Puzzle[];
  progressMap: Record<string, PuzzleProgress>;
  playerStats: PlayerStats;
  ownedPacks: string[];
  /** Localised titles and prices from Google Play / the App Store, by product id. */
  storeProducts: StoreProducts;
  purchasePack: (packId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<RestoreResult>;
  canAccessLevel: (level: number) => boolean;
  canPlayLevel: (level: number) => boolean;

  board: CellState[][];
  selectedCell: CellPosition | null;
  setSelectedCell: React.Dispatch<React.SetStateAction<CellPosition | null>>;
  isNotesMode: boolean;
  setIsNotesMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  timerSeconds: number;
  isPaused: boolean;
  setIsPaused: (val: boolean) => void;
  mistakes: number;
  hintsUsed: number;
  isCompleted: boolean;

  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (val: boolean) => void;
  autoCheckErrors: boolean;
  setAutoCheckErrors: (val: boolean) => void;
  /** Digit-first play: pick a digit, then tap the cells it goes in. */
  digitFirst: boolean;
  setDigitFirst: (val: boolean) => void;
  /** The digit picked up in digit-first mode, or null. */
  armedDigit: number | null;
  tapCell: (row: number, col: number) => void;

  startPuzzle: (puzzle: Puzzle, options?: { fresh?: boolean }) => void;
  resumeSession: () => void;
  savedSession: InProgressSession | null;
  inputNumber: (num: number) => void;
  eraseCell: () => void;
  fillNotes: () => void;
  giveHint: () => void;
  /** The hint on screen and the frame it is on, or null. */
  activeHint: ActiveHint | null;
  advanceHint: () => void;
  placeHint: () => void;
  closeHint: () => void;
  undoMove: () => void;
  canUndo: boolean;
  restartPuzzle: () => void;
  exitToMenu: () => void;

  victoryData: { stars: number; xpEarned: number; time: number } | null;
  closeVictoryModal: () => void;
}

const defaultPlayerStats: PlayerStats = {
  xp: 0,
  playerLevel: 1,
  totalStars: 0,
  puzzlesCompleted: 0,
  currentStreak: 0,
  lastPlayedDate: '',
  // Empty on a fresh install: availability is derived from stars. Whatever an
  // existing player already had is merged in by loadPlayerStats and acts as a floor.
  unlockedThemes: [],
  unlockedAchievements: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(loadLanguage);
  const [theme, setThemeState] = useState<ThemeId>(loadTheme);
  const [view, setView] = useState<'level-select' | 'puzzle-select' | 'game'>('level-select');

  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [ownedPacks, setOwnedPacks] = useState<string[]>(() => getOwnedPacks());
  const [storeProducts, setStoreProducts] = useState<StoreProducts>({});

  const [allPuzzles] = useState<Puzzle[]>(() => generateAllPuzzles());
  const [progressMap, setProgressMap] = useState<Record<string, PuzzleProgress>>(loadProgressMap);

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats(defaultPlayerStats));
  const [savedSession, setSavedSession] = useState<InProgressSession | null>(loadSession);

  const [board, setBoard] = useState<CellState[][]>([]);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(loadSoundEnabled);
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(loadHapticsEnabled);
  const [autoCheckErrors, setAutoCheckErrorsState] = useState<boolean>(loadAutoCheckErrors);
  const [digitFirst, setDigitFirstState] = useState<boolean>(loadDigitFirst);
  const [armedDigit, setArmedDigit] = useState<number | null>(null);

  const [victoryData, setVictoryData] = useState<{ stars: number; xpEarned: number; time: number } | null>(null);
  const [activeHint, setActiveHint] = useState<ActiveHint | null>(null);

  // A picked-up digit belongs to one puzzle, and is put down once all nine are placed.
  useEffect(() => {
    setArmedDigit(null);
  }, [selectedPuzzle]);
  useEffect(() => {
    if (armedDigit === null) return;
    const placed = board.flat().filter((cell) => cell.value === armedDigit && !cell.isError).length;
    if (placed >= 9) setArmedDigit(null);
  }, [board, armedDigit]);

  // A hint explains one position. Any change to the board, or leaving it, ends it.
  useEffect(() => {
    setActiveHint(null);
  }, [board, view, isPaused]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
  }, []);

  const setTheme = useCallback(
    (next: ThemeId) => {
      // The picker already hides locked themes; this keeps a stale saved value or a
      // future caller from putting the player in one they have not earned.
      if (!isThemeUnlocked(next, playerStats.totalStars, playerStats.unlockedThemes)) return;
      setThemeState(next);
      saveTheme(next);
    },
    [playerStats.totalStars, playerStats.unlockedThemes],
  );

  const setSoundEnabled = useCallback((val: boolean) => {
    setSoundEnabledState(val);
    saveSoundEnabled(val);
  }, []);

  const setDigitFirst = useCallback((val: boolean) => {
    setDigitFirstState(val);
    saveDigitFirst(val);
    setArmedDigit(null);
  }, []);

  const setAutoCheckErrors = useCallback((val: boolean) => {
    setAutoCheckErrorsState(val);
    saveAutoCheckErrors(val);
  }, []);

  const setHapticsEnabledSetting = useCallback((val: boolean) => {
    setHapticsEnabledState(val);
    setHapticsEnabled(val);
    saveHapticsEnabled(val);
  }, []);

  const dropSession = useCallback(() => {
    setSavedSession(null);
    clearSession();
  }, []);

  const canAccessLevel = (level: number) => isLevelAccessible(level);
  const canPlayLevel = (level: number) =>
    isLevelPlayable(level, playerStats.puzzlesCompleted, isLevelAccessible(level));

  const purchasePack = useCallback(async (packId: string): Promise<PurchaseResult> => {
    const result = await purchasePackService(packId);
    if (result.ok) {
      setOwnedPacks(getOwnedPacks());
      hapticSuccess();
    } else if (result.error !== 'cancelled') {
      hapticError();
    }
    return result;
  }, []);

  const restorePurchases = useCallback(async (): Promise<RestoreResult> => {
    const result = await restorePurchasesService();
    setOwnedPacks(result.packs);
    if (result.ok) hapticSuccess();
    else hapticError();
    return result;
  }, []);

  useEffect(() => {
    void (async () => {
      const synced = await syncPurchasesFromStore();
      setOwnedPacks(synced);
      setStoreProducts(await loadStoreProducts());
    })();
  }, []);

  useEffect(() => {
    audioSynth.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setHapticsEnabled(hapticsEnabled);
  }, [hapticsEnabled]);

  useEffect(() => {
    saveProgressMap(progressMap);
  }, [progressMap]);

  useEffect(() => {
    savePlayerStats(playerStats);
  }, [playerStats]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (view === 'game' && !isPaused && !isCompleted && board.length > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, isPaused, isCompleted, board]);

  useEffect(() => {
    if (view !== 'game' || isCompleted || !selectedPuzzle || board.length !== 9) return;
    const session = buildSession({
      puzzleId: selectedPuzzle.id,
      level: selectedPuzzle.level,
      puzzleNumber: selectedPuzzle.puzzleNumber,
      board,
      selectedCell,
      isNotesMode,
      timerSeconds,
      mistakes,
      hintsUsed,
      history,
    });
    setSavedSession(session);
    saveSession(session);
  }, [
    board,
    selectedCell,
    isNotesMode,
    timerSeconds,
    mistakes,
    hintsUsed,
    history,
    selectedPuzzle,
    isCompleted,
    view,
  ]);

  useEffect(() => {
    const pauseIfPlaying = () => {
      if (view === 'game' && !isCompleted) setIsPaused(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pauseIfPlaying();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let removeNative: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      const listener = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) pauseIfPlaying();
      });
      removeNative = () => {
        void listener.then((handle) => handle.remove());
      };
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      removeNative?.();
    };
  }, [view, isCompleted]);

  const applyPuzzleStart = (puzzle: Puzzle, freshBoard: CellState[][]) => {
    setSelectedPuzzle(puzzle);
    setSelectedLevel(puzzle.level);
    setBoard(freshBoard);
    setSelectedCell(null);
    setIsNotesMode(false);
    setTimerSeconds(0);
    setIsPaused(false);
    setMistakes(0);
    setHintsUsed(0);
    setHistory([]);
    setIsCompleted(false);
    setVictoryData(null);
    setView('game');
    setPlayerStats((prev) => applyDailyStreak(prev));
    const session = buildSession({
      puzzleId: puzzle.id,
      level: puzzle.level,
      puzzleNumber: puzzle.puzzleNumber,
      board: freshBoard,
      selectedCell: null,
      isNotesMode: false,
      timerSeconds: 0,
      mistakes: 0,
      hintsUsed: 0,
      history: [],
    });
    setSavedSession(session);
    saveSession(session);
    hapticSelect();
  };

  const resumeSession = useCallback(() => {
    const session = savedSession ?? loadSession();
    if (!session) return;

    const puzzle = allPuzzles.find((item) => item.id === session.puzzleId);
    if (!puzzle || !isLevelAccessible(puzzle.level)) return;

    setSavedSession(session);
    setSelectedPuzzle(puzzle);
    setSelectedLevel(puzzle.level);
    setBoard(deserializeBoard(session.board));
    setSelectedCell(session.selectedCell);
    setIsNotesMode(session.isNotesMode);
    setTimerSeconds(session.timerSeconds);
    setMistakes(session.mistakes);
    setHintsUsed(session.hintsUsed);
    setHistory(session.history ?? []);
    setIsCompleted(false);
    setVictoryData(null);
    setIsPaused(false);
    setView('game');
    setPlayerStats((prev) => applyDailyStreak(prev));
    hapticSelect();
  }, [savedSession, allPuzzles]);

  const startPuzzle = (puzzle: Puzzle, options?: { fresh?: boolean }) => {
    if (!canPlayLevel(puzzle.level)) return;

    if (!options?.fresh && savedSession?.puzzleId === puzzle.id) {
      resumeSession();
      return;
    }

    const newBoard: CellState[][] = puzzle.initialGrid.map((row, r) =>
      row.map((val, c) => ({
        row: r,
        col: c,
        value: val,
        initialValue: val,
        notes: new Set<number>(),
        isError: false,
        isHint: false,
      })),
    );

    applyPuzzleStart(puzzle, newBoard);
  };

  const checkVictory = (
    currentBoard: CellState[][],
    metrics: { mistakes?: number; hintsUsed?: number } = {},
  ) => {
    if (!selectedPuzzle) return;

    const scoredMistakes = metrics.mistakes ?? mistakes;
    const scoredHintsUsed = metrics.hintsUsed ?? hintsUsed;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value !== selectedPuzzle.solutionGrid[r][c]) {
          return false;
        }
      }
    }

    setIsCompleted(true);
    const stars = calculateStars(timerSeconds, scoredMistakes, scoredHintsUsed);
    const alreadyCompleted = Boolean(progressMap[selectedPuzzle.id]?.completed);
    const puzzleXp = alreadyCompleted ? 0 : selectedPuzzle.level * 50 + 100 + stars * 25;

    audioSynth.playVictory();
    hapticSuccess();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    const puzzleId = selectedPuzzle.id;
    const prevProg = progressMap[puzzleId];
    const bestTime =
      prevProg && prevProg.completed ? Math.min(prevProg.bestTime, timerSeconds) : timerSeconds;
    const bestStars = prevProg ? Math.max(prevProg.stars, stars) : stars;

    const newProgressMap = {
      ...progressMap,
      [puzzleId]: {
        puzzleId,
        level: selectedPuzzle.level,
        puzzleNumber: selectedPuzzle.puzzleNumber,
        completed: true,
        stars: bestStars,
        bestTime,
        mistakes: scoredMistakes,
        hintsUsed: scoredHintsUsed,
      },
    };
    setProgressMap(newProgressMap);

    // Stars from a catalogue that was later replaced still belong to the player.
    const totalStars =
      loadCarriedStars() + Object.values(newProgressMap).reduce((sum, p) => sum + p.stars, 0);
    const withStreak = applyDailyStreak(playerStats);
    const puzzlesCompleted = alreadyCompleted
      ? withStreak.puzzlesCompleted
      : withStreak.puzzlesCompleted + 1;
    const statsAfterPuzzle: PlayerStats = {
      ...withStreak,
      xp: withStreak.xp + puzzleXp,
      playerLevel: Math.floor((withStreak.xp + puzzleXp) / 500) + 1,
      totalStars,
      puzzlesCompleted,
    };
    const { ids: newAchievementIds, xp: achievementXp } = evaluateNewAchievements({
      unlocked: statsAfterPuzzle.unlockedAchievements,
      progressMap: newProgressMap,
      stats: statsAfterPuzzle,
      justCompleted: {
        level: selectedPuzzle.level,
        mistakes: scoredMistakes,
        hintsUsed: scoredHintsUsed,
        time: timerSeconds,
      },
    });
    const finalXp = statsAfterPuzzle.xp + achievementXp;
    setPlayerStats({
      ...statsAfterPuzzle,
      xp: finalXp,
      playerLevel: Math.floor(finalXp / 500) + 1,
      unlockedAchievements: [...statsAfterPuzzle.unlockedAchievements, ...newAchievementIds],
    });

    setVictoryData({ stars, xpEarned: puzzleXp + achievementXp, time: timerSeconds });
    setHistory([]);
    dropSession();
    return true;
  };

  /**
   * A digit key. Normally it writes into the selected cell. In digit-first mode
   * it only picks the digit up (or puts it down again); the cells tapped next
   * are what get written, through tapCell.
   */
  const inputNumber = (num: number) => {
    if (isCompleted || isPaused || board.length === 0) return;
    if (digitFirst) {
      hapticTap();
      setArmedDigit((current) => (current === num ? null : num));
      return;
    }
    if (!selectedCell) return;
    placeDigitAt(selectedCell.row, selectedCell.col, num);
  };

  /**
   * A tap on the board. It always selects the cell. In digit-first mode with a
   * digit picked up it also writes that digit, but only into an empty cell, or
   * takes it back out of a cell that already holds it: a stray tap never
   * overwrites a different digit.
   */
  const tapCell = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (!digitFirst || armedDigit === null || isCompleted || isPaused || board.length === 0) return;
    const cell = board[row][col];
    if (cell.value !== 0 && cell.value !== armedDigit) return;
    placeDigitAt(row, col, armedDigit);
  };

  const placeDigitAt = (row: number, col: number, num: number) => {
    const cell = board[row][col];

    if (cell.initialValue !== 0 || cell.isHint) return;

    hapticTap();

    if (isNotesMode) {
      audioSynth.playNote();
      const snaps = [snapshotCell(cell)];
      const newBoard = cloneBoard(board);
      const target = newBoard[row][col];
      const newNotes = new Set(target.notes);
      if (newNotes.has(num)) newNotes.delete(num);
      else newNotes.add(num);
      target.notes = newNotes;
      target.value = 0;
      target.isError = false;
      setHistory((prev) => [...prev, { cells: snaps, selectedCell, hintsDelta: 0 }]);
      setBoard(newBoard);
      return;
    }

    if (cell.value === num) {
      audioSynth.playErase();
      const snaps = [snapshotCell(cell)];
      const newBoard = cloneBoard(board);
      newBoard[row][col].value = 0;
      newBoard[row][col].isError = false;
      setHistory((prev) => [...prev, { cells: snaps, selectedCell, hintsDelta: 0 }]);
      setBoard(newBoard);
      return;
    }

    const isCorrect = selectedPuzzle ? selectedPuzzle.solutionGrid[row][col] === num : true;
    const snaps = snapshotHouse(board, row, col);
    const newBoard = cloneBoard(board);
    const target = newBoard[row][col];
    target.value = num;
    target.notes.clear();
    target.isHint = false;
    clearNotesForDigit(newBoard, row, col, num);

    const nextMistakes = isCorrect ? mistakes : mistakes + 1;
    if (!isCorrect) {
      // Keep score integrity independent from the optional visual feedback.
      setMistakes((prev) => prev + 1);
      if (autoCheckErrors) {
        audioSynth.playError();
        hapticError();
        target.isError = true;
      } else {
        audioSynth.playPlaceNumber(num);
        target.isError = false;
      }
    } else {
      audioSynth.playPlaceNumber(num);
      target.isError = false;
    }

    setHistory((prev) => [...prev, { cells: snaps, selectedCell, hintsDelta: 0 }]);
    setBoard(newBoard);
    checkVictory(newBoard, { mistakes: nextMistakes });
  };

  const eraseCell = () => {
    if (!selectedCell || isCompleted || isPaused) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.initialValue !== 0 || cell.isHint) return;
    if (cell.value === 0 && cell.notes.size === 0) return;

    hapticTap();
    audioSynth.playErase();
    const snaps = [snapshotCell(cell)];
    const newBoard = cloneBoard(board);
    newBoard[row][col].value = 0;
    newBoard[row][col].notes.clear();
    newBoard[row][col].isError = false;
    setHistory((prev) => [...prev, { cells: snaps, selectedCell, hintsDelta: 0 }]);
    setBoard(newBoard);
  };

  /** Pencils in every candidate the board allows. One undo takes it all back. */
  const fillNotes = () => {
    if (isCompleted || isPaused || board.length !== 9) return;
    const filled = fillAllNotes(board);
    if (!filled) return;

    hapticTap();
    audioSynth.playNote();
    setHistory((prev) => [...prev, { cells: filled.changed, selectedCell, hintsDelta: 0 }]);
    setBoard(filled.board);
  };

  /**
   * Opens a hint: the next step a person would take from here, explained frame by
   * frame. Reading it is free and always available; only placing the digit at the
   * end uses up one of the puzzle's hints.
   */
  const giveHint = () => {
    if (isCompleted || isPaused || !selectedPuzzle || board.length !== 9) return;
    if (activeHint) return;

    const hint = explainNextStep(
      board.map((row) => row.map((cell) => cell.value)),
      selectedPuzzle.solutionGrid,
    );
    if (!hint) return;

    hapticSelect();
    audioSynth.playHint();
    setActiveHint({ hint, index: 0 });
    const shown = hint.frames[0].target;
    if (shown !== null) setSelectedCell({ row: Math.floor(shown / 9), col: shown % 9 });
  };

  const advanceHint = () => {
    if (!activeHint || activeHint.index >= activeHint.hint.frames.length - 1) return;
    hapticTap();
    setActiveHint({ ...activeHint, index: activeHint.index + 1 });
  };

  const closeHint = useCallback(() => setActiveHint(null), []);

  /** Places the digit the open hint led to. This is the part that costs a hint. */
  const placeHint = () => {
    if (isCompleted || isPaused || !selectedPuzzle || !activeHint?.hint.placement) return;
    if (activeHint.index < activeHint.hint.frames.length - 1) return;
    if (hintsUsed >= MAX_HINTS_PER_PUZZLE) return;

    const targetPos = { row: activeHint.hint.placement.row, col: activeHint.hint.placement.col };

    hapticSelect();
    audioSynth.playHint();
    const { row, col } = targetPos;
    const correctVal = selectedPuzzle.solutionGrid[row][col];
    const snaps = snapshotHouse(board, row, col);
    const newBoard = cloneBoard(board);
    newBoard[row][col].value = correctVal;
    newBoard[row][col].notes.clear();
    newBoard[row][col].isError = false;
    newBoard[row][col].isHint = true;
    clearNotesForDigit(newBoard, row, col, correctVal);

    setHistory((prev) => [...prev, { cells: snaps, selectedCell: targetPos, hintsDelta: 1 }]);
    const nextHintsUsed = hintsUsed + 1;
    setHintsUsed(nextHintsUsed);
    setSelectedCell(targetPos);
    setBoard(newBoard);
    checkVictory(newBoard, { hintsUsed: nextHintsUsed });
  };

  const undoMove = () => {
    if (history.length === 0 || isCompleted || isPaused) return;
    const entry = history[history.length - 1];
    hapticTap();
    audioSynth.playErase();
    setBoard(restoreHistoryEntry(board, entry));
    setHistory((prev) => prev.slice(0, -1));
    setSelectedCell(entry.selectedCell);
    if (entry.hintsDelta) {
      setHintsUsed((prev) => Math.max(0, prev - entry.hintsDelta));
    }
  };

  const restartPuzzle = () => {
    if (selectedPuzzle) {
      startPuzzle(selectedPuzzle, { fresh: true });
    }
  };

  const exitToMenu = () => {
    setView('puzzle-select');
  };

  const closeVictoryModal = useCallback(() => {
    setVictoryData(null);
    setView('puzzle-select');
  }, []);

  return (
    <GameContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        view,
        setView,
        selectedLevel,
        setSelectedLevel,
        selectedPuzzle,
        setSelectedPuzzle,
        puzzles: allPuzzles,
        progressMap,
        playerStats,
        ownedPacks,
        storeProducts,
        purchasePack,
        restorePurchases,
        canAccessLevel,
        canPlayLevel,
        board,
        selectedCell,
        setSelectedCell,
        isNotesMode,
        setIsNotesMode,
        timerSeconds,
        isPaused,
        setIsPaused,
        mistakes,
        hintsUsed,
        isCompleted,
        soundEnabled,
        setSoundEnabled,
        hapticsEnabled,
        setHapticsEnabled: setHapticsEnabledSetting,
        autoCheckErrors,
        setAutoCheckErrors,
        digitFirst,
        setDigitFirst,
        armedDigit,
        tapCell,
        startPuzzle,
        resumeSession,
        savedSession,
        inputNumber,
        eraseCell,
        fillNotes,
        giveHint,
        activeHint,
        advanceHint,
        placeHint,
        closeHint,
        undoMove,
        canUndo: history.length > 0,
        restartPuzzle,
        exitToMenu,
        victoryData,
        closeVictoryModal,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// The provider and its hook intentionally share this module as the public context API.
// oxlint-disable-next-line react/only-export-components
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
