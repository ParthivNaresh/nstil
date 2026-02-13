import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { mapAuthError } from "@/lib/authErrors";
import { validateResetPassword } from "@/lib/validation";
import { useAuthStore } from "@/stores/authStore";
import type { ValidationError } from "@/types";

import { useFormField } from "./useFormField";

interface ResetPasswordReturn {
  newPassword: ReturnType<typeof useFormField>;
  confirmPassword: ReturnType<typeof useFormField>;
  isLoading: boolean;
  formError: string | null;
  handleSubmit: () => Promise<void>;
}

export function useResetPassword(): ResetPasswordReturn {
  const { t } = useTranslation();
  const router = useRouter();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const signOut = useAuthStore((s) => s.signOut);
  const clearPendingDeepLinkType = useAuthStore((s) => s.clearPendingDeepLinkType);
  const newPassword = useFormField();
  const confirmPassword = useFormField();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const applyFieldErrors = useCallback(
    (errors: ValidationError[]) => {
      for (const err of errors) {
        if (err.field === "newPassword") newPassword.setError(err.message);
        if (err.field === "confirmPassword") confirmPassword.setError(err.message);
      }
    },
    [newPassword, confirmPassword],
  );

  const handleSubmit = useCallback(async () => {
    setFormError(null);

    const errors = validateResetPassword(
      {
        newPassword: newPassword.value,
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
      await resetPassword(newPassword.value);
      clearPendingDeepLinkType();
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (error: unknown) {
      setFormError(mapAuthError(error, t));
    } finally {
      setIsLoading(false);
    }
  }, [
    newPassword.value,
    confirmPassword.value,
    resetPassword,
    signOut,
    clearPendingDeepLinkType,
    t,
    applyFieldErrors,
    router,
  ]);

  return { newPassword, confirmPassword, isLoading, formError, handleSubmit };
}
