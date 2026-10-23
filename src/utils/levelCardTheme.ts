/**
 * Class names for a level card, chosen so the hierarchy never inverts.
 *
 * The rule the light themes broke: the card a player *can* open must be the most
 * prominent one on screen, and a card's text must belong to the same world as the
 * surface behind it. Nesting these as ternaries inside the JSX is how the unlocked
 * card ended up dark on a pale background while the locked ones went bright white.
 */
export interface LevelCardState {
  /** The shell background is light, so every card surface is light too. */
  isLight: boolean;
  isUnlocked: boolean;
  needsPurchase: boolean;
}

export interface LevelCardStyles {
  card: string;
  icon: string;
  levelLabel: string;
  givenPill: string;
  title: string;
  description: string;
  starsPill: string;
  completedText: string;
  progressTrack: string;
}

export function levelCardStyles({
  isLight,
  isUnlocked,
  needsPurchase,
}: LevelCardState): LevelCardStyles {
  const card = isLight
    ? isUnlocked
      ? 'bg-white/90 border-slate-900/15 hover:bg-white shadow-lg shadow-slate-900/10 active:scale-[0.98] group'
      : needsPurchase
        ? 'bg-amber-100/75 border-amber-700/30 active:scale-[0.98]'
        : 'bg-white/40 border-slate-900/10 opacity-70 cursor-not-allowed'
    : isUnlocked
      ? 'bg-slate-900/60 hover:bg-slate-800/80 border-white/20 shadow-lg shadow-black/40 active:scale-[0.98] group'
      : needsPurchase
        ? 'bg-amber-950/35 border-amber-400/35 active:scale-[0.98]'
        : 'bg-black/40 border-white/5 opacity-60 cursor-not-allowed';

  return {
    card,
    icon: isUnlocked
      ? isLight
        ? 'bg-gradient-to-br from-indigo-500/25 to-purple-500/25 border border-slate-900/15'
        : 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/20'
      : isLight
        ? 'bg-slate-900/5'
        : 'bg-white/5',
    levelLabel: isLight ? 'text-amber-900' : 'text-amber-400',
    givenPill: isLight ? 'text-slate-700 bg-slate-900/10' : 'text-white/50 bg-white/10',
    title: isLight ? 'text-slate-900' : 'text-white',
    description: isLight ? 'text-slate-700' : 'text-white/60',
    starsPill: isLight
      ? 'text-amber-900 bg-amber-500/20 border-amber-700/30'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    completedText: isLight ? 'text-emerald-800' : 'text-emerald-400',
    progressTrack: isLight ? 'bg-slate-900/10' : 'bg-white/10',
  };
}
