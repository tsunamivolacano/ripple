import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage, getLocalUserId } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { registerUserInRegistry } from '@/services/adminService';
import { showSuccess } from '@/utils/toast';

export interface UserAccount {
  id: string;
  email: string;
  isDemo?: boolean;
  demoPersonaId?: string;
  isLocalSession?: boolean;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export function useRippleAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeGetStorage<UserAccount | null>('ripple_active_user', null)
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !currentUser?.isLocalSession) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        registerUserInRegistry({ id: acc.id, email: acc.email });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !currentUser?.isLocalSession) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        registerUserInRegistry({ id: acc.id, email: acc.email });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        registerUserInRegistry({ id: acc.id, email: acc.email });
        showSuccess(`Signed in as ${cleanEmail}`);
        return { success: true };
      }
    } catch (e) {
      console.warn('Auth exception, fallback to local session:', e);
    }

    const localId = getLocalUserId(cleanEmail);
    const localAcc: UserAccount = {
      id: localId,
      email: cleanEmail,
      isDemo: false,
      isLocalSession: true
    };
    setCurrentUser(localAcc);
    safeSetStorage('ripple_active_user', localAcc);
    registerUserInRegistry({ id: localAcc.id, email: localAcc.email });
    showSuccess(`Signed in as ${cleanEmail}`);
    return { success: true };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password
      });

      if (data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        registerUserInRegistry({ id: acc.id, email: acc.email });
        showSuccess(`Account created & signed in!`);
        return { success: true };
      }
    } catch (e) {
      console.warn('Signup exception, fallback to local session:', e);
    }

    const localId = getLocalUserId(cleanEmail);
    const localAcc: UserAccount = {
      id: localId,
      email: cleanEmail,
      isDemo: false,
      isLocalSession: true
    };
    setCurrentUser(localAcc);
    safeSetStorage('ripple_active_user', localAcc);
    registerUserInRegistry({ id: localAcc.id, email: localAcc.email });
    showSuccess(`Account created & signed in!`);
    return { success: true };
  };

  const loginDemoAccount = (personaId: string) => {
    const persona = PERSONAS_MAP[personaId] || PERSONAS_MAP['riya'];
    const account: UserAccount = {
      id: `demo_${persona.id}`,
      email: `${persona.id}@demo.ripple`,
      isDemo: true,
      demoPersonaId: persona.id
    };
    setCurrentUser(account);
    safeSetStorage('ripple_active_user', account);
    registerUserInRegistry({ id: account.id, email: account.email, name: persona.name });
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
  };

  const logout = async () => {
    try {
      if (currentUser && !currentUser.isDemo && !currentUser.isLocalSession) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      localStorage.removeItem('ripple_active_user');
      sessionStorage.removeItem('ripple_active_user');
      setCurrentUser(null);
      showSuccess('Signed out successfully.');
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