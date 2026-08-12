import React from "react";
import { StudyLog } from "@/types/ripple";
import { Clock, Trash2 } from "lucide-react";

interface RecentStudyLogsProps {
  logs: StudyLog[];
  onDelete: (id: string) => void;
}

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

export const RecentStudyLogs: React.FC<RecentStudyLogsProps> = ({ logs, onDelete }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Recent Log Stream
        </h3>
        <span className="text-[10px] text-slate-400">Click Trash to delete</span>
      </div>

      {logs.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 relative group hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between pr-6">
                <span className="text-xs font-bold text-white">{log.subject}</span>
                <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  +{formatDuration(log.durationMinutes)}
                </span>
              </div>

              {log.topic && (
                <p className="text-xs text-slate-300 italic">"{log.topic}"</p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                <span className="capitalize font-mono">
                  Source: {log.source === "timer" ? "⏱️ Focus Sprint" : "✍️ Manual Entry"}
                </span>
                <span>
                  {new Date(log.loggedAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                  {new Date(log.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <button
                onClick={() => onDelete(log.id)}
                className="absolute top-2.5 right-2 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-all"
                title="Delete Study Entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-8">No recent study entries</p>
      )}
    </div>
  );
};