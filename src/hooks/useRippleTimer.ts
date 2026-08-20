import { useState, useEffect, useRef } from 'react';
import { ActiveTimerState, StudyLog, TimerMode } from '@/types/ripple';
import { safeGetStorage, safeSetStorage } from '@/utils/storageUtils';
import { generateUUID } from '@/utils/uuidUtils';
import { showSuccess, showError } from '@/utils/toast';

export function useRippleTimer(onSprintComplete: (log: Omit<StudyLog, 'id' | 'loggedAt'>) => Promise<void>) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    return safeGetStorage<ActiveTimerState | null>('ripple_active_timer', null);
  });

  const activeTimerRef = useRef<ActiveTimerState | null>(activeTimer);
  useEffect(() => {
    activeTimerRef.current = activeTimer;
    safeSetStorage('ripple_active_timer', activeTimer);
  }, [activeTimer]);

  // Global background ticker interval using precise timestamps
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const current = activeTimerRef.current;
      if (!current || !current.isRunning) return;

      const now = Date.now();

      if (current.mode === 'stopwatch') {
        const currentRunSeconds = Math.max(0, Math.floor((now - current.startedAt) / 1000));
        const totalElapsed = (current.accumulatedSecondsBeforeRun || 0) + currentRunSeconds;

        setActiveTimer((prev) => (prev && prev.id === current.id ? {
          ...prev,
          elapsedSeconds: totalElapsed
        } : prev));
      } else {
        // Countdown mode
        if (!current.targetEndTime) return;
        const remainingMs = current.targetEndTime - now;
        const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        const elapsed = Math.max(0, current.totalSeconds - secondsLeft);

        if (secondsLeft <= 0) {
          const loggedMins = current.initialDurationMinutes || Math.max(1, Math.round(current.totalSeconds / 60));
          const startFormatted = new Date(current.startTimeISO || current.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const topicSummary = current.topic
            ? `${current.topic} (${startFormatted} - ${endFormatted})`
            : `${current.taskTitle} (${startFormatted} - ${endFormatted})`;

          onSprintComplete({
            subject: current.subject || 'General Study',
            durationMinutes: Math.max(1, loggedMins),
            topic: topicSummary,
            source: 'timer'
          });

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`🎉 Study Timer Finished!`, {
                body: `Awesome job! Logged ${loggedMins} mins for ${current.subject} (${startFormatted} - ${endFormatted}).`,
                icon: '/placeholder.svg'
              });
            } catch {}
          }

          showSuccess(`🎯 Study Block Finished! Saved +${loggedMins}m to Supabase.`);
          setActiveTimer(null);
        } else {
          setActiveTimer((prev) => (prev && prev.id === current.id ? {
            ...prev,
            secondsLeft,
            elapsedSeconds: elapsed
          } : prev));
        }
      }
    }, 500);

    return () => clearInterval(timerInterval);
  }, [onSprintComplete]);

  const startGlobalTimer = (params: {
    taskId?: string;
    taskTitle?: string;
    subject?: string;
    topic?: string;
    mode?: TimerMode;
    durationMinutes?: number;
    isMinimized?: boolean;
  }) => {
    // Prevent multiple timers running simultaneously
    if (activeTimerRef.current && activeTimerRef.current.isRunning) {
      showError('A study timer is already running. Please pause or stop the current session first.');
      return;
    }

    const timerMode: TimerMode = params.mode || (params.durationMinutes ? 'countdown' : 'stopwatch');
    const mins = params.durationMinutes || 25;
    const totalSecs = mins * 60;
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const targetEnd = timerMode === 'countdown' ? now + totalSecs * 1000 : null;

    const timerObj: ActiveTimerState = {
      id: generateUUID(),
      taskId: params.taskId,
      taskTitle: params.taskTitle || (timerMode === 'stopwatch' ? 'Live Study Session' : 'Focus Sprint'),
      subject: params.subject || 'General Self-Study',
      topic: params.topic || '',
      mode: timerMode,
      totalSeconds: totalSecs,
      secondsLeft: totalSecs,
      elapsedSeconds: 0,
      isRunning: true,
      targetEndTime: targetEnd,
      startedAt: now,
      startTimeISO: nowISO,
      accumulatedSecondsBeforeRun: 0,
      initialDurationMinutes: mins,
      isMinimized: params.isMinimized ?? false
    };

    setActiveTimer(timerObj);
    showSuccess(`⏱️ ${timerMode === 'stopwatch' ? 'Live Stopwatch' : `${mins}-min Timer`} started!`);
  };

  const pauseGlobalTimer = () => {
    const current = activeTimerRef.current;
    if (!current || !current.isRunning) return;

    const now = Date.now();
    let updatedAccumulated = current.accumulatedSecondsBeforeRun;

    if (current.mode === 'stopwatch') {
      const added = Math.max(0, Math.floor((now - current.startedAt) / 1000));
      updatedAccumulated += added;
    }

    setActiveTimer((prev) => prev ? {
      ...prev,
      isRunning: false,
      targetEndTime: null,
      accumulatedSecondsBeforeRun: updatedAccumulated,
      elapsedSeconds: current.mode === 'stopwatch' ? updatedAccumulated : prev.elapsedSeconds
    } : null);
  };

  const resumeGlobalTimer = () => {
    const current = activeTimerRef.current;
    if (!current || current.isRunning) return;

    const now = Date.now();
    const targetEnd = current.mode === 'countdown' ? now + current.secondsLeft * 1000 : null;

    setActiveTimer((prev) => prev ? {
      ...prev,
      isRunning: true,
      startedAt: now,
      targetEndTime: targetEnd
    } : null);
  };

  const resetGlobalTimer = (newDurationMinutes?: number) => {
    const current = activeTimerRef.current;
    if (!current) return;

    const mins = newDurationMinutes || current.initialDurationMinutes || 25;
    const secs = mins * 60;

    setActiveTimer((prev) => prev ? {
      ...prev,
      totalSeconds: secs,
      secondsLeft: secs,
      elapsedSeconds: 0,
      accumulatedSecondsBeforeRun: 0,
      initialDurationMinutes: mins,
      isRunning: false,
      targetEndTime: null
    } : null);
  };

  const setTimerMinimized = (minimized: boolean) => {
    setActiveTimer((prev) => (prev ? { ...prev, isMinimized: minimized } : null));
  };

  const stopAndLogTimer = async () => {
    const current = activeTimerRef.current;
    if (!current) return;

    const now = Date.now();
    let totalElapsedSeconds = current.accumulatedSecondsBeforeRun;

    if (current.isRunning) {
      if (current.mode === 'stopwatch') {
        totalElapsedSeconds += Math.max(0, Math.floor((now - current.startedAt) / 1000));
      } else {
        const remainingMs = (current.targetEndTime || now) - now;
        const currentSecondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        totalElapsedSeconds = Math.max(1, current.totalSeconds - currentSecondsLeft);
      }
    } else {
      totalElapsedSeconds = current.mode === 'stopwatch' ? current.accumulatedSecondsBeforeRun : current.elapsedSeconds;
    }

    const elapsedMinutes = Math.max(1, Math.round(totalElapsedSeconds / 60));
    const startFormatted = new Date(current.startTimeISO || current.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const topicSummary = current.topic
      ? `${current.topic} (${startFormatted} - ${endFormatted})`
      : `${current.taskTitle} (${startFormatted} - ${endFormatted})`;

    await onSprintComplete({
      subject: current.subject || 'General Self-Study',
      durationMinutes: elapsedMinutes,
      topic: topicSummary,
      source: 'timer'
    });

    setActiveTimer(null);
    showSuccess(`Saved +${elapsedMinutes}m (${startFormatted} - ${endFormatted}) to Supabase Study Log!`);
  };

  const cancelGlobalTimer = () => {
    setActiveTimer(null);
    showSuccess('Timer cancelled without saving.');
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