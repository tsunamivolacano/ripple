import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage, getLocalUserId } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { logUserActivity } from '@/services/loggerService';

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
<dyad-write path="src/hooks/useRippleAuth.ts" description="Updating useRippleAuth to permanently log all authentication events to Supabase user_activity_logs">
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeGetStorage, safeSetStorage, getLocalUserId } from '@/utils/storageUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { logUserActivity } from '@/services/loggerService';

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

        logUserActivity({
          eventName: 'session_resume',
          eventType: 'auth',
          userId: acc.id,
          userEmail: acc.email,
          success: true,
          metadata: { provider: session.user.app_metadata?.provider || 'email' }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !currentUser?.isLocalSession) {
        const acc: UserAccount = {
          id: session.user.id,
          email: session.user.email || '',
          isDemo: false
        };
        setCurrentUser(acc);
        safeSetStorage('ripple_active_user', acc);

        if (event === 'SIGNED_IN') {
          logUserActivity({
            eventName: 'auth_session_signed_in',
            eventType: 'auth',
            userId: acc.id,
            userEmail: acc.email,
            success: true,
            metadata: { authEvent: event }
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      logUserActivity({
        eventName: 'auth_login_failed',
        eventType: 'auth',
        userEmail: cleanEmail,
        success: false,
        errorDetails: 'Missing email or password'
      });
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (error) {
        logUserActivity({
          eventName: 'auth_login_failed',
          eventType: 'auth',
          userEmail: cleanEmail,
          success: false,
          errorDetails: error.message
        });
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

        logUserActivity({
          eventName: 'auth_login_success',
          eventType: 'auth',
          userId: acc.id,
          userEmail: acc.email,
          success: true,
          metadata: { provider: 'supabase_auth' }
        });

        return { success: true };
      }
    } catch (e: any) {
      console.warn('Auth exception, fallback to local session:', e);
      logUserActivity({
        eventName: 'auth_login_fallback_local',
        eventType: 'auth',
        userEmail: cleanEmail,
        success: true,
        metadata: { errorFallback: e?.message || String(e) }
      });
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

    logUserActivity({
      eventName: 'auth_login_success',
      eventType: 'auth',
      userId: localAcc.id,
      userEmail: localAcc.email,
      success: true,
      metadata: { provider: 'local_session' }
    });

    return { success: true };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      logUserActivity({
        eventName: 'auth_signup_failed',
        eventType: 'auth',
        userEmail: cleanEmail,
        success: false,
        errorDetails: 'Missing email or password'
      });
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password
      });

      if (error) {
        logUserActivity({
          eventName: 'auth_signup_failed',
          eventType: 'auth',
          userEmail: cleanEmail,
          success: false,
          errorDetails: error.message
        });
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

        logUserActivity({
          eventName: 'auth_signup_success',
          eventType: 'auth',
          userId: acc.id,
          userEmail: acc.email,
          success: true,
          metadata: { provider: 'supabase_auth' }
        });

        return { success: true };
      }
    } catch (e: any) {
      console.warn('Signup exception, fallback to local session:', e);
      logUserActivity({
        eventName: 'auth_signup_fallback_local',
        eventType: 'auth',
        userEmail: cleanEmail,
        success: true,
        metadata: { errorFallback: e?.message || String(e) }
      });
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

    logUserActivity({
      eventName: 'auth_signup_success',
      eventType: 'auth',
      userId: localAcc.id,
      userEmail: localAcc.email,
      success: true,
      metadata: { provider: 'local_session' }
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

    logUserActivity({
      eventName: 'auth_demo_login',
      eventType: 'auth',
      userId: account.id,
      userEmail: account.email,
      success: true,
      metadata: { personaId: persona.id, personaName: persona.name, role: persona.role }
    });
  };

  const logout = async () => {
    const loggingOutUser = currentUser;
    try {
      if (currentUser && !currentUser.isDemo && !currentUser.isLocalSession) {
        await supabase.auth.signOut();
      }
    } catch (e: any) {
      console.error('Error signing out:', e);
    } finally {
      if (loggingOutUser) {
        logUserActivity({
          eventName: 'auth_logout',
          eventType: 'auth',
          userId: loggingOutUser.id,
          userEmail: loggingOutUser.email,
          success: true
        });
      }

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