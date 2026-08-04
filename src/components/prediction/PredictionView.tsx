import React from 'react';
import { Task, TimetableSlot } from '@/types/ripple';
import { useRipple } from '@/context/RippleContext';
import { generateConsequenceForecast } from '@/utils/predictionEngine';
import { DoomsdayGauge } from '../doomsday/DoomsdayGauge';
import { SplitTimeline } from './SplitTimeline';
import { getStatusTheme, getTimeRemaining } from '@/utils/timeUtils';
import { 
  X, 
  Flame, 
  GraduationCap, 
  UserCheck, 
  Zap, 
  AlertTriangle, 
  HeartHandshake, 
  Sparkles,
  ShieldAlert,
  Moon,
  DollarSign
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PredictionViewProps {
  task: Task | null;
  onClose: () => void;
  onOpenFocus: (task: Task) => void;
  onOpenRenegotiate: (task: Task) => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  task,
  onClose,
  onOpenFocus,
  onOpenRenegotiate
}) => {
  const { slots, settings } = useRipple();

  if (!task) return null;

  const slot = slots.find((s) => s.id === task.slotId);
  const forecast = generateConsequenceForecast(task, slot, settings.intensityMode, settings.personalVelocityMultiplier);
  const theme = getStatusTheme(task.status);
  const timeInfo = getTimeRemaining(task.dueDate);

  // Buffer ratio calculation
  const remainingWorkMinutes = task.estimatedHours * (1 - task.completionPercentage / 100) * 60;
  const timeBufferRatio = Math.max(0, timeInfo.totalMinutes / Math.max(remainingWorkMinutes, 15));
  const bufferPercentage = Math.min(100, Math.round((timeBufferRatio / 3.0) * 100));

  const domainList = [
    { data: forecast.academic, icon: GraduationCap, color: 'text-rose-400 border-rose-500/30 bg-rose-950/30' },
    { data: forecast.social, icon: UserCheck, color: 'text-amber-400 border-amber-500/30 bg-amber-950/30' },
    { data: forecast.physical, icon: Moon, color: 'text-purple-400 border-purple-500/30 bg-purple-950/30' },
    { data: forecast.emotional, icon: HeartHandshake, color: 'text-blue-400 border-blue-500/30 bg-blue-950/30' }
  ];

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar p-6">
        <DialogHeader className="flex flex-row items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={theme.badge}>{theme.label}</Badge>
              {slot && (
                <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-900 text-[11px]">
                  {slot.subject} ({slot.teacherName})
                </Badge>
              )}
            </div>
            <DialogTitle className="text-xl font-extrabold text-white">
              {task.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Top Radial Dial & Human Context Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-inner">
            <div className="shrink-0 flex flex-col items-center">
              <DoomsdayGauge
                status={task.status}
                percentageRemaining={bufferPercentage}
                size={140}
                academicRisk={forecast.academic.impactScore}
                socialRisk={forecast.social.impactScore}
                physicalRisk={forecast.physical.impactScore}
                centerText={timeInfo.hours > 0 ? `${timeInfo.hours}h ${timeInfo.minutes}m` : `${timeInfo.minutes}m`}
                centerSubtext={timeInfo.isOverdue ? 'OVERDUE' : 'TIME LEFT'}
              />
              <span className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-wider">
                Multi-Ring Doomsday Dial
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Live AI Cinematic Scenario Forecast
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-amber-500/50 pl-3">
                "{forecast.cinematicScene}"
              </p>

              {slot && (
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500">Strictness:</span>{' '}
                    <span className="text-rose-300">{slot.strictnessTag.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Stakes:</span>{' '}
                    <span className="text-indigo-300">{slot.stakesTag.replace('_', ' ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Domain Consequence Cards */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Branching Domain Impact Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {domainList.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className={`p-3.5 rounded-xl border ${item.color} space-y-1.5`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        {item.data.domain}
                      </span>
                      <span className="font-mono text-xs font-extrabold">
                        {item.data.impactScore}% Impact
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-slate-200">
                      {item.data.title}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {item.data.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Split Timeline Simulator */}
          <SplitTimeline
            startNow={forecast.startNowTimeline}
            delay2Hr={forecast.delay2HrTimeline}
            onStartNow={() => {
              onClose();
              onOpenFocus(task);
            }}
            onRenegotiate={() => {
              onClose();
              onOpenRenegotiate(task);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};