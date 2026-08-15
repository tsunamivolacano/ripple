import React from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  Play, 
  Pause, 
  Maximize2, 
  CheckCircle2, 
  X, 
  BookOpen, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const FloatingTimerWidget: React.FC = () => {
  const { 
    activeTimer, 
    pauseGlobalTimer, 
    resumeGlobalTimer, 
    setTimerMinimized, 
    stopAndLogTimer, 
    cancelGlobalTimer,
    setActiveFocusTask,
    tasks
  } = useRipple();

  if (!activeTimer || !activeTimer.isMinimized) {
    return null;
  }

  const mins = Math.floor(activeTimer.secondsLeft / 60);
  const secs = activeTimer.secondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const elapsed = activeTimer.totalSeconds - activeTimer.secondsLeft;
  const percent = Math.min(100, Math.round((elapsed / Math.max(1, activeTimer.totalSeconds)) * 100));

  const handleMaximize = () => {
    setTimerMinimized(false);
    if (activeTimer.taskId) {
      const matchedTask = tasks.find(t => t.id === activeTimer.taskId);
      if (matchedTask) {
        setActiveFocusTask(matchedTask);
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-lg pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 shadow-2xl shadow-emerald-950/60 text-white flex flex-col gap-2.5 ring-1 ring-emerald-500/30">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className={`w-4 h-4 ${activeTimer.isRunning ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white truncate">
                  {activeTimer.taskTitle}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/40 text-emerald-300 bg-emerald-950/50">
                  {activeTimer.subject}
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {activeTimer.isRunning ? 'Running in Background...' : 'Timer Paused'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Digital Clock */}
            <span className="font-mono text-lg font-extrabold text-emerald-400 tracking-wider">
              {formattedTime}
            </span>

            {/* Play/Pause Button */}
            <Button
              size="icon"
              variant="outline"
              onClick={activeTimer.isRunning ? pauseGlobalTimer : resumeGlobalTimer}
              className={`h-8 w-8 rounded-xl border ${
                activeTimer.isRunning 
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
              }`}
              title={activeTimer.isRunning ? 'Pause' : 'Resume'}
            >
              {activeTimer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            </Button>

            {/* Maximize to Modal */}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleMaximize}
              className="h-8 w-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
              title="Expand Timer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>

            {/* Finish & Log */}
            <Button
              size="sm"
              onClick={stopAndLogTimer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-8 px-2.5 gap-1 rounded-xl shadow-md"
              title="Save Elapsed Time & Finish"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finish</span>
            </Button>

            {/* Cancel */}
            <button
              onClick={cancelGlobalTimer}
              className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
              title="Discard Timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Mini Progress Bar */}
        <div className="space-y-1">
          <Progress value={percent} className="h-1.5 bg-slate-950 [&>div]:bg-emerald-500" />
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>{percent}% Completed</span>
            <span>Total {activeTimer.initialDurationMinutes}m Block</span>
          </div>
        </div>

      </div>
    </div>
  );
};