import { describe, expect, it } from 'vitest';
import { TEST_ADMIN_USER, TEST_VIEWER_USER } from '../../test/fixtures';
import { canUserAccessPath, resolveLoginDestination } from './routePermissions';

describe('routePermissions', () => {
  describe('canUserAccessPath', () => {
    it('denies access when user is null or path is public', () => {
      expect(canUserAccessPath(null, '/dashboard')).toBe(false);
      expect(canUserAccessPath(TEST_ADMIN_USER, '/login')).toBe(false);
      expect(canUserAccessPath(TEST_ADMIN_USER, '/unauthorized')).toBe(false);
    });

    it('permits shared routes for viewer and privileged routes only when permission is granted', () => {
      expect(canUserAccessPath(TEST_VIEWER_USER, '/dashboard')).toBe(true);
      expect(canUserAccessPath(TEST_VIEWER_USER, '/projects')).toBe(true);
      expect(canUserAccessPath(TEST_VIEWER_USER, '/settings')).toBe(false);
      expect(canUserAccessPath(TEST_VIEWER_USER, '/audit')).toBe(false);

      expect(canUserAccessPath(TEST_ADMIN_USER, '/settings')).toBe(true);
      expect(canUserAccessPath(TEST_ADMIN_USER, '/audit')).toBe(true);
      expect(canUserAccessPath(TEST_ADMIN_USER, '/reports')).toBe(true);
    });
  });

  describe('resolveLoginDestination', () => {
    it('preserves requested path when the signed-in user has access', () => {
      expect(resolveLoginDestination(TEST_ADMIN_USER, '/settings')).toBe('/settings');
      expect(resolveLoginDestination(TEST_VIEWER_USER, '/projects')).toBe('/projects');
    });

    it('falls back to /dashboard when switching to a lower-privileged role', () => {
      expect(resolveLoginDestination(TEST_VIEWER_USER, '/settings')).toBe('/dashboard');
      expect(resolveLoginDestination(TEST_VIEWER_USER, '/reports')).toBe('/dashboard');
    });

    it('rejects non-leading-slash or missing targets and defaults to /dashboard', () => {
      expect(resolveLoginDestination(TEST_ADMIN_USER, undefined)).toBe('/dashboard');
      expect(resolveLoginDestination(TEST_ADMIN_USER, 'https://external.example')).toBe('/dashboard');
    });
  });
});
