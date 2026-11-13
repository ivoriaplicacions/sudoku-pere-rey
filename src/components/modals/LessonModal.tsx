import React, { useId, useMemo, useState } from 'react';
import { GraduationCap, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { techniqueBlurb } from '../../data/levels';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { localized } from '../../i18n/localized';
import { getTranslation } from '../../i18n/translations';
import type { Technique } from '../../solver/humanSolver';
import type { Language } from '../../types/sudoku';
import { describeHintFrame, digitList, techniqueName, unitName } from '../../utils/hintExplainer';
import { lessonFor } from '../../utils/lessons';
import type { Lesson } from '../../utils/lessons';

interface LessonModalProps {
  /** The technique to teach, or null when no lesson is open. */
  technique: Technique | null;
  onClose: () => void;
}

function promptFor(lesson: Lesson, language: Language): string {
  const step = lesson.step;
  if (lesson.task === 'place') {
    if (lesson.technique === 'naked-single') return getTranslation(language, 'lessonPromptNaked');
    return getTranslation(language, 'lessonPromptHidden', {
      unit: unitName(step.units[0], language),
      digit: step.placement?.digit ?? '',
    });
  }
  if (lesson.task === 'find-pattern') {
    return getTranslation(language, 'lessonPromptFind', {
      unit: unitName(step.units[0], language),
      digits: digitList(step.digits, language),
    });
  }
  return getTranslation(language, 'lessonPromptEliminate', {
    digit: step.eliminations[0]?.digit ?? step.digits[0],
  });
}

/**
 * One technique, one real position, one tap. Shown the first time a player
 * reaches a level that demands the technique, and again whenever they ask.
 */
export const LessonModal: React.FC<LessonModalProps> = ({ technique, onClose }) => {
  const { language, puzzles } = useGame();
  const titleId = useId();
  const dialogRef = useModalAccessibility(technique !== null, onClose);
  const lesson = useMemo(() => (technique ? lessonFor(technique, puzzles) : null), [technique, puzzles]);
  const [solvedFor, setSolvedFor] = useState<Technique | null>(null);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  /** The right cell the player tapped: several can be right for a naked single. */
  const [rightCell, setRightCell] = useState<number | null>(null);

  if (!technique) return null;
  const solved = solvedFor === technique;
  const blurb = techniqueBlurb(technique);

  const tap = (cell: number) => {
    if (!lesson || solved) return;
    if (lesson.answers.includes(cell)) {
      setWrongCell(null);
      setRightCell(cell);
      setSolvedFor(technique);
    } else {
      setWrongCell(cell);
    }
  };

  const removedAt = (cell: number): number[] =>
    lesson ? lesson.step.eliminations.filter((entry) => entry.cell === cell).map((entry) => entry.digit) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xl animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-md flex-col space-y-3 overflow-y-auto rounded-3xl border border-white/20 bg-slate-900 p-4 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <GraduationCap className="h-6 w-6 shrink-0 text-amber-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
                {getTranslation(language, 'lessonTitle')}
              </p>
              <h2 id={titleId} className="break-words text-lg font-black leading-tight">
                {techniqueName(technique, language)}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={getTranslation(language, 'close')}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95"
          >
            <X className="h-5 w-5 text-white/80" />
          </button>
        </div>

        {blurb && <p className="text-sm leading-snug text-white/80">{localized(blurb, language)}.</p>}

        {lesson && (
          <>
            <div
              className="grid aspect-square w-full overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-300"
              style={{ gridTemplateColumns: 'repeat(9, 1fr)', gridTemplateRows: 'repeat(9, 1fr)' }}
              role="group"
              aria-label={getTranslation(language, 'boardLabel')}
            >
              {lesson.grid.map((value, cell) => {
                const row = Math.floor(cell / 9);
                const col = cell % 9;
                // Once solved, a placement marks only the tapped cell; an elimination
                // shows every cell that loses the candidate.
                const isAnswerShown =
                  solved && (lesson.task === 'place' ? rightCell === cell : lesson.answers.includes(cell));
                const isPattern = lesson.pattern.includes(cell) || (solved && lesson.step.cells.includes(cell));
                // A placement lands in the cell the player tapped; for a naked single
                // that cell's only candidate is the digit.
                const placed =
                  solved && lesson.task === 'place' && rightCell === cell
                    ? lesson.technique === 'naked-single'
                      ? lesson.candidates[cell][0]
                      : (lesson.step.placement?.digit ?? 0)
                    : 0;
                const removed = solved ? removedAt(cell) : [];

                const mark = placed
                  ? 'ring-[3px] ring-inset ring-emerald-500'
                  : wrongCell === cell
                    ? 'ring-[3px] ring-inset ring-rose-500'
                    : isPattern
                      ? 'ring-[3px] ring-inset ring-amber-500'
                      : isAnswerShown
                        ? 'ring-[3px] ring-inset ring-rose-500'
                        : lesson.zone.includes(cell)
                          ? 'ring-2 ring-inset ring-amber-400/80'
                          : '';

                return (
                  <button
                    key={cell}
                    type="button"
                    onClick={() => tap(cell)}
                    aria-label={getTranslation(language, 'cellLabel', {
                      row: row + 1,
                      col: col + 1,
                      value: value !== 0 ? String(value) : getTranslation(language, 'cellEmpty'),
                    })}
                    className={`relative flex min-h-0 min-w-0 items-center justify-center bg-slate-50 text-slate-900 ${mark}`}
                    style={{
                      marginRight: col % 3 === 2 && col < 8 ? 2 : 0.5,
                      marginBottom: row % 3 === 2 && row < 8 ? 2 : 0.5,
                    }}
                  >
                    {value !== 0 || placed ? (
                      <span
                        className={`font-black ${placed ? 'text-emerald-600' : ''}`}
                        style={{ fontSize: 'clamp(0.85rem, 4.6vw, 1.3rem)', lineHeight: 1 }}
                      >
                        {placed || value}
                      </span>
                    ) : (
                      <span
                        className="grid h-full w-full grid-cols-3 grid-rows-3 font-semibold text-slate-500"
                        style={{ fontSize: 'clamp(0.4rem, 2vw, 0.6rem)', lineHeight: 1 }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                          <span
                            key={digit}
                            className={`flex items-center justify-center ${
                              removed.includes(digit) ? 'rounded-sm bg-rose-600 font-black text-white line-through' : ''
                            }`}
                          >
                            {lesson.candidates[cell].includes(digit) ? digit : ''}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="min-h-[3.75rem] text-sm leading-snug" role="status" aria-live="polite">
              {solved ? (
                <>
                  <span className="font-black text-emerald-400">{getTranslation(language, 'lessonRight')} </span>
                  {describeHintFrame(
                    { kind: 'technique', step: lesson.step, zone: [], pattern: [], eliminated: [], target: null },
                    language,
                  )}
                </>
              ) : (
                <>
                  {promptFor(lesson, language)}
                  {wrongCell !== null && (
                    <span className="font-bold text-rose-300"> {getTranslation(language, 'lessonWrong')}</span>
                  )}
                </>
              )}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-2xl py-3 text-sm font-black transition active:scale-95 ${
            solved || !lesson ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          {getTranslation(language, solved || !lesson ? 'lessonDone' : 'lessonSkip')}
        </button>
      </div>
    </div>
  );
};
