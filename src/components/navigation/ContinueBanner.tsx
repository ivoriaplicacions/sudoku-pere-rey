import React from 'react';
import { Play } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const ContinueBanner: React.FC = () => {
  const { language, savedSession, resumeSession } = useGame();

  if (!savedSession) return null;

  return (
    <button
      type="button"
      onClick={resumeSession}
      className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-emerald-600/45 to-teal-500/30 border border-emerald-400/50 shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center shrink-0">
          <Play className="w-5 h-5 text-emerald-200 fill-emerald-200 ml-0.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
            {getTranslation(language, 'inProgress')}
          </p>
          <p className="text-base font-black text-white leading-tight mt-0.5">
            {getTranslation(language, 'continueGame')}
          </p>
          <p className="text-xs text-white/70 mt-0.5">
            {getTranslation(language, 'level')} {savedSession.level}
            {' · '}
            {getTranslation(language, 'puzzle')} #{savedSession.puzzleNumber}
            {' · '}
            {formatTime(savedSession.timerSeconds)}
          </p>
        </div>
      </div>
    </button>
  );
};
