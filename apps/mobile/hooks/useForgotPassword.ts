import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/authStore";

import { useFormField } from "./useFormField";

const COOLDOWN_SECONDS = 60;

interface ForgotPasswordReturn {
  email: ReturnType<typeof useFormField>;
  isLoading: boolean;
  isSent: boolean;
  cooldownRemaining: number;
  statusMessage: string | null;
  handleSubmit: () => Promise<void>;
  resend: () => Promise<void>;
}

export function useForgotPassword(): ForgotPasswordReturn {
  const { t } = useTranslation();
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const email = useFormField();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_SECONDS);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const sendReset = useCallback(
    async (emailValue: string) => {
      setIsLoading(true);
      setStatusMessage(null);

      try {
        await requestPasswordReset(emailValue.trim());
        setIsSent(true);
        startCooldown();
      } catch {
        setStatusMessage(t("auth.forgotPassword.resendError"));
      } finally {
        setIsLoading(false);
      }
    },
    [requestPasswordReset, t, startCooldown],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = email.value.trim();
    if (!trimmed) {
      email.setError(t("auth.validation.emailRequired"));
      return;
    }

    await sendReset(trimmed);
  }, [email, t, sendReset]);

  const resend = useCallback(async () => {
    if (cooldownRemaining > 0 || isLoading) return;

    setStatusMessage(null);
    setIsLoading(true);

    try {
      await requestPasswordReset(email.value.trim());
      setStatusMessage(t("auth.forgotPassword.resendSuccess"));
      startCooldown();
    } catch {
      setStatusMessage(t("auth.forgotPassword.resendError"));
    } finally {
      setIsLoading(false);
    }
  }, [cooldownRemaining, isLoading, requestPasswordReset, email.value, t, startCooldown]);

  return {
    email,
    isLoading,
    isSent,
    cooldownRemaining,
    statusMessage,
    handleSubmit,
    resend,
  };
}
