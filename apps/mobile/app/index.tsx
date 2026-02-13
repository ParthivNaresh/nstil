import { Redirect } from "expo-router";

import { useAuthStore } from "@/stores/authStore";

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const isEmailVerified = useAuthStore((s) => s.isEmailVerified);
  const pendingDeepLinkType = useAuthStore((s) => s.pendingDeepLinkType);

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

  return <Redirect href="/(tabs)" />;
}
