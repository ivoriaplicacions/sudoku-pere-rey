import type { Achievement } from '../types/sudoku';

export const achievementsData: Achievement[] = [
  {
    id: 'first_win',
    title: { ca: 'Primer Pas', es: 'Primer Paso' },
    description: { ca: 'Completa el teu primer Sudoku', es: 'Completa tu primer Sudoku' },
    icon: '🏆',
    xpReward: 100,
  },
  {
    id: 'no_errors',
    title: { ca: 'Perfeccionista', es: 'Perfeccionista' },
    description: { ca: 'Resoldre un Sudoku sense cometre cap error', es: 'Resolver un Sudoku sin cometer ningún error' },
    icon: '✨',
    xpReward: 150,
  },
  {
    id: 'no_hints',
    title: { ca: 'Sense Ajudes', es: 'Sin Ayudas' },
    description: { ca: 'Completar un nivell 5 o superior sense usar pistes', es: 'Completar un nivel 5 o superior sin usar pistas' },
    icon: '🧠',
    xpReward: 200,
  },
  {
    id: 'speed_demon',
    title: { ca: 'Velocista', es: 'Velocista' },
    description: { ca: 'Resoldre un Sudoku en menys de 3 minuts', es: 'Resolver un Sudoku en menos de 3 minutos' },
    icon: '⚡',
    xpReward: 250,
  },
  {
    id: 'streak_3',
    title: { ca: 'Constància', es: 'Constancia' },
    description: { ca: 'Mantenir una ràtxa de 3 dies consecutius', es: 'Mantener una racha de 3 días consecutivos' },
    icon: '🔥',
    xpReward: 300,
  },
  {
    id: 'level_5_master',
    title: { ca: 'Nivell Intermedi', es: 'Nivel Intermedio' },
    description: { ca: 'Completar tots els Sudokus del Nivell 5', es: 'Completar todos los Sudokus del Nivel 5' },
    icon: '🌟',
    xpReward: 500,
  },
  {
    id: 'level_10_master',
    title: { ca: 'Mestre Absolut', es: 'Maestro Absoluto' },
    description: { ca: 'Completar tots els Sudokus del Nivell 10', es: 'Completar todos los Sudokus del Nivel 10' },
    icon: '👑',
    xpReward: 1000,
  },
  {
    id: 'stars_30',
    title: { ca: 'Col·leccionista d\'Estrelles', es: 'Coleccionista de Estrellas' },
    description: { ca: 'Aconseguir 30 estrelles en total', es: 'Conseguir 30 estrellas en total' },
    icon: '⭐',
    xpReward: 400,
  },
];
