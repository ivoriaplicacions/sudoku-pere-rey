import { describe, expect, it } from 'vitest';
import { translations } from './translations';

describe('translations', () => {
  // The buttons draw their arrows as icons. An arrow in the text as well showed
  // up twice on "Volver a los Niveles".
  it('carry no arrow characters', () => {
    const withArrows = Object.entries(translations).flatMap(([lang, texts]) =>
      Object.entries(texts as Record<string, unknown>)
        .filter(([, text]) => typeof text === 'string' && /[←→‹›⬅➡◀▶]/.test(text))
        .map(([key]) => `${lang}.${key}`),
    );
    expect(withArrows).toEqual([]);
  });
});
