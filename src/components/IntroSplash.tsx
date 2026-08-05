import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';

interface IntroSplashProps {
  onFinished: () => void;
}

const BOARD = 180;
const PAD = 10;
const CELL = (BOARD - PAD * 2) / 9;
const INNER = BOARD - PAD * 2;

/** Cinematic intro paced for older players (~7.8s). Tap to skip. */
export const IntroSplash: React.FC<IntroSplashProps> = ({ onFinished }) => {
  const [phase, setPhase] = useState<'play' | 'exit'>('play');

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setPhase('exit'), 7200);
    const doneTimer = window.setTimeout(() => onFinished(), 7800);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinished]);

  const skip = () => {
    setPhase('exit');
    window.setTimeout(onFinished, 500);
  };

  // Numbers sit in the four corners + centre of the decorative board.
  const sampleNumbers: Array<[number, number, string]> = [
    [0, 0, '1'],
    [8, 0, '7'],
    [4, 4, '5'],
    [0, 8, '3'],
    [8, 8, '9'],
  ];

  return (
    <button
      type="button"
      onClick={skip}
      className={`intro-splash fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden border-0 cursor-pointer ${
        phase === 'exit' ? 'intro-splash--exit' : ''
      }`}
      aria-label="Entrar a Sudoku Pere Rey"
    >
      <div className="intro-splash__bg absolute inset-0" />
      <div className="intro-splash__glow absolute inset-0 pointer-events-none" />
      <div className="intro-splash__rays absolute inset-0 pointer-events-none" />

      <div className="intro-splash__particles absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`intro-particle intro-particle--${(i % 6) + 1}`} />
        ))}
      </div>

      {/* Stack: grid above, brand below — no overlap */}
      <div className="relative z-10 flex flex-col items-center px-6 -mt-6">
        <div className="intro-splash__grid pointer-events-none" aria-hidden>
          <svg viewBox={`0 0 ${BOARD} ${BOARD}`} className="w-56 h-56 sm:w-72 sm:h-72 overflow-visible">
            {/* Solid frame always visible — animation never leaves the bottom open */}
            <rect
              x={PAD}
              y={PAD}
              width={INNER}
              height={INNER}
              rx="8"
              fill="rgba(2,6,23,0.35)"
              stroke="rgba(245,158,11,0.7)"
              strokeWidth="2.8"
            />
            <rect
              x={PAD}
              y={PAD}
              width={INNER}
              height={INNER}
              rx="8"
              fill="none"
              stroke="rgba(253,230,138,0.55)"
              strokeWidth="2.8"
              pathLength={1}
              className="intro-grid-draw"
              style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
            />

            {Array.from({ length: 8 }, (_, i) => i + 1).map((i) => {
              const pos = PAD + i * CELL;
              const thick = i % 3 === 0;
              const stroke = thick ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.22)';
              const width = thick ? 2 : 1;
              return (
                <g key={i}>
                  <line
                    x1={pos}
                    y1={PAD}
                    x2={pos}
                    y2={PAD + INNER}
                    stroke={stroke}
                    strokeWidth={width}
                    pathLength={1}
                    className="intro-grid-draw"
                    style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                  />
                  <line
                    x1={PAD}
                    y1={pos}
                    x2={PAD + INNER}
                    y2={pos}
                    stroke={stroke}
                    strokeWidth={width}
                    pathLength={1}
                    className="intro-grid-draw"
                    style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                  />
                </g>
              );
            })}

            {sampleNumbers.map(([col, row, n], i) => (
              <text
                key={`${n}-${i}`}
                x={PAD + col * CELL + CELL / 2}
                y={PAD + row * CELL + CELL / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(253,230,138,0.8)"
                fontSize="16"
                fontFamily="Georgia, serif"
                fontWeight="700"
                className="intro-grid-num"
                style={{ animationDelay: `${1.0 + i * 0.25}s` }}
              >
                {n}
              </text>
            ))}
          </svg>
        </div>

        <div className="intro-splash__brand mt-5">
          <BrandLogo />
          <p className="intro-splash__tagline mt-5 text-base sm:text-lg font-semibold tracking-[0.2em] uppercase text-amber-100/85">
            El teu regne de lògica
          </p>
        </div>
      </div>

      <span className="intro-splash__hint absolute bottom-12 text-sm tracking-widest uppercase text-white/50 font-medium">
        Toca per continuar
      </span>
    </button>
  );
};

export default IntroSplash;
