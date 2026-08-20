import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { ALL_PERSONAS } from '@/data/ripplePersonaData';
import { Zap, Mail, Lock, ArrowRight, UserPlus, LogIn, AlertCircle, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AuthPage: React.FC = () => {
  const { loginWithEmail, signUpWithEmail, resendConfirmationEmail, loginDemoAccount } = useRipple();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [needsConfirmationEmail, setNeedsConfirmationEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setNeedsConfirmationEmail(null);

    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithEmail(email, loginPassword);
    setIsLoading(false);

    if (!result.success) {
      if (result.needsEmailConfirmation) {
        setNeedsConfirmationEmail(email);
      }
      setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setNeedsConfirmationEmail(null);

    const email = signUpEmail.trim();
    if (!email || !signUpPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    const result = await signUpWithEmail(email, signUpPassword);
    setIsLoading(false);

    if (result.success && result.needsEmailConfirmation) {
      setNeedsConfirmationEmail(email);
      setInfoMessage(result.error || 'Account created! Please check your email to confirm your account.');
    } else if (!result.success) {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
    }
  };

  const handleResendConfirmation = async () => {
    const email = needsConfirmationEmail || loginEmail.trim() || signUpEmail.trim();
    if (!email) return;

    setIsResending(true);
    await resendConfirmationEmail(email);
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 shadow-xl shadow-rose-900/30 mb-2">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            RIPPLE
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Consequence-Aware AI Task Management System
          </p>
        </div>

        {/* Auth Box */}
        <Card className="bg-slate-900/90 border-slate-800 text-white shadow-2xl rounded-2xl backdrop-blur-md">
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => {
              setActiveTab(val);
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className="w-full"
          >
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <TabsList className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <TabsTrigger value="login" className="text-xs font-semibold data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-xs font-semibold data-[state=active]:bg-rose-600 data-[state=active]:text-white rounded-lg">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Create Account
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 flex flex-col gap-2 text-rose-300 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                  {needsConfirmationEmail && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isResending}
                      onClick={handleResendConfirmation}
                      className="self-start mt-1 border-rose-500/40 bg-rose-900/40 hover:bg-rose-800/60 text-white text-[11px] h-7 px-2.5 gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                      Resend Confirmation Email
                    </Button>
                  )}
                </div>
              )}

              {infoMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex flex-col gap-2 text-emerald-300 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{infoMessage}</span>
                  </div>
                  {needsConfirmationEmail && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isResending}
                      onClick={handleResendConfirmation}
                      className="self-start mt-1 border-emerald-500/40 bg-emerald-900/40 hover:bg-emerald-800/60 text-white text-[11px] h-7 px-2.5 gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                      Resend Verification Link
                    </Button>
                  )}
                </div>
              )}

              {/* Login Tab */}
              <TabsContent value="login" className="m-0 space-y-4">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 rounded-xl gap-2 shadow-lg shadow-rose-950"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="m-0 space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-rose-400" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl focus-visible:ring-rose-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 rounded-xl gap-2 shadow-lg shadow-rose-950"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>

              {/* Separator */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                  <span className="bg-slate-900 px-3 text-slate-400">
                    OR EXPLORE WITH DEMO PERSONA
                  </span>
                </div>
              </div>

              {/* Demo Accounts List */}
              <div className="space-y-2.5">
                {ALL_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => loginDemoAccount(persona.id)}
                    className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {persona.avatarBadge}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                            {persona.name}
                          </h4>
                          <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-300 bg-indigo-950/30 px-1.5 py-0">
                            Demo
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {persona.role}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Tabs>
        </Card>

        {/* Privacy Note */}
        <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Secured with Supabase Auth session tokens & Row-Level Security.
        </p>
      </div>
    </div>
  );
};
</dyad-file>

<dyad-write path="src/context/RippleContext.tsx" description="Exposed resendConfirmationEmail in RippleContext">
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog, 
  ProcrastinationDebt, 
  UserSettings, 
  NotificationSettings,
  ActiveTimerState 
} from '@/types/ripple';
import { AdminUserSummary } from '@/types/admin';
import { isAuthorizedAdmin, logAdminAuditAction } from '@/services/adminService';
import { useRippleAuth, UserAccount, AuthResponse } from '@/hooks/useRippleAuth';
import { useRippleTutorial } from '@/hooks/useRippleTutorial';
import { useRippleData } from '@/hooks/useRippleData';
import { registerServiceWorker } from '@/utils/notificationService';
import { showSuccess } from '@/utils/toast';

export type { UserAccount, AuthResponse };

interface RippleContextType {
  currentUser: UserAccount | null;
  slots: TimetableSlot[];
  tasks: Task[];
  evidenceEntries: EvidenceEntry[];
  studyLogs: StudyLog[];
  debt: ProcrastinationDebt;
  settings: UserSettings;
  notificationSettings: NotificationSettings;
  currentPersonaId: string;
  activeTaskForPrediction: Task | null;
  activeFocusTask: Task | null;
  completedTaskForCelebration: Task | null;
  isLoadingData: boolean;

  // Background Timer System
  activeTimer: ActiveTimerState | null;
  startGlobalTimer: (params: {
    taskId?: string;
    taskTitle: string;
    subject: string;
    durationMinutes: number;
    isMinimized?: boolean;
  }) => void;
  pauseGlobalTimer: () => void;
  resumeGlobalTimer: () => void;
  resetGlobalTimer: (newDurationMinutes?: number) => void;
  setTimerMinimized: (minimized: boolean) => void;
  stopAndLogTimer: () => void;
  cancelGlobalTimer: () => void;

  // Admin & Support Impersonation State
  isAdmin: boolean;
  isAdminView: boolean;
  setAdminView: (open: boolean) => void;
  impersonatedUser: AdminUserSummary | null;
  startImpersonatingUser: (user: AdminUserSummary) => void;
  exitImpersonatedUser: () => void;

