import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Language,
  ThemeId,
  PuzzleProgress,
  PlayerStats,
  CellState,
  CellPosition,
  MoveHistory,
  Puzzle,
} from '../types/sudoku';
import {
  generateAllPuzzles,
  calculateStars,
} from '../utils/sudokuLogic';
import { audioSynth } from '../utils/audio';
import {
  getOwnedPacks,
  isLevelAccessible,
  purchasePack as purchasePackService,
  restorePurchases as restorePurchasesService,
} from '../services/monetization';
import {
  hapticTap,
  hapticSelect,
  hapticError,
  hapticSuccess,
  setHapticsEnabled,
} from '../utils/haptics';
import confetti from 'canvas-confetti';

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
  purchasePack: (packId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  canAccessLevel: (level: number) => boolean;

  board: CellState[][];
  selectedCell: CellPosition | null;
  setSelectedCell: (pos: CellPosition | null) => void;
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

  startPuzzle: (puzzle: Puzzle) => void;
  inputNumber: (num: number) => void;
  eraseCell: () => void;
  giveHint: () => void;
  undoMove: () => void;
  restartPuzzle: () => void;
  exitToMenu: () => void;

  victoryData: { stars: number; xpEarned: number; time: number } | null;
  closeVictoryModal: () => void;
}

const STORAGE_PROGRESS_KEY = 'sudoku_master_progress_v1';
const STORAGE_STATS_KEY = 'sudoku_master_stats_v1';
const STORAGE_LANGUAGE_KEY = 'maestros_language_v1';
const STORAGE_HAPTICS_KEY = 'maestros_haptics_v1';

const defaultPlayerStats: PlayerStats = {
  xp: 0,
  playerLevel: 1,
  totalStars: 0,
  puzzlesCompleted: 0,
  currentStreak: 1,
  lastPlayedDate: new Date().toISOString().split('T')[0],
  unlockedThemes: [
    'zen',
    'cyber',
    'cosmic',
    'sunset',
    'mediterrani',
    'reial',
    'bosc',
    'aurora',
    'pergami',
    'vinyes',
    'montroig',
    'montroigCamp',
    'cambrils',
    'cambrilsPort',
  ],
  unlockedAchievements: [],
};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function loadLanguage(): Language {
  const saved = safeGetItem(STORAGE_LANGUAGE_KEY);
  if (saved === 'ca' || saved === 'es' || saved === 'en') return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith('ca')) return 'ca';
  if (browser.startsWith('es')) return 'es';
  return 'en';
}

function loadProgressMap(): Record<string, PuzzleProgress> {
  const saved = safeGetItem(STORAGE_PROGRESS_KEY);
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    return {};
  }
}

