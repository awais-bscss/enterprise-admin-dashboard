import { useEffect } from 'react';

let activeModalLocks = 0;
let previousBodyOverflow = '';

export function useModalScrollLock(locked = true): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    if (activeModalLocks === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    activeModalLocks += 1;

    return () => {
      activeModalLocks = Math.max(0, activeModalLocks - 1);
      if (activeModalLocks === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }
    };
  }, [locked]);
}
