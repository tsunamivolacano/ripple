import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeSetStorage, safeGetStorage } from "@/utils/storageUtils";
import { PERSONAS_MAP } from "@/data/ripplePersonaData";
import { registerUserInRegistry, syncUserProfileToSupabase } from "@/services/adminService";
import { showSuccess } from "@/utils/toast";

export interface UserAccount {
  id: string;
  email: string;
  isDemo?: boolean;
  demoPersonaId?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

export function useRippleAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(
    () => safeGetStorage<UserAccount | null>("ripple_active_user", null)
  );

  const applySession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null) => {
    if (session?.user) {
      const acc: UserAccount = {
        id: session.user.id,
        email: session.user.email || "",
        isDemo: false
      };
      setCurrentUser(acc);
      safeSetStorage("ripple_active_user", acc);
      registerUserInRegistry({ id: acc.id, email: acc.email });
      syncUserProfileToSupabase(acc.id, acc.email);
    } else if (!currentUser?.isDemo) {
      // No active Supabase session (and we're not mid-demo) → signed out
      localStorage.removeItem("ripple_active_user");
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || "Invalid email or password." };
      }

      const acc: UserAccount = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        isDemo: false
      };
      setCurrentUser(acc);
      safeSetStorage("ripple_active_user", acc);
      showSuccess(`Signed in as ${cleanEmail}`);
      return { success: true };
    } catch (e) {
      console.error("Sign-in failed:", e);
      return { success: false, error: "Unable to reach authentication service. Check your connection and try again." };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Registration failed. Please try again." };
      }

      const acc: UserAccount = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        isDemo: false
      };

      // If no session is returned, email confirmation is required.
      if (!data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
          error: "Account created. Please confirm your email before signing in."
        };
      }

      setCurrentUser(acc);
      safeSetStorage("ripple_active_user", acc);
      showSuccess(`Account created & signed in!`);
      return { success: true };
    } catch (e) {
      console.error("Sign-up failed:", e);
      return { success: false, error: "Unable to reach authentication service. Check your connection and try again." };
    }
  };

  const loginDemoAccount = (personaId: string) => {
    const persona = PERSONAS_MAP[personaId] || PERSONAS_MAP["riya"];
    const account: UserAccount = {
      id: `demo_${persona.id}`,
      email: `${persona.id}@demo.ripple`,
      isDemo: true,
      demoPersonaId: persona.id
    };
    setCurrentUser(account);
    safeSetStorage("ripple_active_user", account);
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
  };

  const logout = async () => {
    try {
      if (currentUser && !currentUser.isDemo) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("Error signing out:", e);
    } finally {
      localStorage.removeItem("ripple_active_user");
      sessionStorage.removeItem("ripple_active_user");
      setCurrentUser(null);
      showSuccess("Signed out successfully.");
    }
  };

  return {
    currentUser,
    loginWithEmail,
    signUpWithEmail,
    loginDemoAccount,
    logout
  };
}