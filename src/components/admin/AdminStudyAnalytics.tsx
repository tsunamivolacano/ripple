import React from 'react';
import { SubjectStudyBreakdown } from '@/types/admin';
import { BookOpen, BarChart3, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface AdminStudyAnalyticsProps {
  subjectBreakdown: SubjectStudyBreakdown[];
}

export const AdminStudyAnalytics: React.FC<AdminStudyAnalyticsProps> = ({ subjectBreakdown }) => {
  const totalMins = subjectBreakdown.reduce((acc, s) => acc + s.studyMinutes, 0);
  const totalHours = (totalMins / 60).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-extrabold text-white">App-Wide Study Analytics</h2>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
            Total {totalHours} Hours Logged
          </Badge>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectBreakdown}>
              <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Bar dataKey="studyMinutes" fill="#818cf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};