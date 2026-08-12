import React from "react";
import { BarChart3, BookOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubjectBreakdownCardsProps {
  subjectTotals: Record<string, number>;
  totalStudyMinutes: number;
  logCountBySubject: Record<string, number>;
  onDeleteSubject: (subject: string) => void;
}

export const SubjectBreakdownCards: React.FC<SubjectBreakdownCardsProps> = ({
  subjectTotals,
  totalStudyMinutes,
  logCountBySubject,
  onDeleteSubject
}) => {
  const sorted = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Subject Time Distribution
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {sorted.length} Subject{sorted.length !== 1 ? "s" : ""} Tracked
        </span>
      </div>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map(([subject, minutes]) => {
            const hrs = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const percentage = totalStudyMinutes > 0 ? Math.round((minutes / totalStudyMinutes) * 100) : 0;
            const count = logCountBySubject[subject] || 0;

            return (
              <div
                key={subject}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{subject}</h4>
                    <span className="text-xs font-mono text-indigo-300 font-bold">
                      {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {count} log entr{count !== 1 ? "ies" : "y"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-950/40 text-[10px]">
                      {percentage}%
                    </Badge>
                    <button
                      onClick={() => onDeleteSubject(subject)}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`Clear all ${subject} study logs`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Study Hours Logged Yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Log study sessions manually or complete a timer sprint to record subject hours.
          </p>
        </div>
      )}
    </div>
  );
};