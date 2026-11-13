import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { describeHintFrame } from '../../utils/hintExplainer';
import { MAX_HINTS_PER_PUZZLE } from '../../utils/sudokuLogic';

/**
 * The open hint, one frame at a time: where to look, which technique applies,
 * and only then the offer to place the digit.
 */
export const HintPanel: React.FC = () => {
  const { language, activeHint, advanceHint, placeHint, closeHint, hintsUsed } = useGame();
  if (!activeHint) return null;

  const { hint, index } = activeHint;
  const frame = hint.frames[index];
  const isLast = index === hint.frames.length - 1;
  const hintsLeft = Math.max(0, MAX_HINTS_PER_PUZZLE - hintsUsed);
  const canPlace = isLast && hint.placement !== null;

  return (
    <div
      className="mx-2 rounded-2xl border border-amber-400/50 bg-black/75 p-3 text-white shadow-lg shadow-black/40 backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" aria-hidden />
        <div className="min-w-0 flex-1">
          {hint.frames.length > 1 && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
              {getTranslation(language, 'hintProgress', { current: index + 1, total: hint.frames.length })}
            </p>
          )}
          <p className="text-sm leading-snug">{describeHintFrame(frame, language)}</p>
        </div>
        <button
          type="button"
          onClick={closeHint}
          aria-label={getTranslation(language, 'hintClose')}
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {(canPlace || !isLast) && (
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-tight text-white/60">
            {canPlace ? getTranslation(language, 'hintCostsOne') : ''}
          </p>
          {isLast ? (
            <button
              type="button"
              onClick={placeHint}
              disabled={hintsLeft === 0}
              className="shrink-0 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 transition active:scale-95 disabled:pointer-events-none disabled:opacity-45"
            >
              {getTranslation(language, 'hintPlace')} · {hintsLeft}
            </button>
          ) : (
            <button
              type="button"
              onClick={advanceHint}
              className="shrink-0 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-black text-white transition hover:bg-white/25 active:scale-95"
            >
              {getTranslation(language, 'hintNext')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
