import React, { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  titleId: string;
  closeLabel: string;
  onClose: () => void;
  icon?: ReactNode;
  leading?: ReactNode;
}

/** Shared, safe-area-aware header for full-screen application modals. */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  titleId,
  closeLabel,
  onClose,
  icon,
  leading,
}) => (
  <header className="safe-top shrink-0 border-b border-white/10 bg-black/50 px-4 pb-3 backdrop-blur-md">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
        {leading ?? icon}
        <h2
          id={titleId}
          className="min-w-0 break-words text-lg font-black leading-tight sm:text-xl"
        >
          {title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-95"
        aria-label={closeLabel}
      >
        <X className="h-5 w-5 text-white/80" />
      </button>
    </div>
  </header>
);
