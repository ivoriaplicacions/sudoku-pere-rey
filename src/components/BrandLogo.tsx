import React, { useId } from 'react';

/** Simple three-point crown — clean lines, no gothic flourishes */
const SimpleCrown: React.FC<{ className?: string }> = ({ className }) => {
  const gid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 36 L8 18 L20 28 L32 8 L44 28 L56 18 L56 36 Z"
        fill={`url(#${gid})`}
        stroke="#b45309"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="6" y="36" width="52" height="8" rx="2.5" fill={`url(#${gid})`} stroke="#b45309" strokeWidth="2" />
      <circle cx="32" cy="8" r="3.5" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
      <circle cx="8" cy="18" r="3" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
      <circle cx="56" cy="18" r="3" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
      <circle cx="32" cy="26" r="2.5" fill="#dc2626" />
      <defs>
        <linearGradient id={gid} x1="8" y1="8" x2="56" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="0.45" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface BrandLogoProps {
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="min-w-0 leading-none" aria-label="Sudoku Pere Rey">
        <div className="text-[10px] font-semibold tracking-[0.28em] text-amber-200/75 uppercase mb-0.5">
          Sudoku
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-black tracking-tight text-white">PERE</span>
          <SimpleCrown className="w-6 h-5 shrink-0" />
          <span className="text-sm font-bold tracking-wide text-amber-300">REY</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center" aria-label="Sudoku Pere Rey">
      <span className="text-xs font-semibold tracking-[0.35em] text-amber-200/80 uppercase mb-1">
        Sudoku
      </span>
      <div className="flex items-center gap-3">
        <span className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
          PERE
        </span>
        <SimpleCrown className="w-10 h-8 sm:w-12 sm:h-9" />
        <span className="text-2xl sm:text-3xl font-bold tracking-wide text-amber-300 leading-none">
          REY
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;
