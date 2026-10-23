/**
 * Class names for a puzzle card inside a level, on the same principle as
 * levelCardTheme: a card's text belongs to the surface behind it, and the three
 * states stay distinguishable in both the light and the dark worlds.
 */
export interface PuzzleCardState {
  isLight: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
}

export interface PuzzleCardStyles {
  card: string;
  number: string;
  emptyStar: string;
  footer: string;
  divider: string;
  givenPill: string;
  idleBadge: string;
}

export function puzzleCardStyles({
  isLight,
  isInProgress,
  isCompleted,
}: PuzzleCardState): PuzzleCardStyles {
  const card = isLight
    ? isInProgress
      ? 'bg-teal-100/90 border-teal-700/40 hover:bg-teal-100 shadow-lg shadow-teal-900/10'
      : isCompleted
        ? 'bg-emerald-100/85 border-emerald-700/35 hover:bg-emerald-100 shadow-lg shadow-emerald-900/10'
        : 'bg-white/90 border-slate-900/15 hover:bg-white shadow-lg shadow-slate-900/10'
    : isInProgress
      ? 'bg-teal-950/50 border-emerald-400/50 hover:bg-teal-900/60 shadow-lg shadow-emerald-950/40'
      : isCompleted
        ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/60 shadow-lg shadow-emerald-950/50'
        : 'bg-slate-900/60 border-white/20 hover:bg-slate-800/80 shadow-lg shadow-black/40';

  return {
    card,
    number: isLight ? 'text-slate-900' : 'text-white',
    emptyStar: isLight ? 'text-slate-900/25 fill-slate-900/10' : 'text-white/20 fill-white/10',
    footer: isLight ? 'text-slate-700' : 'text-white/70',
    divider: isLight ? 'border-slate-900/10' : 'border-white/10',
    givenPill: isLight ? 'text-slate-700 bg-slate-900/10' : 'text-white/50 bg-white/10',
    idleBadge: isLight ? 'bg-slate-900/10' : 'bg-white/10',
  };
}
