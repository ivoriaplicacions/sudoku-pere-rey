import React, { useCallback, useState } from 'react';
import { useGame } from '../context/GameContext';
import { IntroSplash } from './IntroSplash';
import { IntroVideo } from './IntroVideo';

type Stage = 'video' | 'animation';

/** Ten seconds of particles and camera moves are what "reduce motion" asks to avoid. */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The intro: the brand video first, then the animated board. A tap skips the
 * video to the animation, and another tap skips the animation into the app.
 */
export const IntroSequence: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const { language, soundEnabled } = useGame();
  const [stage, setStage] = useState<Stage>(() => (prefersReducedMotion() ? 'animation' : 'video'));
  const showAnimation = useCallback(() => setStage('animation'), []);

  if (stage === 'video') {
    return <IntroVideo language={language} soundEnabled={soundEnabled} onFinished={showAnimation} />;
  }
  return <IntroSplash onFinished={onFinished} />;
};
