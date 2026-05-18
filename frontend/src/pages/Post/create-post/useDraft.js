import { useState, useEffect, useRef } from 'react';

export function useDraft(content, visibility, draftKey) {
  const [saveState, setSaveState] = useState('idle');
  const timerRef = useRef(null);

  useEffect(() => {
    // Don't save until we know which user this belongs to
    if (!draftKey) return;

    // Strip HTML to get the real text length — same logic as plainText in the create page
    const plainText = content?.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() ?? '';

    // Nothing meaningful to save — clear any stale draft and stay idle
    if (!plainText) return;

    setSaveState('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ content, visibility, savedAt: Date.now() })
      );
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 1000);

    return () => clearTimeout(timerRef.current);
  }, [content, visibility, draftKey]);

  return saveState;
}