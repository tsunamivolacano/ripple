import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage, getLocalUserId } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess, showError } from '@/utils/toast';

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
    // Initial Supabase Session Sync
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
      }
    });

    // Listen for Auth changes across tabs/windows
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
      } else if (_event === 'SIGNED_OUT') {
        // If current user wasn't a demo account, clear session
        const stored = safeGetStorage<UserAccount | null>('ripple_active_user', null);
        if (stored && !stored.isDemo) {
          setCurrentUser(null);
          localStorage.removeItem('ripple_active_user');
        }
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        // Check if user exists in auth or if password is valid
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          // Attempt automatic signup if first-time user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password
          });

          if (!signUpError && signUpData?.user) {
            const acc: UserAccount = {
              id: signUpData.user.id,
              email: signUpData.user.email || cleanEmail,
              isDemo: false
            };
            setCurrentUser(acc);
            safeSetStorage('ripple_active_user', acc);
            showSuccess(`Welcome! Account created & signed in as ${cleanEmail}`);
            return { success: true };
          }
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        showSuccess(`Signed in as ${cleanEmail}`);
        return { success: true };
      }
    } catch (e: any) {
      console.warn('Auth exception, preserving safe local access:', e);
      return { success: false, error: e?.message || 'Authentication error' };
    }

    return { success: false, error: 'Unable to authenticate. Please check your connection.' };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password
      });

      if (error) {
        // If already registered, attempt login
        if (error.message.toLowerCase().includes('already registered')) {
          return await loginWithEmail(cleanEmail, password);
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        showSuccess(`Account created & signed in!`);
        return { success: true };
      }
    } catch (e: any) {
      console.warn('Signup exception:', e);
      return { success: false, error: e?.message || 'Registration error' };
    }

    return { success: false, error: 'Failed to create account.' };
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