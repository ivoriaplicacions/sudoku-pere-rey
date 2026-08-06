import type { LocalizedText } from '../i18n/localized';
import { CONTENT_PACKS } from './packs';

const DIFFICULTY_META: Array<{
  name: LocalizedText;
  givenRange: string;
  icon: string;
  description: LocalizedText;
}> = [
  { name: { ca: 'Iniciació', es: 'Iniciación', en: 'Initiation' }, givenRange: '50', icon: '🌱', description: { ca: 'Perfecte per començar', es: 'Perfecto para empezar', en: 'Perfect to start' } },
  { name: { ca: 'Fàcil', es: 'Fácil', en: 'Easy' }, givenRange: '46', icon: '⭐', description: { ca: 'Molt accessible', es: 'Muy accesible', en: 'Very accessible' } },
  { name: { ca: 'Principiant', es: 'Principiante', en: 'Beginner' }, givenRange: '42', icon: '🧩', description: { ca: 'Desafiament suau', es: 'Desafío suave', en: 'Gentle challenge' } },
  { name: { ca: 'Mitjà', es: 'Medio', en: 'Medium' }, givenRange: '39', icon: '🔥', description: { ca: 'Agilitat mental', es: 'Agilidad mental', en: 'Mental agility' } },
  { name: { ca: 'Intermedi', es: 'Intermedio', en: 'Intermediate' }, givenRange: '37', icon: '🎯', description: { ca: 'Nivell equilibrat', es: 'Nivel equilibrado', en: 'Balanced level' } },
  { name: { ca: 'Avançat', es: 'Avanzado', en: 'Advanced' }, givenRange: '35', icon: '⚡', description: { ca: 'Requereix concentració', es: 'Requiere concentración', en: 'Requires focus' } },
  { name: { ca: 'Desafiament', es: 'Desafío', en: 'Challenge' }, givenRange: '33', icon: '🏆', description: { ca: 'Tècniques avançades', es: 'Técnicas avanzadas', en: 'Advanced techniques' } },
  { name: { ca: 'Expert', es: 'Experto', en: 'Expert' }, givenRange: '32', icon: '💎', description: { ca: 'Per a jugadors versats', es: 'Para jugadores versados', en: 'For seasoned players' } },
  { name: { ca: 'Extrem', es: 'Extremo', en: 'Extreme' }, givenRange: '31', icon: '🌌', description: { ca: 'Dificultat màxima', es: 'Máxima dificultad', en: 'Maximum difficulty' } },
  { name: { ca: 'Mestre', es: 'Maestro', en: 'Master' }, givenRange: '30', icon: '👑', description: { ca: 'Només per als millors', es: 'Solo para los mejores', en: 'Only for the best' } },
];

export interface LevelDefinition {
  level: number;
  packId: string;
  packNumber: number;
  name: LocalizedText;
  givenRange: string;
  icon: string;
  description: LocalizedText;
}

export function buildLevelList(): LevelDefinition[] {
  const levels: LevelDefinition[] = [];
  for (const pack of CONTENT_PACKS) {
    for (let level = pack.levelStart; level <= pack.levelEnd; level++) {
      const difficulty = ((level - 1) % 10);
      const meta = DIFFICULTY_META[difficulty];
      levels.push({
        level,
        packId: pack.id,
        packNumber: pack.number,
        ...meta,
      });
    }
  }
  return levels;
}
