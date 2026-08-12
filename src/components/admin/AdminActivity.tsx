import React from "react";
import { AdminSystemActivity } from "@/types/admin";
import { Activity, Clock } from "lucide-react";

interface AdminActivityProps {
  events: AdminSystemActivity[];
}

export const AdminActivity: React.FC<AdminActivityProps> = ({ events }) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Activity className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-extrabold text-white">Live System Activity Stream</h2>
      </div>

      {events.length > 0 ? (
        <div className="space-y-3 text-xs">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div>
                <span className="font-bold text-white mr-2">
                  {evt.userName || "RIPPLE User"}
                </span>
                <span className="text-slate-300">{evt.description}</span>
              </div>
              <span className="font-mono text-slate-500 text-[10px] shrink-0">
                {new Date(evt.timestamp).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          No recent activity recorded yet.
        </div>
      )}
    </div>
  );
};