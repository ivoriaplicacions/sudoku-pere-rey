import { useEffect } from 'react';

interface PhysicalKeyboardOptions {
  enabled: boolean;
  isPaused: boolean;
  onDigit: (digit: number) => void;
  onErase: () => void;
  onTogglePause: () => void;
  onToggleNotes: () => void;
  onUndo: () => void;
  /** Arrow keys walk the board, so it can be played without a pointer. */
  onMove: (rowDelta: number, colDelta: number) => void;
}

/** iPad / Bluetooth keyboard: 1–9, arrows, Delete, Escape, N, Z. */
export function usePhysicalKeyboard({
  enabled,
  isPaused,
  onDigit,
  onErase,
  onTogglePause,
  onToggleNotes,
  onUndo,
  onMove,
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
      const ARROWS: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const delta = ARROWS[event.key];
      if (delta) {
        event.preventDefault();
        onMove(delta[0], delta[1]);
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
  }, [enabled, isPaused, onDigit, onErase, onTogglePause, onToggleNotes, onUndo, onMove]);
}
