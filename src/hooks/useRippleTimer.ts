import { useState, useEffect, useRef } from 'react';
import { ActiveTimerState, StudyLog } from '@/types/ripple';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { generateUUID } from '@/utils/uuidUtils';
import { showSuccess } from '@/utils/toast';

export function useRippleTimer(onSprintComplete: (log: Omit<StudyLog, 'id' | 'loggedAt'>) => Promise<void>) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    return safeGetStorage<ActiveTimerState | null>('ripple_active_timer', null);
  });

  const activeTimerRef = useRef<ActiveTimerState | null>(activeTimer);
  useEffect(() => {
    activeTimerRef.current = activeTimer;
    safeSetStorage('ripple_active_timer', activeTimer);
  }, [activeTimer]);

  // Global background ticker interval
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const current = activeTimerRef.current;
      if (!current || !current.isRunning || !current.targetEndTime) return;

      const now = Date.now();
      const remainingMs = current.targetEndTime - now;
      const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));

      if (secondsLeft <= 0) {
        const loggedMins = current.initialDurationMinutes || Math.round(current.totalSeconds / 60);
        
        onSprintComplete({
          subject: current.subject || 'General Study',
          durationMinutes: Math.max(1, loggedMins),
          topic: `Completed Sprint: ${current.taskTitle}`,
          source: 'timer'
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🎉 Focus Sprint Completed!`, {
              body: `Great job! You finished your ${loggedMins}-minute focus block for "${current.taskTitle}".`,
              icon: '/placeholder.svg'
            });
          } catch {}
        }

        showSuccess(`🎯 Sprint Complete! Saved +${loggedMins}m to Supabase Study Log.`);
        setActiveTimer(null);
      } else {
        setActiveTimer((prev) => (prev ? { ...prev, secondsLeft } : null));
      }
    }, 500);

    return () => clearInterval(timerInterval);
  }, [onSprintComplete]);

  const startGlobalTimer = (params: {
    taskId?: string;
    taskTitle: string;
    subject: string;
    durationMinutes: number;
    isMinimized?: boolean;
  }) => {
    const totalSecs = params.durationMinutes * 60;
    const now = Date.now();
    const targetEnd = now + totalSecs * 1000;

    const timerObj: ActiveTimerState = {
      id: generateUUID(),
      taskId: params.taskId,
      taskTitle: params.taskTitle,
      subject: params.subject,
      totalSeconds: totalSecs,
      secondsLeft: totalSecs,
      isRunning: true,
      targetEndTime: targetEnd,
      startedAt: now,
      initialDurationMinutes: params.durationMinutes,
      isMinimized: params.isMinimized ?? false
    };

    setActiveTimer(timerObj);
  };

  const pauseGlobalTimer = () => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: false, targetEndTime: null } : null));
  };

  const resumeGlobalTimer = () => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const now = Date.now();
      return {
        ...prev,
        isRunning: true,
        targetEndTime: now + prev.secondsLeft * 1000
      };
    });
  };

  const resetGlobalTimer = (newDurationMinutes?: number) => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const mins = newDurationMinutes || prev.initialDurationMinutes;
      const secs = mins * 60;
      return {
        ...prev,
        totalSeconds: secs,
        secondsLeft: secs,
        initialDurationMinutes: mins,
        isRunning: false,
        targetEndTime: null
      };
    });
  };

  const setTimerMinimized = (minimized: boolean) => {
    setActiveTimer((prev) => (prev ? { ...prev, isMinimized: minimized } : null));
  };

  const stopAndLogTimer = async () => {
    const current = activeTimer;
    if (!current) return;

    const elapsedSeconds = current.totalSeconds - current.secondsLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    await onSprintComplete({
      subject: current.subject || 'General Study',
      durationMinutes: elapsedMinutes,
      topic: `Focus Session: ${current.taskTitle}`,
      source: 'timer'
    });

    setActiveTimer(null);
    showSuccess(`Saved +${elapsedMinutes}m study session to Supabase.`);
  };

  const cancelGlobalTimer = () => {
    setActiveTimer(null);
  };

  return {
    activeTimer,
    setActiveTimer,
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerMinimized,
    stopAndLogTimer,
    cancelGlobalTimer
  };
}