import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

type ParamValue = string | number | null | undefined;

export function readStringParam(params: URLSearchParams, key: string, fallback = ''): string {
  return params.get(key) ?? fallback;
}

export function readPositiveIntParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  allowed?: readonly number[],
): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  if (allowed && !allowed.includes(parsed)) return fallback;
  return parsed;
}

export function useUrlQueryUpdater(defaults: Record<string, string | number>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, ParamValue>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === null || value === '' || defaults[key] === value) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [defaults, setSearchParams],
  );

  return { searchParams, updateParams };
}
