import { useEffect, useRef, useState } from 'react';

/**
 * Keeps an immediate controlled input value in sync with debounced URL/query updates.
 */
export function useDebouncedSearch(
  committedValue: string,
  onCommit: (nextValue: string) => void,
  delayMs = 300,
): [string, (nextValue: string) => void] {
  const [draft, setDraft] = useState(committedValue);
  const committedRef = useRef(committedValue);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (committedValue !== committedRef.current) {
      committedRef.current = committedValue;
      setDraft(committedValue);
    }
  }, [committedValue]);

  useEffect(() => {
    if (draft === committedRef.current) return;
    const timer = window.setTimeout(() => {
      committedRef.current = draft;
      onCommitRef.current(draft);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [draft, delayMs]);

  return [draft, setDraft];
}