  // Notification Modal
  isNotificationModalOpen: boolean;
  setNotificationModalOpen: (open: boolean) => void;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;

  // Tutorial State
  isTutorialOpen: boolean;
  currentTutorialStep: number;
  hasCompletedTutorial: boolean;
  startTutorial: () => void;
  replayTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
  setTutorialStep: (step: number) => void;
  
  // Auth actions
  loginWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  resendConfirmationEmail: (email: string) => Promise<boolean>;
  loginDemoAccount: (personaId: string) => void;
  logout: () => void;

  setActiveTaskForPrediction: (task: Task | null) => void;
  setActiveFocusTask: (task: Task | null) => void;
  setCompletedTaskForCelebration: (task: Task | null) => void;
  
  // Slot management
  addSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
  updateSlot: (slot: TimetableSlot) => Promise<void>;
  deleteSlot: (id: string) => Promise<void>;

  // Task management
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateTaskProgress: (taskId: string, percentage: number) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  renegotiateTask: (taskId: string, newDueDate: string, reason: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Evidence log management
  logEvidence: (entry: Omit<EvidenceEntry, 'id' | 'dateLogged'>) => Promise<void>;

  // Study Tracker management
  addStudyLog: (log: Omit<StudyLog, 'id' | 'loggedAt'>) => Promise<void>;
  deleteStudyLog: (id: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  
  // Persona actions
  loadPersonaData: (personaId: string) => void;
  resetAllData: () => void;
}

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useRippleAuth();
  const tutorial = useRippleTutorial(auth.currentUser);
  const data = useRippleData(auth.currentUser);

  const [isAdminView, setAdminView] = useState<boolean>(false);
  const [impersonatedUser, setImpersonatedUser] = useState<AdminUserSummary | null>(null);

  const isAdmin = isAuthorizedAdmin(auth.currentUser?.email);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const startImpersonatingUser = (user: AdminUserSummary) => {
    if (!isAdmin) return;
    setImpersonatedUser(user);
    setAdminView(false);
    showSuccess(`Viewing app as ${user.name}`);
  };

  const exitImpersonatedUser = () => {
    if (impersonatedUser) {
      logAdminAuditAction('IMPERSONATE_USER_END', impersonatedUser.id, impersonatedUser.email, `Exited Support Mode for ${impersonatedUser.email}`);
    }
    setImpersonatedUser(null);
    setAdminView(true);
    showSuccess('Exited Support Mode. Returned to Admin Dashboard.');
  };

  return (
    <RippleContext.Provider
      value={{
        currentUser: auth.currentUser,
        loginWithEmail: auth.loginWithEmail,
        signUpWithEmail: auth.signUpWithEmail,
        resendConfirmationEmail: auth.resendConfirmationEmail,
        loginDemoAccount: auth.loginDemoAccount,
        logout: auth.logout,

        isAdmin,
        isAdminView,
        setAdminView,
        impersonatedUser,
        startImpersonatingUser,
        exitImpersonatedUser,

        isTutorialOpen: tutorial.isTutorialOpen,
        currentTutorialStep: tutorial.currentTutorialStep,
        hasCompletedTutorial: tutorial.hasCompletedTutorial,
        startTutorial: tutorial.startTutorial,
        replayTutorial: tutorial.replayTutorial,
        closeTutorial: tutorial.closeTutorial,
        completeTutorial: tutorial.completeTutorial,
        setTutorialStep: tutorial.setTutorialStep,

        slots: data.slots,
        tasks: data.tasks,
        evidenceEntries: data.evidenceEntries,
        studyLogs: data.studyLogs,
        debt: data.debt,
        settings: data.settings,
        notificationSettings: data.notificationSettings,
        currentPersonaId: data.currentPersonaId,
        activeTaskForPrediction: data.activeTaskForPrediction,
        activeFocusTask: data.activeFocusTask,
        completedTaskForCelebration: data.completedTaskForCelebration,
        isLoadingData: data.isLoadingData,
        isNotificationModalOpen: data.isNotificationModalOpen,

        activeTimer: data.activeTimer,
        startGlobalTimer: data.startGlobalTimer,
        pauseGlobalTimer: data.pauseGlobalTimer,
        resumeGlobalTimer: data.resumeGlobalTimer,
        resetGlobalTimer: data.resetGlobalTimer,
        setTimerMinimized: data.setTimerMinimized,
        stopAndLogTimer: data.stopAndLogTimer,
        cancelGlobalTimer: data.cancelGlobalTimer,

        setNotificationModalOpen: data.setNotificationModalOpen,
        setActiveTaskForPrediction: data.setActiveTaskForPrediction,
        setActiveFocusTask: data.setActiveFocusTask,
        setCompletedTaskForCelebration: data.setCompletedTaskForCelebration,
        addSlot: data.addSlot,
        updateSlot: data.updateSlot,
        deleteSlot: data.deleteSlot,
        addTask: data.addTask,
        updateTaskProgress: data.updateTaskProgress,
        completeTask: data.completeTask,
        renegotiateTask: data.renegotiateTask,
        deleteTask: data.deleteTask,
        logEvidence: data.logEvidence,
        addStudyLog: data.addStudyLog,
        deleteStudyLog: data.deleteStudyLog,
        updateSettings: data.updateSettings,
        updateNotificationSettings: data.updateNotificationSettings,
        loadPersonaData: data.loadPersonaData,
        resetAllData: data.resetAllData
      }}
    >
      {children}
    </RippleContext.Provider>
  );
};

export const useRipple = () => {
  const context = useContext(RippleContext);
  if (!context) {
    throw new Error('useRipple must be used within a RippleProvider');
  }
  return context;
};