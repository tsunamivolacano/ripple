import React, { useState, useEffect } from 'react';
import { Task } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Sparkles, 
  RotateCcw 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface FocusModeModalProps {
  task: Task | null;
  onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ task, onClose }) => {
  const { updateTaskProgress, completeTask } = useRipple();
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 min pomodoro
  const [isRunning, setIsRunning] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    if (task) {
      setLocalProgress(task.completionPercentage);
      setSecondsLeft(25 * 60);
      setIsRunning(false);
    }
  }, [task]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!task) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleProgressChange = (val: number[]) => {
    const newProgress = val[0];
    setLocalProgress(newProgress);
    updateTaskProgress(task.id, newProgress);
  };

  const handleMarkComplete = () => {
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
            Focus Mode: {task.title}
          </DialogTitle>
          <p className="text-xs text-slate-400">
            Defeat the Doomsday Clock one 25-minute focus block at a time.
          </p>
        </DialogHeader>

        {/* Big Digital Timer Display */}
        <div className="my-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
          <div className="font-mono text-5xl font-extrabold text-emerald-400 tracking-wider drop-shadow">
            {formattedTime}
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
            {isRunning ? 'Focus Sprint In Progress' : 'Sprint Paused'}
          </p>

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
              className={`${
                isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white font-semibold text-xs gap-1.5 px-6`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isRunning ? 'Pause Sprint' : 'Start 25m Timer'}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSecondsLeft(25 * 60);
                setIsRunning(false);
              }}
              className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Live Progress Adjustment Slider */}
        <div className="space-y-3 text-left p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300">Live Task Progress:</span>
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
            <span>0% (Just Started)</span>
            <span>50% (Halfway)</span>
            <span>100% (Finished)</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            Exit Focus View
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