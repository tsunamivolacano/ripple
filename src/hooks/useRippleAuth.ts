import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage, getLocalUserId } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { ActivityLogger } from '@/services/activityLogger';

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
        
        // Log login activity
        ActivityLogger.userLogin(session.user.id, session.user.email || '', {
          method: 'session_restore'
        });
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
        
        // Log login activity
        ActivityLogger.userLogin(session.user.id, session.user.email || '', {
          method: 'auth_state_change'
        });
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
        showSuccess(`Signed in as ${cleanEmail}`);
        
        // Log login activity
        ActivityLogger.userLogin(data.user.id, cleanEmail, {
          method: 'email_password'
        });
        
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
    showSuccess(`Signed in as ${cleanEmail}`);
    
    // Log login activity for local session
    ActivityLogger.userLogin(localId, cleanEmail, {
      method: 'local_session'
    });
    
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
        showSuccess(`Account created & signed in!`);
        
        // Log signup activity
        ActivityLogger.userSignup(data.user.id, cleanEmail, {
          method: 'email_password'
        });
        
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
    showSuccess(`Account created & signed in!`);
    
    // Log signup activity for local session
    ActivityLogger.userSignup(localId, cleanEmail, {
      method: 'local_session'
    });
    
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
    showSuccess(`Viewing Demo Persona: ${persona.name}`);
    
    // Log login activity for demo account
    ActivityLogger.userLogin(account.id, account.email, {
      method: 'demo_account',
      persona_id: persona.id
    });
  };

  const logout = async () => {
    try {
      if (currentUser && !currentUser.isDemo && !currentUser.isLocalSession) {
        // Log logout activity before signing out
        ActivityLogger.userLogout(currentUser.id, currentUser.email, {
          method: 'supabase_signout'
        });
        
        await supabase.auth.signOut();
      } else if (currentUser) {
        // Log logout for local/demo sessions
        ActivityLogger.userLogout(currentUser.id, currentUser.email, {
          method: currentUser.isDemo ? 'demo_logout' : 'local_logout'
        });
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