import type { AuthChangeEvent, Subscription } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import type { DeepLinkType } from "@/types";

let authSubscription: Subscription | null = null;

const SESSION_CLEARING_EVENTS: ReadonlySet<AuthChangeEvent> = new Set([
  "SIGNED_OUT",
]);

interface AuthState {
  session: Session | null;
  initialized: boolean;
  isEmailVerified: boolean;
  pendingDeepLinkType: DeepLinkType;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  setPendingDeepLinkType: (type: DeepLinkType) => void;
  clearPendingDeepLinkType: () => void;
}

function checkEmailVerified(session: Session | null): boolean {
  if (!session?.user) return false;
  return session.user.email_confirmed_at != null;
}

function clearClientCaches(): void {
  queryClient.clear();
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  isEmailVerified: false,
  pendingDeepLinkType: null,

  initialize: async () => {
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({
        session,
        initialized: true,
        isEmailVerified: checkEmailVerified(session),
      });
    } catch {
      set({ session: null, initialized: true, isEmailVerified: false });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (SESSION_CLEARING_EVENTS.has(event)) {
        clearClientCaches();
        set({
          session: null,
          isEmailVerified: false,
          pendingDeepLinkType: null,
        });
        return;
      }

      set({
        session,
        isEmailVerified: checkEmailVerified(session),
      });
    });
    authSubscription = subscription;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearClientCaches();
    set({ session: null, isEmailVerified: false, pendingDeepLinkType: null });
  },

  resendVerification: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  },

  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "nstil://reset-password",
    });
    if (error) throw error;
  },

  resetPassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  setPendingDeepLinkType: (type: DeepLinkType) => {
    set({ pendingDeepLinkType: type });
  },

  clearPendingDeepLinkType: () => {
    set({ pendingDeepLinkType: null });
  },
}));
