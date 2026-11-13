import React, { useCallback, useEffect, useRef } from 'react';
import type { Language } from '../types/sudoku';
import { getTranslation } from '../i18n/translations';

/**
 * Served from public/, so it ships inside the app and plays offline. The file is
 * the one Gemini produced, byte for byte: it carries Google's signed C2PA
 * manifest saying it was made with AI, and re-encoding it would drop that.
 */
export const INTRO_VIDEO_SRC = 'intro/sudoku-king-intro.mp4';

/** A video that has not started by then is skipped instead of keeping the player waiting. */
export const INTRO_VIDEO_START_TIMEOUT_MS = 3000;

/** The video lasts ten seconds; past this the intro moves on whatever the video does. */
export const INTRO_VIDEO_MAX_MS = 14000;

interface IntroVideoProps {
  language: Language;
  soundEnabled: boolean;
  onFinished: () => void;
}

/** WebKit's Audio Session API (iOS 17+). Other webviews do not have it. */
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

export const IntroVideo: React.FC<IntroVideoProps> = ({ language, soundEnabled, onFinished }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    videoRef.current?.pause();
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // A web video on iPhone ignores the silent switch by default. "ambient" lets
    // the switch mute it and leaves whatever music the player has on playing.
    const audioSession = (navigator as AudioSessionNavigator).audioSession;
    const previousSessionType = audioSession?.type;
    if (audioSession) audioSession.type = 'ambient';

    let started = false;
    const markStarted = () => {
      started = true;
    };
    video.addEventListener('playing', markStarted);

    video.muted = !soundEnabled;
    void video
      .play()
      .catch(() => {
        // A webview may refuse sound before the first tap; the picture still plays muted.
        video.muted = true;
        return video.play();
      })
      .catch(finish);

    const startTimer = window.setTimeout(() => {
      if (!started) finish();
    }, INTRO_VIDEO_START_TIMEOUT_MS);
    const maxTimer = window.setTimeout(finish, INTRO_VIDEO_MAX_MS);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(maxTimer);
      video.removeEventListener('playing', markStarted);
      if (audioSession && previousSessionType !== undefined) audioSession.type = previousSessionType;
    };
  }, [soundEnabled, finish]);

  const skipLabel = getTranslation(language, 'tapToSkip');

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={finish}
      className="intro-video fixed inset-0 z-[110] overflow-hidden border-0 bg-black p-0 cursor-pointer"
      aria-label={skipLabel}
    >
      <video
        ref={videoRef}
        className="intro-video__media"
        src={INTRO_VIDEO_SRC}
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        aria-hidden="true"
      />
      <span className="intro-video__hint" aria-hidden="true">
        {skipLabel}
      </span>
    </button>
  );
};
