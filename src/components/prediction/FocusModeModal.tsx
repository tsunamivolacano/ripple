import React, { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RotateCcw,
  BookOpen,
  Square,
  Timer,
  TimerReset
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FocusModeModalProps {
  task: Task | null;
  onClose: () => void;
}

const TIMER_PRESETS = [15, 25, 30, 45, 60];

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ task, onClose }) => {
  const { updateTaskProgress, completeTask, addStudyLog, slots } = useRipple();

  // Mode: 'countdown' (pomodoro preset) or 'stopwatch' (open-ended live study tracker)
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('countdown');

  // Countdown configuration states
  const [selectedPreset, setSelectedPreset] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [subject, setSubject] = useState<string>('General Study');

  // Timer running states
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [stopwatchElapsedSeconds, setStopwatchElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [localProgress, setLocalProgress] = useState<number>(0);

  // Absolute target timestamp reference for background accuracy
  const targetEndTimeRef = useRef<number | null>(null);
  const stopwatchStartTimeRef = useRef<number | null>(null);

  // Extract available subjects from slots
  const availableSubjects = Array.from(
    new Set([
      ...slots.map((s) => s.subject),
      'Mathematics',
      'Physics',
      'Chemistry',
      'English',
      'General Study'
    ])
  );

  useEffect(() => {
    if (task) {
      setLocalProgress(task.completionPercentage);
      const slot = slots.find((s) => s.id === task.slotId);
      if (slot) {
        setSubject(slot.subject);
      } else {
        setSubject('General Study');
      }
      setSelectedPreset(25);
      setTotalSeconds(25 * 60);
      setSecondsLeft(25 * 60);
      setStopwatchElapsedSeconds(0);
      setIsRunning(false);
      targetEndTimeRef.current = null;
      stopwatchStartTimeRef.current = null;
    }
  }, [task, slots]);

  // Duration change handler for countdown mode
  const handleSelectDuration = (mins: number) => {
    if (isRunning) return;
    setSelectedPreset(mins);
    setCustomMinutes(mins);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
  };

  const handleCustomMinutesChange = (val: number) => {
    if (isRunning) return;
    const mins = Math.max(1, Math.min(180, val));
    setSelectedPreset(mins);
    setCustomMinutes(mins);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
  };

  // Toggle Timer Run / Pause
  const toggleStartPause = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      targetEndTimeRef.current = null;
    } else {
      // Start
      const now = Date.now();
      if (timerMode === 'countdown') {
        targetEndTimeRef.current = now + secondsLeft * 1000;
      } else {
        stopwatchStartTimeRef.current = now - stopwatchElapsedSeconds * 1000;
      }
      setIsRunning(true);
    }
  };

  // Stop & Save Stopwatch Study Session
  const handleStopAndSaveStopwatch = () => {
    setIsRunning(false);
    const elapsedMins = Math.round(stopwatchElapsedSeconds / 60);
    if (elapsedMins > 0) {
      addStudyLog({
        subject: subject || 'General Study',
        durationMinutes: elapsedMins,
        topic: task ? `Live Study Session: ${task.title}` : undefined,
        source: 'timer'
      });
    }
    setStopwatchElapsedSeconds(0);
    stopwatchStartTimeRef.current = null;
  };

  // Reset Timer
  const handleReset = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    stopwatchStartTimeRef.current = null;
    if (timerMode === 'countdown') {
      setSecondsLeft(totalSeconds);
    } else {
      setStopwatchElapsedSeconds(0);
    }
  };

  // Timestamp-based ticking logic (Handles backgrounding & screen lock accurately)
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      const updateTimer = () => {
        const now = Date.now();
        if (timerMode === 'countdown' && targetEndTimeRef.current) {
          const diffMs = targetEndTimeRef.current - now;
          const remaining = Math.max(0, Math.ceil(diffMs / 1000));
          setSecondsLeft(remaining);

          if (remaining <= 0) {
            setIsRunning(false);
            targetEndTimeRef.current = null;
            clearInterval(interval);

            const elapsedMins = Math.round(totalSeconds / 60);
            if (elapsedMins > 0) {
              addStudyLog({
                subject: subject || 'General Study',
                durationMinutes: elapsedMins,
                topic: task ? `Focus Sprint: ${task.title}` : undefined,
                source: 'timer'
              });
            }
          }
        } else if (timerMode === 'stopwatch' && stopwatchStartTimeRef.current) {
          const diffMs = now - stopwatchStartTimeRef.current;
          const elapsed = Math.max(0, Math.floor(diffMs / 1000));
          setStopwatchElapsedSeconds(elapsed);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 500);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isRunning) {
          updateTimer();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isRunning, timerMode, totalSeconds, subject, task, addStudyLog]);

  if (!task) return null;

  // Format Display Time
  let minutes = 0;
  let seconds = 0;

  if (timerMode === 'countdown') {
    minutes = Math.floor(secondsLeft / 60);
    seconds = secondsLeft % 60;
  } else {
    minutes = Math.floor(stopwatchElapsedSeconds / 60);
    seconds = stopwatchElapsedSeconds % 60;
  }

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleProgressChange = (val: number[]) => {
    const newProgress = val[0];
    setLocalProgress(newProgress);
    updateTaskProgress(task.id, newProgress);
  };

  const handleMarkComplete = () => {
    // Log remaining timer progress if timer was run
    if (timerMode === 'countdown') {
      const elapsedMins = Math.round((totalSeconds - secondsLeft) / 60);
      if (elapsedMins > 0) {
        addStudyLog({
          subject: subject || 'General Study',
          durationMinutes: elapsedMins,
          topic: `Completed task: ${task.title}`,
          source: 'timer'
        });
      }
    } else {
      const elapsedMins = Math.round(stopwatchElapsedSeconds / 60);
      if (elapsedMins > 0) {
        addStudyLog({
          subject: subject || 'General Study',
          durationMinutes: elapsedMins,
          topic: `Completed task: ${task.title}`,
          source: 'timer'
        });
      }
    }

    completeTask(task.id);
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-emerald-500/40 text-white max-w-md rounded-2xl text-center p-6">
        <DialogHeader>
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-white">
            Focus Sprint: {task.title}
          </DialogTitle>
          <p className="text-xs text-slate-400">
            Timers run with exact target timestamps so progress continues accurately in the background.
          </p>
        </DialogHeader>

        {/* Timer Mode Toggle */}
        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-xl border border-slate-800 my-2 text-xs">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setTimerMode('countdown')}
            className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              timerMode === 'countdown'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            Countdown Pomodoro
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => setTimerMode('stopwatch')}
            className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              timerMode === 'stopwatch'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Live Open Stopwatch
          </button>
        </div>

        {/* Subject & Duration Preset Selection */}
        <div className="my-2 space-y-3 text-left p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Link Session to Subject (Auto-logs Study Hours)
            </label>
            <Select value={subject} onValueChange={setSubject} disabled={isRunning}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                {availableSubjects.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {timerMode === 'countdown' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Sprint Duration Presets</label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {TIMER_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    disabled={isRunning}
                    onClick={() => handleSelectDuration(mins)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedPreset === mins
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}

                <div className="flex items-center gap-1 pl-1">
                  <span className="text-slate-500 text-[10px]">Custom:</span>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    disabled={isRunning}
                    value={customMinutes}
                    onChange={(e) => handleCustomMinutesChange(Number(e.target.value))}
                    className="w-14 h-7 text-xs bg-slate-950 border-slate-800 text-white text-center font-mono p-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Big Digital Timer Display */}
        <div className="my-3 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
          <div className="font-mono text-5xl font-extrabold text-emerald-400 tracking-wider drop-shadow">
            {formattedTime}
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
            {isRunning
              ? `Live Study Flow (${subject})`
              : timerMode === 'stopwatch'
              ? 'Open Stopwatch Ready — Click Start'
              : 'Countdown Sprint Ready'}
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Button
              size="sm"
              onClick={toggleStartPause}
              className={`${
                isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white font-semibold text-xs gap-1.5 px-6 h-9`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isRunning ? 'Pause' : 'Start Study Timer'}
            </Button>

            {timerMode === 'stopwatch' && stopwatchElapsedSeconds > 0 && (
              <Button
                size="sm"
                onClick={handleStopAndSaveStopwatch}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 h-9"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                Stop & Save Study Log
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white h-9 w-9"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Live Progress Adjustment Slider */}
        <div className="space-y-3 text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Task Completion Progress:</span>
            <span className="font-mono text-emerald-400 font-extrabold">{localProgress}%</span>
          </div>

          <Slider
            value={[localProgress]}
            max={100}
            step={5}
            onValueChange={handleProgressChange}
            className="cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            Exit
          </Button>

          <Button
            onClick={handleMarkComplete}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Task 100% Complete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};