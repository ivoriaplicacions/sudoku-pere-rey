import type { Language } from '../types/sudoku';

/** Localized UI copy (ca / es / en). */
export type LocalizedText = { ca: string; es: string; en?: string };

export function localized(text: LocalizedText, language: Language): string {
  if (language === 'en') return text.en ?? text.es;
  return text[language];
}