function loadPlayerStats(): PlayerStats {
  const saved = safeGetItem(STORAGE_STATS_KEY);
  if (!saved) return defaultPlayerStats;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultPlayerStats;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(loadLanguage);
  const [theme, setTheme] = useState<ThemeId>('zen');
  const [view, setView] = useState<'level-select' | 'puzzle-select' | 'game'>('level-select');

  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [ownedPacks, setOwnedPacks] = useState<string[]>(() => getOwnedPacks());

  const [allPuzzles] = useState<Puzzle[]>(() => generateAllPuzzles());
  const [progressMap, setProgressMap] = useState<Record<string, PuzzleProgress>>(loadProgressMap);

  const [playerStats, setPlayerStats] = useState<PlayerStats>(loadPlayerStats);

  const [board, setBoard] = useState<CellState[][]>([]);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [history] = useState<MoveHistory[]>([]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState<boolean>(() => {
    return safeGetItem(STORAGE_HAPTICS_KEY) !== 'false';
  });
  const [autoCheckErrors, setAutoCheckErrors] = useState<boolean>(true);

  const [victoryData, setVictoryData] = useState<{ stars: number; xpEarned: number; time: number } | null>(null);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_LANGUAGE_KEY, lang);
  }, []);

  const setHapticsEnabledSetting = useCallback((val: boolean) => {
    setHapticsEnabledState(val);
    setHapticsEnabled(val);
    localStorage.setItem(STORAGE_HAPTICS_KEY, String(val));
  }, []);

  const canAccessLevel = (level: number) => isLevelAccessible(level);

  const purchasePack = useCallback(async (packId: string) => {
    const result = await purchasePackService(packId);
    if (result.ok) {
      setOwnedPacks(getOwnedPacks());
      hapticSuccess();
    } else {
      hapticError();
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    const restored = await restorePurchasesService();
    setOwnedPacks(restored);
    hapticSuccess();
  }, []);

  useEffect(() => {
    audioSynth.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    setHapticsEnabled(hapticsEnabled);
  }, [hapticsEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progressMap));
  }, [progressMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(playerStats));
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

  const startPuzzle = (puzzle: Puzzle) => {
    if (!isLevelAccessible(puzzle.level)) return;

    setSelectedPuzzle(puzzle);
    setSelectedLevel(puzzle.level);

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

    setBoard(newBoard);
    setSelectedCell(null);
    setIsNotesMode(false);
    setTimerSeconds(0);
    setIsPaused(false);
    setMistakes(0);
    setHintsUsed(0);
    setIsCompleted(false);
    setVictoryData(null);
    setView('game');
    hapticSelect();
  };

  const checkVictory = (currentBoard: CellState[][]) => {
    if (!selectedPuzzle) return;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value !== selectedPuzzle.solutionGrid[r][c]) {
          return false;
        }
      }
    }

    setIsCompleted(true);
    const stars = calculateStars(timerSeconds, mistakes, hintsUsed);
    const baseXP = selectedPuzzle.level * 50 + 100;
    const xpEarned = baseXP + stars * 25;

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
        mistakes,
        hintsUsed,
      },
    };
    setProgressMap(newProgressMap);

    const totalStars = Object.values(newProgressMap).reduce((sum, p) => sum + p.stars, 0);

    setPlayerStats((prev) => {
      const newXP = prev.xp + xpEarned;
      const newPlayerLevel = Math.floor(newXP / 500) + 1;
      return {
        ...prev,
        xp: newXP,
        playerLevel: newPlayerLevel,
        totalStars,
        puzzlesCompleted: prev.puzzlesCompleted + 1,
      };
    });

    setVictoryData({ stars, xpEarned, time: timerSeconds });
    return true;
  };

  const inputNumber = (num: number) => {
    if (!selectedCell || isCompleted || isPaused || board.length === 0) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.initialValue !== 0) return;

    hapticTap();
    const newBoard = board.map((r) => r.map((c) => ({ ...c, notes: new Set(c.notes) })));
    const target = newBoard[row][col];

    if (isNotesMode) {
      audioSynth.playNote();
      const newNotes = new Set(target.notes);
      if (newNotes.has(num)) {
        newNotes.delete(num);
      } else {
        newNotes.add(num);
      }
      target.notes = newNotes;
      target.value = 0;
      target.isError = false;
      setBoard(newBoard);
      return;
    }

    if (target.value === num) {
      audioSynth.playErase();
      target.value = 0;
      target.isError = false;
      setBoard(newBoard);
      return;
    }

    const isCorrect = selectedPuzzle ? selectedPuzzle.solutionGrid[row][col] === num : true;

    target.value = num;
    target.notes.clear();

    if (autoCheckErrors && !isCorrect) {
      audioSynth.playError();
      hapticError();
      target.isError = true;
      setMistakes((prev) => prev + 1);
    } else {
      audioSynth.playPlaceNumber(num);
      target.isError = false;
    }

    setBoard(newBoard);
    checkVictory(newBoard);
  };

  const eraseCell = () => {
    if (!selectedCell || isCompleted || isPaused) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.initialValue !== 0) return;

    hapticTap();
    audioSynth.playErase();
    const newBoard = board.map((r) => r.map((c) => ({ ...c, notes: new Set(c.notes) })));
    newBoard[row][col].value = 0;
    newBoard[row][col].notes.clear();
    newBoard[row][col].isError = false;
    setBoard(newBoard);
  };

  const giveHint = () => {
    if (isCompleted || isPaused || !selectedPuzzle) return;

    let targetPos = selectedCell;
    if (!targetPos || board[targetPos.row][targetPos.col].value !== 0) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c].value === 0) {
            targetPos = { row: r, col: c };
            break;
          }
        }
        if (targetPos) break;
      }
    }

    if (!targetPos) return;

    hapticSelect();
    audioSynth.playHint();
    const { row, col } = targetPos;
    const correctVal = selectedPuzzle.solutionGrid[row][col];

    const newBoard = board.map((r) => r.map((c) => ({ ...c, notes: new Set(c.notes) })));
    newBoard[row][col].value = correctVal;
    newBoard[row][col].notes.clear();
    newBoard[row][col].isError = false;
    newBoard[row][col].isHint = true;

    setHintsUsed((prev) => prev + 1);
    setSelectedCell(targetPos);
    setBoard(newBoard);

    checkVictory(newBoard);
  };

  const undoMove = () => {
    if (history.length === 0 || isCompleted || isPaused) return;
    hapticTap();
    audioSynth.playErase();
  };

  const restartPuzzle = () => {
    if (selectedPuzzle) {
      startPuzzle(selectedPuzzle);
    }
  };

  const exitToMenu = () => {
    setView('puzzle-select');
  };

  const closeVictoryModal = () => {
    setVictoryData(null);
    setView('puzzle-select');
  };

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
        purchasePack,
        restorePurchases,
        canAccessLevel,
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
        startPuzzle,
        inputNumber,
        eraseCell,
        giveHint,
        undoMove,
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

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
