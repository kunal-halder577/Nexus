// useScrollLock.js
import { useEffect } from 'react';

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const scrollbarWidth = window.innerWidth - document.body.clientWidth;
    document.body.style.overflowY = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflowY = '';
      document.body.style.paddingRight = '';
    };
  }, [active]);
}