import React, { useId } from 'react';

/** Master star used as brand mark between title words */
const MasterStar: React.FC<{ className?: string }> = ({ className }) => {
  const gid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M28 6 L33 20 L48 20 L36 29 L40 44 L28 35 L16 44 L20 29 L8 20 L23 20 Z"
        fill={`url(#${gid})`}
        stroke="#92400e"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gid} x1="8" y1="6" x2="48" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="0.55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
    </svg>
  );
};

interface BrandLogoProps {
  compact?: boolean;
  /** Single-line title for the app header */
  header?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false, header = false }) => {
  if (header) {
    return (
      <h1
        className="w-full flex items-center justify-center gap-2 sm:gap-2.5 leading-none text-center"
        aria-label="Maestros del Sudoku"
      >
        <span className="text-[0.95rem] sm:text-lg font-black tracking-[0.18em] text-amber-300 uppercase drop-shadow-sm">
          Maestros
        </span>
        <MasterStar className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow" />
        <span className="text-[0.95rem] sm:text-lg font-black tracking-[0.14em] text-white uppercase drop-shadow-sm">
          del Sudoku
        </span>
      </h1>
    );
  }

  if (compact) {
    return (
      <div className="min-w-0 leading-none flex items-center gap-1.5" aria-label="Maestros del Sudoku">
        <span className="text-[10px] font-black tracking-[0.16em] text-amber-300 uppercase">
          Maestros
        </span>
        <MasterStar className="w-4 h-4 shrink-0" />
        <span className="text-[10px] font-black tracking-[0.12em] text-white uppercase">
          del Sudoku
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center" aria-label="Maestros del Sudoku">
      <MasterStar className="w-14 h-14 sm:w-16 sm:h-16 mb-2" />
      <span className="text-xs font-bold tracking-[0.35em] text-amber-300/90 uppercase">
        Maestros
      </span>
      <span className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none mt-0.5">
        del Sudoku
      </span>
    </div>
  );
};

export default BrandLogo;
