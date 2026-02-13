import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { mapAuthError } from "@/lib/authErrors";
import { validateSignIn } from "@/lib/validation";
import { useAuthStore } from "@/stores/authStore";
import type { ValidationError } from "@/types";

import { useFormField } from "./useFormField";

interface SignInFormReturn {
  email: ReturnType<typeof useFormField>;
  password: ReturnType<typeof useFormField>;
  isLoading: boolean;
  formError: string | null;
  handleSubmit: () => Promise<void>;
}

export function useSignInForm(): SignInFormReturn {
  const { t } = useTranslation();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const email = useFormField();
  const password = useFormField();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const applyFieldErrors = useCallback(
    (errors: ValidationError[]) => {
      for (const err of errors) {
        if (err.field === "email") email.setError(err.message);
        if (err.field === "password") password.setError(err.message);
      }
    },
    [email, password],
  );

  const handleSubmit = useCallback(async () => {
    setFormError(null);

    const errors = validateSignIn(
      { email: email.value, password: password.value },
      t,
    );

    if (errors.length > 0) {
      applyFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email.value.trim(), password.value);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      setFormError(mapAuthError(error, t));
    } finally {
      setIsLoading(false);
    }
  }, [email.value, password.value, signIn, t, applyFieldErrors, router]);

  return { email, password, isLoading, formError, handleSubmit };
}
