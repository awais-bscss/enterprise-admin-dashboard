import { ApiError } from './api';

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
