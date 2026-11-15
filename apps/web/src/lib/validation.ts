const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const normalized = email.trim();
  if (!normalized || !EMAIL_PATTERN.test(normalized)) {
    return 'Please enter a valid work email address.';
  }
  return null;
}

export function validateMinLength(
  value: string,
  minLength: number,
  message: string,
): string | null {
  return value.trim().length < minLength ? message : null;
}

export function validatePasswordMin(
  password: string,
  minLength: number,
  message: string,
): string | null {
  return password.length < minLength ? message : null;
}
