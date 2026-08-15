import React, { useState, useEffect } from 'react';
import { Task } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { showError } from '@/utils/toast';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  BookOpen,
  Minimize2,
  AlertCircle
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
  const { 
    updateTaskProgress, 
    completeTask, 
    slots,
    activeTimer,
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerMinimized,
    stopAndLogTimer
  } = useRipple();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(25);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('25');
  const [subject, setSubject] = useState<string>('General Study');
  const [localProgress, setLocalProgress] = useState<number>(0);

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

      // If active timer exists for this task, sync the input
      if (activeTimer && activeTimer.taskId === task.id) {
        const initialMins = activeTimer.initialDurationMinutes || Math.round(activeTimer.totalSeconds / 60);
        setCustomMinutesInput(String(initialMins));
        setSelectedPreset(TIMER_PRESETS.includes(initialMins) ? initialMins : null);
      } else if (!activeTimer) {
        setSelectedPreset(25);
        setCustomMinutesInput('25');
      }
    }
  }, [task, slots, activeTimer]);

  if (!task) return null;

  // Derive current timer display values
  const isTimerForThisTask = Boolean(activeTimer && activeTimer.taskId === task.id);
  const isRunning = isTimerForThisTask ? (activeTimer?.isRunning ?? false) : false;
  
  // Parsed numeric duration for starting or resting
  const parsedDuration = parseInt(customMinutesInput, 10);
  const isValidDuration = !isNaN(parsedDuration) && parsedDuration > 0;

  const secondsLeft = isTimerForThisTask 
    ? (activeTimer?.secondsLeft ?? 0) 
    : (isValidDuration ? parsedDuration * 60 : 0);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSelectPreset = (mins: number) => {
    if (isRunning) return;
    setSelectedPreset(mins);
    setCustomMinutesInput(String(mins));
    if (isTimerForThisTask) {
      resetGlobalTimer(mins);
    }
  };

  // Allow any string/digit entry including 0, empty string, multi-digit numbers (e.g. 120, 360) without lockup
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRunning) return;
    const rawVal = e.target.value;

    // Filter to only digits
    const cleaned = rawVal.replace(/[^0-9]/g, '');
    
    // Allow empty string so user can backspace freely
    setCustomMinutesInput(cleaned);

    const numeric = parseInt(cleaned, 10);
    if (!isNaN(numeric)) {
      if (TIMER_PRESETS.includes(numeric)) {
        setSelectedPreset(numeric);
      } else {
        setSelectedPreset(null);
      }

      if (isTimerForThisTask && numeric > 0) {
        resetGlobalTimer(numeric);
      }
    } else {
      setSelectedPreset(null);
    }
  };

  const toggleStartPause = () => {
    if (!isTimerForThisTask) {
      if (!isValidDuration) {
        showError('Please enter a sprint duration greater than 0 minutes.');
        return;
      }

      // Start fresh global background timer
      startGlobalTimer({
        taskId: task.id,
        taskTitle: task.title,
        subject: subject || 'General Study',
        durationMinutes: parsedDuration,
        isMinimized: false
      });
    } else {
      if (activeTimer?.isRunning) {
        pauseGlobalTimer();
      } else {
        resumeGlobalTimer();
      }
    }
  };

  const handleReset = () => {
    const targetMins = isValidDuration ? parsedDuration : 25;
    if (isTimerForThisTask) {
      resetGlobalTimer(targetMins);
    } else {
      setCustomMinutesInput(String(targetMins));
    }
  };

  const handleMinimize = () => {
    if (!isTimerForThisTask) {
      if (!isValidDuration) {
        showError('Please enter a sprint duration greater than 0 minutes before minimizing.');
        return;
      }
      startGlobalTimer({
        taskId: task.id,
        taskTitle: task.title,
        subject: subject || 'General Study',
        durationMinutes: parsedDuration,
        isMinimized: true
      });
    } else {
      setTimerMinimized(true);
    }
    onClose();
  };

  const handleProgressChange = (val: number[]) => {
    const newProgress = val[0];
    setLocalProgress(newProgress);
    updateTaskProgress(task.id, newProgress);
  };

  const handleMarkComplete = () => {
    if (isTimerForThisTask) {
      stopAndLogTimer();
    }
    completeTask(task.id);
    onClose();
  };

  const handleCloseDialog = () => {
    if (isRunning) {
      setTimerMinimized(true);
    }
    onClose();
  };

  return (
    <Dialog open={!!task && (!activeTimer || !activeTimer.isMinimized)} onOpenChange={handleCloseDialog}>
      <DialogContent className="bg-slate-950 border-emerald-500/40 text-white max-w-md rounded-2xl text-center p-6 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white leading-tight">
                Focus Sprint Mode
              </DialogTitle>
              <span className="text-[11px] text-emerald-400 font-mono">
                {task.title}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleMinimize}
            className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-emerald-300 gap-1.5 h-8 px-2.5 rounded-xl shrink-0"
            title="Minimize to floating widget and keep running in background"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minimize</span>
          </Button>
        </DialogHeader>

        {/* Subject & Duration Preset Selection */}
        <div className="my-3 space-y-3 text-left p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Subject Link (Auto-logs Study Tracker)
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

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">Sprint Duration (Minutes)</label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {TIMER_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={isRunning}
                  onClick={() => handleSelectPreset(mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedPreset === mins
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}

              <div className="flex items-center gap-1 pl-1 shrink-0">
                <span className="text-slate-500 text-[10px]">Custom:</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Mins"
                  disabled={isRunning}
                  value={customMinutesInput}
                  onChange={handleCustomInputChange}
                  className="w-16 h-7 text-xs bg-slate-950 border-slate-800 text-white text-center font-mono p-1 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Validation warning if duration is 0 or empty */}
            {!isValidDuration && customMinutesInput !== '' && (
              <div className="flex items-center gap-1 text-[10px] text-amber-400 pt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Sprint duration must be at least 1 minute to start.</span>
              </div>
            )}
          </div>
        </div>

        {/* Digital Clock Display with subtle glow */}
        <div className="my-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner relative overflow-hidden">
          <div className="font-mono text-5xl font-extrabold text-emerald-400 tracking-wider drop-shadow-md">
            {formattedTime}
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 font-mono">
            {isRunning ? `Focusing on ${subject}` : isValidDuration ? `Sprint Ready (${parsedDuration}m)` : 'Enter Duration'}
          </p>

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              size="sm"
              disabled={!isRunning && !isValidDuration}
              onClick={toggleStartPause}
              className={`${
                isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white font-semibold text-xs gap-1.5 px-6 h-9 rounded-xl shadow-lg shadow-emerald-950/60 transition-all`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isRunning ? 'Pause Sprint' : `Start ${isValidDuration ? `${parsedDuration}m` : ''} Timer`}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white h-9 w-9 rounded-xl"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Slider */}
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

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <Button variant="ghost" onClick={handleMinimize} className="text-slate-400 hover:text-white text-xs">
            Minimize to Background
          </Button>

          <Button
            onClick={handleMarkComplete}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark 100% Complete & Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};