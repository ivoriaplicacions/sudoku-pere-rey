import React from 'react';
import { BrandLogo } from '../BrandLogo';

/** Compact single-line title with safe-area spacing below the status bar. */
export const HeaderBar: React.FC = () => {
  return (
    <header className="w-full sticky top-0 z-30 safe-top px-3 pb-2.5 backdrop-blur-md bg-black/45 border-b border-white/10 shadow-lg">
      <BrandLogo header />
    </header>
  );
};
