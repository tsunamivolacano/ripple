import { useState, useEffect, useRef } from 'react';
import { 
  Task, 
  ProcrastinationDebt
} from '@/types/ripple';
import { safeSetStorage } from '@/utils/storageUtils';
import { calculateUnifiedDebt } from '@/utils/studyDebtUtils';
import { PERSONAS_MAP } from '@/data/ripplePersonaData';
import { showSuccess } from '@/utils/toast';
import { loadUserCloudData, syncDebtUpsert } from '@/services/databaseSyncService';
import { UserAccount } from './useRippleAuth';

import { useRippleTimer } from './useRippleTimer';
import { useRippleStudyLogs } from './useRippleStudyLogs';
import { useRippleTasks } from './useRippleTasks';
import { useRippleSlots } from './useRippleSlots';
import { useRippleEvidence } from './useRippleEvidence';
import { useRippleSettings } from './useRippleSettings';

const defaultPersona = PERSONAS_MAP['riya'];

const emptyDebt: ProcrastinationDebt = {
  totalHoursBehind: 0,
  missedDeadlinesCount: 0,
  streakDays: 0,
  compoundingScore: 0,
  weeklyDebtTrend: [
    { day: 'Mon', debtHours: 0 },
    { day: 'Tue', debtHours: 0 },
    { day: 'Wed', debtHours: 0 },
    { day: 'Thu', debtHours: 0 },
    { day: 'Fri', debtHours: 0 },
    { day: 'Sat', debtHours: 0 },
    { day: 'Sun', debtHours: 0 }
  ],
  dailyTargetHours: 3.0,
  recommendedNextDayTargetHours: 3.0,
  studyDeficitHours: 0
};

