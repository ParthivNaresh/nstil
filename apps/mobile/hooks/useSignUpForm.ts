import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { mapAuthError } from "@/lib/authErrors";
import { validateSignUp } from "@/lib/validation";
import { useAuthStore } from "@/stores/authStore";
import type { ValidationError } from "@/types";

import { useFormField } from "./useFormField";

interface SignUpFormReturn {
  email: ReturnType<typeof useFormField>;
  password: ReturnType<typeof useFormField>;
  confirmPassword: ReturnType<typeof useFormField>;
  isLoading: boolean;
  formError: string | null;
  handleSubmit: () => Promise<void>;
}

export function useSignUpForm(): SignUpFormReturn {
  const { t } = useTranslation();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const email = useFormField();
  const password = useFormField();
  const confirmPassword = useFormField();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const applyFieldErrors = useCallback(
    (errors: ValidationError[]) => {
      for (const err of errors) {
        if (err.field === "email") email.setError(err.message);
        if (err.field === "password") password.setError(err.message);
        if (err.field === "confirmPassword") confirmPassword.setError(err.message);
      }
    },
    [email, password, confirmPassword],
  );

  const handleSubmit = useCallback(async () => {
    setFormError(null);

    const errors = validateSignUp(
      {
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      },
      t,
    );

    if (errors.length > 0) {
      applyFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.value.trim(), password.value);
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: email.value.trim() },
      });
    } catch (error: unknown) {
      setFormError(mapAuthError(error, t));
    } finally {
      setIsLoading(false);
    }
  }, [
    email.value,
    password.value,
    confirmPassword.value,
    signUp,
    t,
    applyFieldErrors,
    router,
  ]);

  return { email, password, confirmPassword, isLoading, formError, handleSubmit };
}
