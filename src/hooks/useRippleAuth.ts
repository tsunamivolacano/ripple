import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
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
  needsEmailConfirmation?: boolean;
}

export function useRippleAuth() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    safeGetStorage<UserAccount | null>('ripple_active_user', null)
  );

  useEffect(() => {
    // 1. Check existing active Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email?.toLowerCase() || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
      } else {
        const stored = safeGetStorage<UserAccount | null>('ripple_active_user', null);
        if (stored && !stored.isDemo) {
          // No active Supabase session found
          setCurrentUser(null);
          localStorage.removeItem('ripple_active_user');
        }
      }
    });

    // 2. Listen to real-time auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email?.toLowerCase() || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
      } else if (event === 'SIGNED_OUT') {
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
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed')) {
          return {
            success: false,
            needsEmailConfirmation: true,
            error: 'Your email address has not been confirmed yet. Please check your inbox or click Resend Confirmation below.'
          };
        }
        if (msg.includes('invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password. If you have not created an account yet, please use the Create Account tab.'
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.session && data?.user) {
        const acc: UserAccount = {
          id: data.user.id,
          email: data.user.email?.toLowerCase() || cleanEmail,
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);
        showSuccess(`Welcome back! Signed in as ${cleanEmail}`);
        return { success: true };
      }
    } catch (e: any) {
      console.error('[useRippleAuth] Login exception:', e);
      return { success: false, error: e?.message || 'Authentication error. Please check your connection.' };
    }

    return { success: false, error: 'Unable to authenticate. Please verify your credentials.' };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please provide both email and password.' };
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
        const msg = error.message.toLowerCase();
        if (msg.includes('already registered')) {
          return {
            success: false,
            error: 'An account with this email already exists. Please switch to the Sign In tab.'
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // If session was returned immediately (email confirmation disabled in Supabase)
        if (data.session) {
          const acc: UserAccount = {
            id: data.user.id,
            email: data.user.email?.toLowerCase() || cleanEmail,
            isDemo: false
          };
          setCurrentUser(acc);
          safeSetStorage('ripple_active_user', acc);
          showSuccess(`Account created & signed in as ${cleanEmail}!`);
          return { success: true };
        } else {
          // Confirmation email was dispatched
          return {
            success: true,
            needsEmailConfirmation: true,
            error: `Account created! We've sent a verification link to ${cleanEmail}. Please check your inbox (and spam folder) to confirm.`
          };
        }
      }
    } catch (e: any) {
      console.error('[useRippleAuth] Signup exception:', e);
      return { success: false, error: e?.message || 'Registration error.' };
    }

    return { success: false, error: 'Failed to create account.' };
  };

  const resendConfirmationEmail = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showError('Please enter your email address.');
      return false;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail
      });

      if (error) {
        showError(error.message);
        return false;
      }

      showSuccess(`Verification email resent to ${cleanEmail}. Please check your inbox!`);
      return true;
    } catch (e: any) {
      showError(e?.message || 'Failed to resend confirmation email.');
      return false;
    }
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
    resendConfirmationEmail,
    loginDemoAccount,
    logout
  };
}