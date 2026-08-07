import React from 'react';
import { Task, TimetableSlot } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { getStatusTheme, getTimeRemaining } from '@/utils/timeUtils';
import { DoomsdayGauge } from './DoomsdayGauge';
import { 
  Zap, 
  Play, 
  UserCheck, 
  GraduationCap, 
  CheckCircle2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  slot?: TimetableSlot;
  onOpenPrediction: (task: Task) => void;
  onOpenFocus: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  slot,
  onOpenPrediction,
  onOpenFocus
}) => {
  const { completeTask } = useRipple();
  const theme = getStatusTheme(task.status);
  const timeInfo = getTimeRemaining(task.dueDate);

  // Buffer percentage calculation (0 to 100)
  const remainingWorkMinutes = task.estimatedHours * (1 - task.completionPercentage / 100) * 60;
  const timeBufferRatio = Math.max(0, timeInfo.totalMinutes / Math.max(remainingWorkMinutes, 15));
  const bufferPercentage = Math.min(100, Math.round((timeBufferRatio / 3.0) * 100));

  return (
    <div data-tour="task-card" className={`relative rounded-2xl border p-5 transition-all duration-300 bg-gradient-to-b ${theme.gradient} border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between group`}>
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={theme.badge}>
                {theme.label}
              </Badge>

              {slot && (
                <Badge variant="outline" className="bg-slate-900/80 text-slate-300 border-slate-700 text-[11px] gap-1">
                  <GraduationCap className="w-3 h-3 text-indigo-400" />
                  {slot.subject}
                </Badge>
              )}
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-rose-200 transition-colors line-clamp-2">
              {task.title}
            </h3>
          </div>

          {/* Mini Gauge Display */}
          <div data-tour="gauge-element" className="shrink-0 cursor-pointer" onClick={() => onOpenPrediction(task)}>
            <DoomsdayGauge
              status={task.status}
              percentageRemaining={bufferPercentage}
              size={68}
              showInnerRings={false}
              centerText={timeInfo.hours > 0 ? `${timeInfo.hours}h` : `${timeInfo.minutes}m`}
              centerSubtext={timeInfo.isOverdue ? 'OVERDUE' : 'LEFT'}
            />
          </div>
        </div>

        {/* Task description */}
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Human Context & Teacher Strictness Info */}
        {slot && (
          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                {slot.teacherName}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                Weight: {slot.weight}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-md">
                {slot.strictnessTag.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                {slot.stakesTag.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[11px] font-medium text-slate-400">
            <span>Completion</span>
            <span className="font-mono text-slate-200">{task.completionPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                task.completionPercentage >= 100
                  ? 'bg-emerald-500'
                  : task.status === 'critical'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${task.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <Button
          data-tour="predict-btn"
          variant="outline"
          size="sm"
          onClick={() => onOpenPrediction(task)}
          className="flex-1 bg-slate-900 border-slate-700 hover:bg-slate-800 text-xs text-slate-200 gap-1.5 py-1.5 h-auto"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Predict Consequence
        </Button>

        <Button
          data-tour="start-btn"
          size="sm"
          onClick={() => onOpenFocus(task)}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5 py-1.5 h-auto"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Start Now
        </Button>

        {task.completionPercentage < 100 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => completeTask(task.id)}
            title="Mark Completed"
            className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 w-8 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};