import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../context/GameContext', () => ({
  useGame: () => ({ language: 'es', soundEnabled: true }),
}));
vi.mock('./IntroVideo', () => ({
  IntroVideo: ({ onFinished }: { onFinished: () => void }) => (
    <button type="button" data-testid="video" onClick={onFinished} />
  ),
}));
vi.mock('./IntroSplash', () => ({
  IntroSplash: ({ onFinished }: { onFinished: () => void }) => (
    <button type="button" data-testid="animation" onClick={onFinished} />
  ),
}));

const { IntroSequence } = await import('./IntroSequence');

let container: HTMLDivElement;
let root: Root;
let reducedMotion = false;

const shown = () => container.querySelector('[data-testid]')?.getAttribute('data-testid');
const tap = async () => act(async () => (container.querySelector('button') as HTMLButtonElement).click());

beforeEach(() => {
  reducedMotion = false;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduce') && reducedMotion,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('the intro', () => {
  it('shows the video first and the animation after it', async () => {
    const onFinished = vi.fn();
    await act(async () => root.render(<IntroSequence onFinished={onFinished} />));
    expect(shown()).toBe('video');

    await tap();
    expect(shown()).toBe('animation');
    expect(onFinished).not.toHaveBeenCalled();

    await tap();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('goes straight to the animation when the system asks for reduced motion', async () => {
    reducedMotion = true;
    await act(async () => root.render(<IntroSequence onFinished={vi.fn()} />));
    expect(shown()).toBe('animation');
  });
});
