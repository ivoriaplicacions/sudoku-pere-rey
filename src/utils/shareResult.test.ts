import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatResultTime, resultMessage, shareResult, starsText } from './shareResult';

afterEach(() => vi.unstubAllGlobals());

describe('the shared message', () => {
  it('says the level and its technique, the stars and the time, and where to find the app', () => {
    const text = resultMessage({ level: 21 }, { stars: 2, time: 254 }, 'es');
    expect(text).toBe(
      'He resuelto el nivel 21 (X-Wing I) de SUDOKU KING: ★★☆ en 4:14.\nhttps://www.ivoriaplicacions.es/sudokuking.html',
    );
  });

  it('names the day of a daily challenge', () => {
    const text = resultMessage(
      { level: 0, daily: { date: '2026-11-13', technique: 'xy-wing' } },
      { stars: 3, time: 61 },
      'es',
    );
    expect(text.split('\n')[0]).toMatch(/^He resuelto el reto diario del 13 nov\.? de SUDOKU KING: ★★★ en 1:01\.$/);
  });

  it('reads well in the three languages', () => {
    for (const language of ['ca', 'es', 'en'] as const) {
      const text = resultMessage({ level: 1 }, { stars: 1, time: 3600 }, language);
      expect(text).not.toMatch(/[{}]|undefined/);
      expect(text).toContain('60:00');
    }
  });

  it('draws one to three stars and the time as minutes and seconds', () => {
    expect(starsText(0)).toBe('☆☆☆');
    expect(starsText(3)).toBe('★★★');
    expect(starsText(7)).toBe('★★★');
    expect(formatResultTime(9)).toBe('0:09');
  });
});

describe('sharing on the web', () => {
  it('uses the browser’s share sheet when there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    expect(await shareResult('hello')).toBe('shared');
    expect(share).toHaveBeenCalledWith({ text: 'hello' });
  });

  it('copies the message when the browser cannot share', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    expect(await shareResult('hello')).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('treats closing the share sheet as a cancel, not a failure', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError'));
    vi.stubGlobal('navigator', { ...navigator, share });
    expect(await shareResult('hello')).toBe('cancelled');
  });
});
