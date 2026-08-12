import React, { createContext, useContext } from 'react';
import { useRippleAuth } from '@/hooks/useRippleAuth';
import { useRippleData } from '@/hooks/useRippleData';
import { isAuthorizedAdmin } from '@/services/adminService';
import type { AdminUserSummary } from '@/types/admin';
import type { TaskStatus } from '@/types/ripple';

interface RippleContextType {
  // Auth
  currentUser: ReturnType<typeof useRippleAuth>['currentUser'];
  loginWithEmail: ReturnType<typeof useRippleAuth>['loginWithEmail'];
  signUpWithEmail: ReturnType<typeof useRippleAuth>['signUpWithEmail'];
  loginDemoAccount: ReturnType<typeof useRippleAuth>['loginDemoAccount'];
  logout: ReturnType<typeof useRippleAuth>['logout'];

  // Data
  isAdmin: boolean;
  isAdminView: boolean;
  setAdminView: (v: boolean) => void;
  impersonatedUser: AdminUserSummary | null;
  startImpersonatingUser: (user: AdminUserSummary) => void;
  exitImpersonatedUser: () => void;

  // Tutorial
  isTutorialOpen: boolean;
  currentTutorialStep: number;
  hasCompletedTutorial: boolean;
  setHasCompletedTutorial: (v: boolean) => void;
  startTutorial: () => void;
  replayTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
  setTutorialStep: (step: number) => void;

  // Data hook spread
  slots: ReturnType<typeof useRippleData>['slots'];
  tasks: ReturnType<typeof useRippleData>['tasks'];
  evidenceEntries: ReturnType<typeof useRippleData>['evidenceEntries'];
  studyLogs: ReturnType<typeof useRippleData>['studyLogs'];
  debt: ReturnType<typeof useRippleData>['debt'];
  settings: ReturnType<typeof useRippleData>['settings'];
  notificationSettings: ReturnType<typeof useRippleData>['notificationSettings'];
  currentPersonaId: ReturnType<typeof useRippleData>['currentPersonaId'];
  activeTaskForPrediction: ReturnType<typeof useRippleData>['activeTaskForPrediction'];
  activeFocusTask: ReturnType<typeof useRippleData>['activeFocusTask'];
  completedTaskForCelebration: ReturnType<typeof useRippleData>['completedTaskForCelebration'];
  isLoadingData: ReturnType<typeof useRippleData>['isLoadingData'];
  isNotificationModalOpen: ReturnType<typeof useRippleData>['isNotificationModalOpen'];
  setNotificationModalOpen: ReturnType<typeof useRippleData>['setNotificationModalOpen'];
  setActiveTaskForPrediction: ReturnType<typeof useRippleData>['setActiveTaskForPrediction'];
  setActiveFocusTask: ReturnType<typeof useRippleData>['setActiveFocusTask'];
  setCompletedTaskForCelebration: ReturnType<typeof useRippleData>['setCompletedTaskForCelebration'];
  addSlot: ReturnType<typeof useRippleData>['addSlot'];
  updateSlot: ReturnType<typeof useRippleData>['updateSlot'];
  deleteSlot: ReturnType<typeof useRippleData>['deleteSlot'];
  addTask: ReturnType<typeof useRippleData>['addTask'];
  updateTaskProgress: ReturnType<typeof useRippleData>['updateTaskProgress'];
  completeTask: ReturnType<typeof useRippleData>['completeTask'];
  renegotiateTask: ReturnType<typeof useRippleData>['renegotiateTask'];
  deleteTask: ReturnType<typeof useRippleData>['deleteTask'];
  logEvidence: ReturnType<typeof useRippleData>['logEvidence'];
  addStudyLog: ReturnType<typeof useRippleData>['addStudyLog'];
  deleteStudyLog: ReturnType<typeof useRippleData>['deleteStudyLog'];
  updateSettings: ReturnType<typeof useRippleData>['updateSettings'];
  updateNotificationSettings: ReturnType<typeof useRippleData>['updateNotificationSettings'];
  loadPersonaData: ReturnType<typeof useRippleData>['loadPersonaData'];
  resetAllData: ReturnType<typeof useRippleData>['resetAllData'];
}

const RippleContext = createContext<RippleContextType | undefined>(undefined);

export function RippleProvider({ children }: { children: React.ReactNode }) {
  const auth = useRippleAuth();
  const data = useRippleData(auth.currentUser);

  const [isAdminView, setAdminView] = React.useState(false);
  const [impersonatedUser, setImpersonatedUser] = React.useState<AdminUserSummary | null>(null);

  // Tutorial state from useRippleTutorial
  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = React.useState(false);

  const startTutorial = () => {
    setCurrentTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const replayTutorial = () => {
    setCurrentTutorialStep(0);
    setIsTutorialOpen(true);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  const completeTutorial = () => {
    setHasCompletedTutorial(true);
    setIsTutorialOpen(false);
    if (auth.currentUser && !auth.currentUser.isDemo) {
      localStorage.setItem(`ripple_tutorial_completed_${auth.currentUser.id}`, 'true');
    }
  };

  const setTutorialStep = (step: number) => {
    setCurrentTutorialStep(step);
  };

  const isAdmin = isAuthorizedAdmin(auth.currentUser?.email);

  const startImpersonatingUser = (user: AdminUserSummary) => {
    setImpersonatedUser(user);
    setAdminView(false);
  };

  const exitImpersonatedUser = () => {
    setImpersonatedUser(null);
    setAdminView(true);
  };

  const value: RippleContextType = {
    ...auth,
    ...data,
    isAdmin,
    isAdminView,
    setAdminView,
    impersonatedUser,
    startImpersonatingUser,
    exitImpersonatedUser,
    isTutorialOpen,
    currentTutorialStep,
    hasCompletedTutorial,
    setHasCompletedTutorial,
    startTutorial,
    replayTutorial,
    closeTutorial,
    completeTutorial,
    setTutorialStep,
  };

  return <RippleContext.Provider value={value}>{children}</RippleContext.Provider>;
}

export function useRipple(): RippleContextType {
  const context = useContext(RippleContext);
  if (!context) {
    throw new Error('useRipple must be used within a RippleProvider');
  }
  return context;
}