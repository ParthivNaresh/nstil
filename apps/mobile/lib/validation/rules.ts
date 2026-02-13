const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function hasUppercase(value: string): boolean {
  return HAS_UPPERCASE.test(value);
}

export function hasNumber(value: string): boolean {
  return HAS_NUMBER.test(value);
}

export { PASSWORD_MIN_LENGTH };
