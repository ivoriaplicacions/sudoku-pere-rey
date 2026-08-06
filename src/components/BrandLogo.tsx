import React, { useId } from 'react';

/** Laurel-wreath master badge */
const MasterBadge: React.FC<{ className?: string }> = ({ className }) => {
  const gid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r="24" fill={`url(#${gid})`} stroke="#b45309" strokeWidth="2" />
      <path
        d="M28 12 L32 22 L42 22 L34 28 L37 38 L28 32 L19 38 L22 28 L14 22 L24 22 Z"
        fill="#fde68a"
        stroke="#92400e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gid} x1="8" y1="8" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
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
      <div className="min-w-0 leading-none flex items-center gap-2" aria-label="Maestros del Sudoku">
        <MasterBadge className="w-8 h-8 shrink-0" />
        <div>
          <div className="text-[9px] font-bold tracking-[0.22em] text-amber-300/90 uppercase">
            Maestros
          </div>
          <div className="text-sm font-black tracking-tight text-white leading-none">
            del Sudoku
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center" aria-label="Maestros del Sudoku">
      <MasterBadge className="w-14 h-14 sm:w-16 sm:h-16 mb-2" />
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
