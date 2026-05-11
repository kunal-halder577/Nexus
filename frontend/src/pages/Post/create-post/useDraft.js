import { useState, useEffect, useRef } from 'react';
import { DRAFT_KEY } from './mediaUtils.js';

export function useDraft(content, visibility) {
  const [saveState, setSaveState] = useState('idle');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!content) return;
    setSaveState('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ content, visibility, savedAt: Date.now() })
      );
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [content, visibility]);

  return saveState;
}
