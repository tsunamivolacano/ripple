import React from 'react';
import { Activity, Clock } from 'lucide-react';

export const AdminActivity: React.FC = () => {
  const sampleActivities = [
    { user: 'Riya Verma', action: 'Completed 25-min Physics Focus Sprint', time: '10 mins ago' },
    { user: 'Aman Verma', action: 'Renegotiate deadline for Q3 Deck (+24h)', time: '35 mins ago' },
    { user: 'Kabir Mehta', action: 'Logged 45-min Science Study Session', time: '1 hour ago' },
    { user: 'Shanniddhya', action: 'Admin Portal sign-in', time: '2 hours ago' }
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Activity className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-extrabold text-white">Live System Activity Stream</h2>
      </div>

      <div className="space-y-3 text-xs">
        {sampleActivities.map((act, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white mr-2">{act.user}</span>
              <span className="text-slate-300">{act.action}</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};