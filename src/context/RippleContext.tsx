import React, { createContext, useContext, useEffect } from 'react';
import { 
  TimetableSlot, 
  Task, 
  EvidenceEntry, 
  StudyLog,
  ProcrastinationDebt, 
  UserSettings,
  NotificationSettings
} from '@/types/ripple';
import { useRippleAuth, UserAccount, AuthResponse } from '@/hooks/useRippleAuth';
import { useRippleTutorial } from '@/hooks/useRippleTutorial';
import { useRippleData } from '@/hooks/useRippleData';
import { registerServiceWorker } from '@/utils/notificationService';

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

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <RippleContext.Provider
      value={{
        currentUser: auth.currentUser,
        loginWithEmail: auth.loginWithEmail,
        signUpWithEmail: auth.signUpWithEmail,
        loginDemoAccount: auth.loginDemoAccount,
        logout: auth.logout,

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