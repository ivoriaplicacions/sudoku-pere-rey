import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Active game state
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
  
  // Audio & Settings
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  autoCheckErrors: boolean;
  setAutoCheckErrors: (val: boolean) => void;

  // Actions
  startPuzzle: (puzzle: Puzzle) => void;
  inputNumber: (num: number) => void;
  eraseCell: () => void;
  giveHint: () => void;
  undoMove: () => void;
  restartPuzzle: () => void;
  exitToMenu: () => void;

  // Victory modal state
  victoryData: { stars: number; xpEarned: number; time: number } | null;
  closeVictoryModal: () => void;
}

const STORAGE_PROGRESS_KEY = 'sudoku_master_progress_v1';
const STORAGE_STATS_KEY = 'sudoku_master_stats_v1';

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

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ca');
  const [theme, setTheme] = useState<ThemeId>('zen');
  const [view, setView] = useState<'level-select' | 'puzzle-select' | 'game'>('level-select');

  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);

  const [allPuzzles] = useState<Puzzle[]>(() => generateAllPuzzles());
  const [progressMap, setProgressMap] = useState<Record<string, PuzzleProgress>>(() => {
    const saved = localStorage.getItem(STORAGE_PROGRESS_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(STORAGE_STATS_KEY);
    return saved ? JSON.parse(saved) : defaultPlayerStats;
  });

  // Active game state
  const [board, setBoard] = useState<CellState[][]>([]);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [history, setHistory] = useState<MoveHistory[]>([]);
  
  // Sound & Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoCheckErrors, setAutoCheckErrors] = useState<boolean>(true);

  // Victory modal
  const [victoryData, setVictoryData] = useState<{ stars: number; xpEarned: number; time: number } | null>(null);

  // Sync sound setting
  useEffect(() => {
    audioSynth.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Save progress & stats to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progressMap));
  }, [progressMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(playerStats));
  }, [playerStats]);

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (view === 'game' && !isPaused && !isCompleted && board.length > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [view, isPaused, isCompleted, board]);

  // Start a new puzzle
  const startPuzzle = (puzzle: Puzzle) => {
    setSelectedPuzzle(puzzle);
    setSelectedLevel(puzzle.level);
    
    // Initialize 9x9 board state
    const newBoard: CellState[][] = puzzle.initialGrid.map((row, r) =>
      row.map((val, c) => ({
        row: r,
        col: c,
        value: val,
        initialValue: val,
        notes: new Set<number>(),
        isError: false,
        isHint: false,
      }))
    );

    setBoard(newBoard);
    setSelectedCell(null);
    setIsNotesMode(false);
    setTimerSeconds(0);
    setIsPaused(false);
    setMistakes(0);
    setHintsUsed(0);
    setIsCompleted(false);
    setHistory([]);
    setVictoryData(null);
    setView('game');
  };

  // Check board victory condition
  const checkVictory = (currentBoard: CellState[][]) => {
    if (!selectedPuzzle) return;
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c].value !== selectedPuzzle.solutionGrid[r][c]) {
          return false;
        }
      }
    }

    // Victory!
    setIsCompleted(true);
    const stars = calculateStars(timerSeconds, mistakes, hintsUsed);
    const baseXP = selectedPuzzle.level * 50 + 100;
    const xpEarned = baseXP + stars * 25;

    // Trigger celebration effects
    audioSynth.playVictory();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Update progress map
    const puzzleId = selectedPuzzle.id;
    const prevProg = progressMap[puzzleId];
    const bestTime = prevProg && prevProg.completed ? Math.min(prevProg.bestTime, timerSeconds) : timerSeconds;
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

    // Calculate total stars
    const totalStars = Object.values(newProgressMap).reduce((sum, p) => sum + p.stars, 0);

    // Update player stats & level
    setPlayerStats(prev => {
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

  // Input a number (1-9) into selected cell
  const inputNumber = (num: number) => {
    if (!selectedCell || isCompleted || isPaused || board.length === 0) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.initialValue !== 0) return; // Cannot edit initial given cells

    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    const target = newBoard[row][col];

    if (isNotesMode) {
      // Toggle note candidate
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

    // Direct value placement
    if (target.value === num) {
      // Clear if tapping same number
      audioSynth.playErase();
      target.value = 0;
      target.isError = false;
      setBoard(newBoard);
      return;
    }

    // Check validity against solution grid
    const isCorrect = selectedPuzzle ? selectedPuzzle.solutionGrid[row][col] === num : true;

    target.value = num;
    target.notes.clear();

    if (autoCheckErrors && !isCorrect) {
      audioSynth.playError();
      target.isError = true;
      setMistakes(prev => prev + 1);
    } else {
      audioSynth.playPlaceNumber(num);
      target.isError = false;
    }

    setBoard(newBoard);

    // Check if fully solved
    checkVictory(newBoard);
  };

  // Erase active cell
  const eraseCell = () => {
    if (!selectedCell || isCompleted || isPaused) return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.initialValue !== 0) return;

    audioSynth.playErase();
    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newBoard[row][col].value = 0;
    newBoard[row][col].notes.clear();
    newBoard[row][col].isError = false;
    setBoard(newBoard);
  };

  // Provide a hint for the active or first empty cell
  const giveHint = () => {
    if (isCompleted || isPaused || !selectedPuzzle) return;
    
    let targetPos = selectedCell;
    if (!targetPos || board[targetPos.row][targetPos.col].value !== 0) {
      // Find first empty cell
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

    audioSynth.playHint();
    const { row, col } = targetPos;
    const correctVal = selectedPuzzle.solutionGrid[row][col];

    const newBoard = board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newBoard[row][col].value = correctVal;
    newBoard[row][col].notes.clear();
    newBoard[row][col].isError = false;
    newBoard[row][col].isHint = true;

    setHintsUsed(prev => prev + 1);
    setSelectedCell(targetPos);
    setBoard(newBoard);

    checkVictory(newBoard);
  };

  // Undo last action
  const undoMove = () => {
    if (history.length === 0 || isCompleted || isPaused) return;
    audioSynth.playErase();
    // Implementation helper if history tracked
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