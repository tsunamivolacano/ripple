import { useState, useEffect, useCallback } from 'react';
import { Task, UserSettings, NotificationSettings } from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { generateUUID } from '@/utils/uuidUtils';
import { showSuccess } from '@/utils/toast';
import { 
  scheduleTaskNotifications, 
  cancelItemNotifications 
} from '@/utils/notificationService';
import { 
  syncTaskInsert, 
  syncTaskUpdate, 
  syncTaskDelete,
  syncDebtUpsert 
} from '@/services/databaseSyncService';
import { UserAccount } from './useRippleAuth';

export function useRippleTasks(
  currentUser: UserAccount | null,
  settings: UserSettings,
  notificationSettings: NotificationSettings,
  onCelebration: (task: Task) => void,
  onStreakUpdate: (updater: (prevDebt: any) => any) => void
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskForPrediction, setActiveTaskForPrediction] = useState<Task | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);

  // Status refresh interval ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.status === 'completed' || t.status === 'renegotiated') return t;
          const newStatus = calculateTaskStatus(
            t.dueDate,
            t.estimatedHours,
            t.completionPercentage,
            settings.personalVelocityMultiplier,
            t.hasDeadline ?? true
          );
          return { ...t, status: newStatus };
        })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, [settings.personalVelocityMultiplier]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!currentUser) return;
    const computedStatus = calculateTaskStatus(
      taskData.dueDate,
      taskData.estimatedHours,
      taskData.completionPercentage,
      settings.personalVelocityMultiplier,
      taskData.hasDeadline ?? true
    );

    const newTask: Task = {
      ...taskData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      status: computedStatus
    };

    setTasks((prev) => [newTask, ...prev]);

    if (!currentUser.isDemo) {
      await syncTaskInsert(currentUser.id, newTask);
    }

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }
    showSuccess(`Activity "${newTask.title}" saved.`);
  }, [currentUser, settings, notificationSettings]);

  const updateTaskProgress = useCallback(async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updatedStatus = isComplete
            ? 'completed'
            : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier, t.hasDeadline ?? true);

          const updatedTask: Task = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };

          updatedTaskObj = updatedTask;

          if (isComplete) {
            onCelebration(updatedTask);
            cancelItemNotifications(currentUser.id, taskId);

            onStreakUpdate((d: any) => {
              const newDebt = {
                ...d,
                streakDays: d.streakDays + 1,
                compoundingScore: Math.max(0, d.compoundingScore - 5)
              };
              if (!currentUser.isDemo) {
                syncDebtUpsert(currentUser.id, newDebt);
              }
              return newDebt;
            });
          }

          return updatedTask;
        }
        return t;
      })
    );

    if (updatedTaskObj && !currentUser.isDemo) {
      await syncTaskUpdate(currentUser.id, updatedTaskObj);
    }
  }, [currentUser, settings, onCelebration, onStreakUpdate]);

  const completeTask = useCallback(async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  }, [updateTaskProgress]);

  const renegotiateTask = useCallback(async (taskId: string, newDueDate: string, _reason: string) => {
    if (!currentUser) return;

    let updatedTaskObj: Task | null = null;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const count = (t.renegotiatedCount || 0) + 1;
          const newStatus = calculateTaskStatus(newDueDate, t.estimatedHours, t.completionPercentage, settings.personalVelocityMultiplier, true);
          const obj: Task = {
            ...t,
            hasDeadline: true,
            dueDate: newDueDate,
            renegotiatedCount: count,
            lastRenegotiatedAt: new Date().toISOString(),
            status: newStatus === 'too_late' ? 'tight' : newStatus
          };
          updatedTaskObj = obj;
          return obj;
        }
        return t;
      })
    );

    if (updatedTaskObj && !currentUser.isDemo) {
      await syncTaskUpdate(currentUser.id, updatedTaskObj);
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
    }

    onStreakUpdate((d: any) => {
      const newDebt = {
        ...d,
        totalHoursBehind: d.totalHoursBehind + 0.5,
        compoundingScore: Math.min(100, d.compoundingScore + 8)
      };
      if (!currentUser.isDemo) {
        syncDebtUpsert(currentUser.id, newDebt);
      }
      return newDebt;
    });

    showSuccess('Task schedule renegotiated & synced.');
  }, [currentUser, settings, notificationSettings, onStreakUpdate]);

  const deleteTask = useCallback(async (id: string) => {
    if (!currentUser) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (!currentUser.isDemo) {
      await syncTaskDelete(currentUser.id, id);
    }
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Task removed.');
  }, [currentUser]);

  return {
    tasks,
    setTasks,
    activeTaskForPrediction,
    setActiveTaskForPrediction,
    activeFocusTask,
    setActiveFocusTask,
    addTask,
    updateTaskProgress,
    completeTask,
    renegotiateTask,
    deleteTask
  };
}