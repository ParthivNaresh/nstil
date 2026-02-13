import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/authStore";

const COOLDOWN_SECONDS = 60;

interface VerifyEmailReturn {
  cooldownRemaining: number;
  isResending: boolean;
  statusMessage: string | null;
  resend: () => Promise<void>;
}

export function useVerifyEmail(email: string): VerifyEmailReturn {
  const { t } = useTranslation();
  const resendVerification = useAuthStore((s) => s.resendVerification);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isResending, setIsResending] = useState(false);
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

  const resend = useCallback(async () => {
    if (cooldownRemaining > 0 || isResending) return;

    setIsResending(true);
    setStatusMessage(null);

    try {
      await resendVerification(email);
      setStatusMessage(t("auth.verifyEmail.resendSuccess"));
      startCooldown();
    } catch {
      setStatusMessage(t("auth.verifyEmail.resendError"));
    } finally {
      setIsResending(false);
    }
  }, [cooldownRemaining, isResending, resendVerification, email, t, startCooldown]);

  return { cooldownRemaining, isResending, statusMessage, resend };
}
