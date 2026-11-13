import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTRO_VIDEO_MAX_MS, INTRO_VIDEO_SRC, INTRO_VIDEO_START_TIMEOUT_MS, IntroVideo } from './IntroVideo';

let container: HTMLDivElement;
let root: Root;
let play: ReturnType<typeof vi.spyOn>;
let onFinished: ReturnType<typeof vi.fn<() => void>>;

async function renderVideo(soundEnabled = true) {
  await act(async () => {
    root.render(<IntroVideo language="es" soundEnabled={soundEnabled} onFinished={onFinished} />);
  });
  return container.querySelector('video') as HTMLVideoElement;
}

async function fire(target: EventTarget, type: string) {
  await act(async () => {
    target.dispatchEvent(new Event(type, { bubbles: true }));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  onFinished = vi.fn<() => void>();
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete (navigator as { audioSession?: unknown }).audioSession;
});

describe('the intro video', () => {
  it('plays the bundled file inline', async () => {
    const video = await renderVideo();
    expect(video.getAttribute('src')).toBe(INTRO_VIDEO_SRC);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('plays with sound when sound effects are on', async () => {
    const video = await renderVideo(true);
    expect(video.muted).toBe(false);
  });

  it('plays muted when sound effects are off', async () => {
    const video = await renderVideo(false);
    expect(video.muted).toBe(true);
  });

  it('falls back to muted when the webview refuses sound', async () => {
    play.mockRejectedValueOnce(new Error('NotAllowedError')).mockResolvedValueOnce(undefined);
    const video = await renderVideo(true);
    expect(play).toHaveBeenCalledTimes(2);
    expect(video.muted).toBe(true);
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('moves on when it cannot play at all', async () => {
    play.mockRejectedValue(new Error('NotSupportedError'));
    await renderVideo();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('moves on when the video ends', async () => {
    const video = await renderVideo();
    await fire(video, 'ended');
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('moves on when the file fails to load', async () => {
    const video = await renderVideo();
    await fire(video, 'error');
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('is skipped with a tap', async () => {
    await renderVideo();
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Toca para saltar');
    await act(async () => button.click());
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('finishes only once', async () => {
    const video = await renderVideo();
    await fire(video, 'ended');
    await act(async () => (container.querySelector('button') as HTMLButtonElement).click());
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('does not keep the player waiting for a video that never starts', async () => {
    await renderVideo();
    await act(async () => vi.advanceTimersByTime(INTRO_VIDEO_START_TIMEOUT_MS));
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('lets a video that started play to the end', async () => {
    const video = await renderVideo();
    await fire(video, 'playing');
    await act(async () => vi.advanceTimersByTime(INTRO_VIDEO_START_TIMEOUT_MS));
    expect(onFinished).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(INTRO_VIDEO_MAX_MS));
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('lets the iPhone silent switch mute it, then restores the audio session', async () => {
    const audioSession = { type: 'auto' };
    (navigator as { audioSession?: unknown }).audioSession = audioSession;
    await renderVideo();
    expect(audioSession.type).toBe('ambient');
    await act(async () => root.unmount());
    root = createRoot(container);
    expect(audioSession.type).toBe('auto');
  });
});
