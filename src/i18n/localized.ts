import type { Language } from '../types/sudoku';

/** Bilingual UI copy; English falls back to Catalan. */
export type LocalizedText = { ca: string; es: string };

export function localized(text: LocalizedText, language: Language): string {
  if (language === 'en') return text.ca;
  return text[language];
}
