import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { LogOutcomeModal } from './LogOutcomeModal';
import { 
  FileText, 
  Plus, 
  Star, 
  CheckCircle2, 
  Award 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const EvidenceLogView: React.FC = () => {
  const { evidenceEntries } = useRipple();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute stats
  const totalLogged = evidenceEntries.length;
  const onTimeCount = evidenceEntries.filter((e) => e.wasOnTime).length;
  const onTimePercentage = totalLogged > 0 ? Math.round((onTimeCount / totalLogged) * 100) : 100;

  const avgAccuracy = totalLogged > 0
    ? (evidenceEntries.reduce((acc, curr) => acc + curr.accuracyRating, 0) / totalLogged).toFixed(1)
    : '5.0';

  return (
    <div data-tour="evidence-section" className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Case Files</span>
            <h3 className="text-2xl font-extrabold text-white font-mono mt-0.5">{totalLogged}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">On-Time Accuracy Rate</span>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">{onTimePercentage}%</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">AI Prediction Rating</span>
            <h3 className="text-2xl font-extrabold text-amber-300 font-mono mt-0.5">{avgAccuracy} / 5.0</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Personal Calibration & Evidence Case Log
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare predicted AI consequences against real outcomes to continuously refine your urgency calibration.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Log Post-Deadline Outcome
        </Button>
      </div>

      {/* Case File Grid / List */}
      {evidenceEntries.length > 0 ? (
        <div className="space-y-4">
          {evidenceEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={entry.wasOnTime ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}>
                      {entry.wasOnTime ? 'On-Time Beat' : 'Consequence Triggered'}
                    </Badge>
                    <span className="text-xs font-bold text-slate-300">
                      {entry.subject}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      Teacher: {entry.teacherName}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {entry.taskTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-xs font-medium text-slate-400">Prediction Accuracy:</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= entry.accuracyRating ? 'fill-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="font-semibold text-amber-400 block text-[11px] uppercase tracking-wider">
                    AI Forecast Scenario:
                  </span>
                  <p className="text-slate-300">
                    {entry.predictedScenario}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="font-semibold text-emerald-400 block text-[11px] uppercase tracking-wider">
                    Actual Real-World Outcome:
                  </span>
                  <p className="text-slate-300">
                    {entry.actualOutcome}
                  </p>
                </div>
              </div>

              {entry.userNotes && (
                <p className="text-xs text-slate-400 italic pt-1">
                  Note: "{entry.userNotes}"
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Case File Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Log your outcomes after deadlines pass to help RIPPLE calibrate its dynamic prediction engine.
          </p>
        </div>
      )}

      <LogOutcomeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};