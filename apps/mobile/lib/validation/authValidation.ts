import type {
  ResetPasswordFormData,
  SignInFormData,
  SignUpFormData,
  ValidationError,
} from "@/types";

import {
  PASSWORD_MIN_LENGTH,
  hasNumber,
  hasUppercase,
  isMinLength,
  isValidEmail,
} from "./rules";

type TranslateFn = (key: string) => string;

function validatePasswordStrength(
  password: string,
  field: string,
  t: TranslateFn,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({ field, message: t("auth.validation.passwordRequired") });
    return errors;
  }

  if (!isMinLength(password, PASSWORD_MIN_LENGTH)) {
    errors.push({ field, message: t("auth.validation.passwordMinLength") });
  }
  if (!hasUppercase(password)) {
    errors.push({ field, message: t("auth.validation.passwordUppercase") });
  }
  if (!hasNumber(password)) {
    errors.push({ field, message: t("auth.validation.passwordNumber") });
  }

  return errors;
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string,
  field: string,
  t: TranslateFn,
): ValidationError[] {
  if (!confirmPassword) {
    return [{ field, message: t("auth.validation.confirmPasswordRequired") }];
  }
  if (password !== confirmPassword) {
    return [{ field, message: t("auth.validation.passwordsMismatch") }];
  }
  return [];
}

export function validateSignIn(
  data: SignInFormData,
  t: TranslateFn,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.email.trim()) {
    errors.push({ field: "email", message: t("auth.validation.emailRequired") });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: "email", message: t("auth.validation.emailInvalid") });
  }

  if (!data.password) {
    errors.push({ field: "password", message: t("auth.validation.passwordRequired") });
  }

  return errors;
}

export function validateSignUp(
  data: SignUpFormData,
  t: TranslateFn,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.email.trim()) {
    errors.push({ field: "email", message: t("auth.validation.emailRequired") });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: "email", message: t("auth.validation.emailInvalid") });
  }

  errors.push(...validatePasswordStrength(data.password, "password", t));
  errors.push(
    ...validateConfirmPassword(data.password, data.confirmPassword, "confirmPassword", t),
  );

  return errors;
}

export function validateResetPassword(
  data: ResetPasswordFormData,
  t: TranslateFn,
): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...validatePasswordStrength(data.newPassword, "newPassword", t));
  errors.push(
    ...validateConfirmPassword(
      data.newPassword,
      data.confirmPassword,
      "confirmPassword",
      t,
    ),
  );

  return errors;
}
