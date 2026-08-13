import { useState, Dispatch, SetStateAction } from 'react';
import { Task, UserSettings, NotificationSettings, ProcrastinationDebt } from '@/types/ripple';
import { calculateTaskStatus } from '@/utils/timeUtils';
import { showSuccess } from '@/utils/toast';
import { scheduleTaskNotifications, cancelItemNotifications } from '@/utils/notificationService';
import { logUserActivity } from '@/services/loggerService';
import { UserAccount } from '../useRippleAuth';

export function useTaskData(
  currentUser: UserAccount | null,
  tasks: Task[],
  setTasks: Dispatch<SetStateAction<Task[]>>,
  setDebt: Dispatch<SetStateAction<ProcrastinationDebt>>,
  settings: UserSettings,
  notificationSettings: NotificationSettings,
  setCompletedTaskForCelebration: Dispatch<SetStateAction<Task | null>>
) {
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
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
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: computedStatus
    };

    setTasks((prev) => [newTask, ...prev]);

    if (newTask.hasDeadline && newTask.dueDate) {
      await scheduleTaskNotifications(currentUser.id, newTask, notificationSettings);
    }
    showSuccess(`Activity "${newTask.title}" added successfully.`);

    logUserActivity({
      eventName: 'task_created',
      eventType: 'task',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: {
        taskId: newTask.id,
        title: newTask.title,
        category: newTask.category,
        taskType: newTask.taskType,
        estimatedHours: newTask.estimatedHours,
        hasDeadline: newTask.hasDeadline,
        dueDate: newTask.dueDate
      }
    });
  };

  const updateTaskProgress = async (taskId: string, percentage: number) => {
    if (!currentUser) return;

    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const isComplete = percentage >= 100;
          const updatedStatus = isComplete
            ? 'completed'
            : calculateTaskStatus(t.dueDate, t.estimatedHours, percentage, settings.personalVelocityMultiplier, t.hasDeadline ?? true);

          const updatedTask = {
            ...t,
            completionPercentage: percentage,
            status: updatedStatus,
            completedAt: isComplete ? new Date().toISOString() : t.completedAt
          };

          if (isComplete) {
            setCompletedTaskForCelebration(updatedTask);
            cancelItemNotifications(currentUser.id, taskId);

            setDebt((d) => ({
              ...d,
              streakDays: d.streakDays + 1,
              compoundingScore: Math.max(0, d.compoundingScore - 5)
            }));

            logUserActivity({
              eventName: 'task_completed',
              eventType: 'task',
              userId: currentUser.id,
              userEmail: currentUser.email,
              success: true,
              metadata: { taskId: t.id, title: t.title, completionPercentage: percentage }
            });
          } else {
            logUserActivity({
              eventName: 'task_progress_updated',
              eventType: 'task',
              userId: currentUser.id,
              userEmail: currentUser.email,
              success: true,
              metadata: { taskId: t.id, title: t.title, completionPercentage: percentage }
            });
          }

          return updatedTask;
        }
        return t;
      })
    );
  };

  const completeTask = async (taskId: string) => {
    await updateTaskProgress(taskId, 100);
  };

  const renegotiateTask = async (taskId: string, newDueDate: string, reason: string) => {
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

    if (updatedTaskObj) {
      await scheduleTaskNotifications(currentUser.id, updatedTaskObj, notificationSettings);
    }

    setDebt((d) => ({
      ...d,
      totalHoursBehind: d.totalHoursBehind + 0.5,
      compoundingScore: Math.min(100, d.compoundingScore + 8)
    }));

    showSuccess('Task schedule renegotiated & notifications updated.');

    logUserActivity({
      eventName: 'task_renegotiated',
      eventType: 'task',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { taskId, newDueDate, reason }
    });
  };

  const deleteTask = async (id: string) => {
    if (!currentUser) return;
    const taskToDelete = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await cancelItemNotifications(currentUser.id, id);
    showSuccess('Task removed.');

    logUserActivity({
      eventName: 'task_deleted',
      eventType: 'task',
      userId: currentUser.id,
      userEmail: currentUser.email,
      success: true,
      metadata: { taskId: id, title: taskToDelete?.title }
    });
  };

  return { addTask, updateTaskProgress, completeTask, renegotiateTask, deleteTask };
}