export function useRippleData(currentUser: UserAccount | null) {
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('riya');
  const [debt, setDebt] = useState<ProcrastinationDebt>(emptyDebt);
  const [completedTaskForCelebration, setCompletedTaskForCelebration] = useState<Task | null>(null);

  // Sub-modules
  const settingsModule = useRippleSettings(currentUser);
  const studyLogsModule = useRippleStudyLogs(currentUser);
  const slotsModule = useRippleSlots(currentUser, settingsModule.notificationSettings);

  const tasksModule = useRippleTasks(
    currentUser,
    settingsModule.settings,
    settingsModule.notificationSettings,
    (task) => setCompletedTaskForCelebration(task),
    (updater) => setDebt((prev) => updater(prev))
  );

  const evidenceModule = useRippleEvidence(currentUser);
  const timerModule = useRippleTimer(studyLogsModule.addStudyLog);

  const isInitialLoadDoneRef = useRef(false);

  // Load account data when currentUser changes (Cloud-first)
  useEffect(() => {
    let isCancelled = false;

    async function initializeUserData() {
      if (!currentUser) {
        slotsModule.setSlots([]);
        tasksModule.setTasks([]);
        evidenceModule.setEvidenceEntries([]);
        studyLogsModule.setStudyLogs([]);
        setDebt(emptyDebt);
        setIsLoadingData(false);
        isInitialLoadDoneRef.current = false;
        return;
      }

      setIsLoadingData(true);

      // Demo Persona account
      if (currentUser.isDemo && currentUser.demoPersonaId) {
        const persona = PERSONAS_MAP[currentUser.demoPersonaId] || defaultPersona;
        slotsModule.setSlots(persona.slots);
        tasksModule.setTasks(persona.tasks);
        evidenceModule.setEvidenceEntries(persona.evidenceEntries);
        studyLogsModule.setStudyLogs([]);
        setDebt(persona.debt);
        settingsModule.setSettings(persona.settings);
        setCurrentPersonaId(persona.id);
        setIsLoadingData(false);
        isInitialLoadDoneRef.current = true;
        return;
      }

      // Live Authenticated User: Load from Supabase Cloud
      try {
        const cloudData = await loadUserCloudData(currentUser.id);
        if (!isCancelled) {
          slotsModule.setSlots(cloudData.slots);
          tasksModule.setTasks(cloudData.tasks);
          evidenceModule.setEvidenceEntries(cloudData.evidenceEntries);
          studyLogsModule.setStudyLogs(cloudData.studyLogs);
          setDebt(cloudData.debt);
          settingsModule.setSettings(cloudData.settings);
          settingsModule.setNotificationSettings(cloudData.notificationSettings);
          isInitialLoadDoneRef.current = true;
        }
      } catch (e) {
        console.error('[useRippleData] Error loading cloud data:', e);
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
        }
      }
    }

    initializeUserData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // Recompute unified study debt & daily shortfall whenever study logs, tasks or daily target change
  useEffect(() => {
    if (!isLoadingData && currentUser && isInitialLoadDoneRef.current) {
      const targetHours = settingsModule.settings.dailyStudyTargetHours || 3.0;
      const recomputedDebt = calculateUnifiedDebt(
        studyLogsModule.studyLogs,
        tasksModule.tasks,
        targetHours,
        debt.streakDays
      );
      setDebt(recomputedDebt);

      if (!currentUser.isDemo) {
        syncDebtUpsert(currentUser.id, recomputedDebt);
      }
    }
  }, [studyLogsModule.studyLogs, tasksModule.tasks.length, settingsModule.settings.dailyStudyTargetHours]);

  // Local storage persistence backup (Only runs AFTER initial load completes to avoid wiping cache)
  useEffect(() => {
    if (currentUser && !currentUser.isDemo && !isLoadingData && isInitialLoadDoneRef.current) {
      const uKey = currentUser.id;
      safeSetStorage(`ripple_slots_${uKey}`, slotsModule.slots);
      safeSetStorage(`ripple_tasks_${uKey}`, tasksModule.tasks);
      safeSetStorage(`ripple_evidence_${uKey}`, evidenceModule.evidenceEntries);
      safeSetStorage(`ripple_study_${uKey}`, studyLogsModule.studyLogs);
      safeSetStorage(`ripple_debt_${uKey}`, debt);
      safeSetStorage(`ripple_settings_${uKey}`, settingsModule.settings);
      safeSetStorage(`ripple_notif_settings_${uKey}`, settingsModule.notificationSettings);
    }
  }, [
    currentUser,
    slotsModule.slots,
    tasksModule.tasks,
    evidenceModule.evidenceEntries,
    studyLogsModule.studyLogs,
    debt,
    settingsModule.settings,
    settingsModule.notificationSettings,
    isLoadingData
  ]);

  const loadPersonaData = (personaId: string) => {
    const bundle = PERSONAS_MAP[personaId] || defaultPersona;
    setCurrentPersonaId(bundle.id);
    slotsModule.setSlots(bundle.slots);
    tasksModule.setTasks(bundle.tasks);
    evidenceModule.setEvidenceEntries(bundle.evidenceEntries);
    studyLogsModule.setStudyLogs([]);
    setDebt(bundle.debt);
    settingsModule.setSettings(bundle.settings);
    showSuccess(`Loaded template data: ${bundle.name}`);
  };

  const resetAllData = () => {
    slotsModule.setSlots([]);
    tasksModule.setTasks([]);
    evidenceModule.setEvidenceEntries([]);
    studyLogsModule.setStudyLogs([]);
    setDebt(emptyDebt);
    timerModule.cancelGlobalTimer();
    showSuccess('All data reset for active account.');
  };

  return {
    slots: slotsModule.slots,
    tasks: tasksModule.tasks,
    evidenceEntries: evidenceModule.evidenceEntries,
    studyLogs: studyLogsModule.studyLogs,
    debt,
    settings: settingsModule.settings,
    notificationSettings: settingsModule.notificationSettings,
    currentPersonaId,
    activeTaskForPrediction: tasksModule.activeTaskForPrediction,
    activeFocusTask: tasksModule.activeFocusTask,
    completedTaskForCelebration,
    isLoadingData,
    isNotificationModalOpen: settingsModule.isNotificationModalOpen,

    // Timer methods
    activeTimer: timerModule.activeTimer,
    startGlobalTimer: timerModule.startGlobalTimer,
    pauseGlobalTimer: timerModule.pauseGlobalTimer,
    resumeGlobalTimer: timerModule.resumeGlobalTimer,
    resetGlobalTimer: timerModule.resetGlobalTimer,
    setTimerMinimized: timerModule.setTimerMinimized,
    stopAndLogTimer: timerModule.stopAndLogTimer,
    cancelGlobalTimer: timerModule.cancelGlobalTimer,

    // State updaters
    setNotificationModalOpen: settingsModule.setNotificationModalOpen,
    setActiveTaskForPrediction: tasksModule.setActiveTaskForPrediction,
    setActiveFocusTask: tasksModule.setActiveFocusTask,
    setCompletedTaskForCelebration,

    // CRUD operations
    addSlot: slotsModule.addSlot,
    updateSlot: slotsModule.updateSlot,
    deleteSlot: slotsModule.deleteSlot,
    addTask: tasksModule.addTask,
    updateTaskProgress: tasksModule.updateTaskProgress,
    completeTask: tasksModule.completeTask,
    renegotiateTask: tasksModule.renegotiateTask,
    deleteTask: tasksModule.deleteTask,
    logEvidence: evidenceModule.logEvidence,
    addStudyLog: studyLogsModule.addStudyLog,
    deleteStudyLog: studyLogsModule.deleteStudyLog,
    updateSettings: settingsModule.updateSettings,
    updateNotificationSettings: settingsModule.updateNotificationSettings,
    loadPersonaData,
    resetAllData
  };
}