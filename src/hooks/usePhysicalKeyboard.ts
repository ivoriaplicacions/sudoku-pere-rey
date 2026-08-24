import { useEffect } from 'react';

interface PhysicalKeyboardOptions {
  enabled: boolean;
  isPaused: boolean;
  onDigit: (digit: number) => void;
  onErase: () => void;
  onTogglePause: () => void;
  onToggleNotes: () => void;
  onUndo: () => void;
}

/** iPad / Bluetooth keyboard: 1–9, Delete, Escape, N, Z. */
export function usePhysicalKeyboard({
  enabled,
  isPaused,
  onDigit,
  onErase,
  onTogglePause,
  onToggleNotes,
  onUndo,
}: PhysicalKeyboardOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onTogglePause();
        return;
      }

      if (isPaused) return;

      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        onDigit(Number(event.key));
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        onErase();
        return;
      }
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        onToggleNotes();
        return;
      }
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        onUndo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, isPaused, onDigit, onErase, onTogglePause, onToggleNotes, onUndo]);
}
