import { Redirect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

import { LoadingScreen } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { ApiError } from "@/services/api/errors";
import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const isEmailVerified = useAuthStore((s) => s.isEmailVerified);
  const pendingDeepLinkType = useAuthStore((s) => s.pendingDeepLinkType);
  const initialize = useAuthStore((s) => s.initialize);
  const signOut = useAuthStore((s) => s.signOut);
  const hasAttemptedRecovery = useRef(false);

  const isAuthenticated = initialized && !!session && isEmailVerified && !pendingDeepLinkType;

  const { data: profile, isLoading: profileLoading, isError: profileError, error: profileErrorObj, refetch } = useProfile({
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!profileError || hasAttemptedRecovery.current) return;
    const isInconsistentState =
      profileErrorObj instanceof ApiError && profileErrorObj.status === 422;
    if (isInconsistentState) {
      hasAttemptedRecovery.current = true;
      signOut();
    }
  }, [profileError, profileErrorObj, signOut]);

  const handleRetry = useCallback(async () => {
    await initialize();
    await refetch();
  }, [initialize, refetch]);

  if (!initialized) {
    return <LoadingScreen variant="initializing" />;
  }

  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  if (pendingDeepLinkType === "recovery") {
    return <Redirect href="/(auth)/reset-password" />;
  }

  if (!isEmailVerified) {
    return (
      <Redirect
        href={{
          pathname: "/(auth)/verify-email",
          params: { email: session.user.email ?? "" },
        }}
      />
    );
  }

  if (profileError) {
    return <LoadingScreen variant="error" onRetry={handleRetry} />;
  }

  if (profileLoading || !profile) {
    return <LoadingScreen variant="loading" />;
  }

  if (!profile.onboarding_completed_at) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
