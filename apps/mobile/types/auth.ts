export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface VerifyEmailRouteParams {
  email: string;
}

export type DeepLinkType = "recovery" | "signup" | null;
