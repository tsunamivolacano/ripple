import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { 
  BookOpen, 
  Clock, 
  Plus, 
  TrendingUp, 
  Sparkles, 
  Trash2, 
  BarChart3, 
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const StudyTrackerView: React.FC = () => {
  const { studyLogs, slots, addStudyLog, deleteStudyLog } = useRipple();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<string | null>(null);

  // Form states
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [topic, setTopic] = useState<string>('');

  // Extract list of subjects from timetable slots or defaults
  const availableSubjects = Array.from(
    new Set([
      ...slots.map((s) => s.subject),
      'Mathematics',
      'Physics',
      'Chemistry',
      'English',
      'Biology',
      'Computer Science',
      'Psychology',
      'History',
      'General Self-Study'
    ])
  );

  const handleSubmitManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = selectedSubject === 'custom' ? customSubject.trim() : (selectedSubject || availableSubjects[0]);
    if (!finalSubject) return;

    const totalMinutes = Math.round(durationHours * 60 + durationMinutes);
    if (totalMinutes <= 0) return;

    addStudyLog({
      subject: finalSubject,
      durationMinutes: totalMinutes,
      topic: topic.trim() || undefined,
      source: 'manual'
    });

    // Reset Form
    setTopic('');
    setDurationHours(1);
    setDurationMinutes(0);
    setIsLogModalOpen(false);
  };

  const handleClearSubjectLogs = (subjectName: string) => {
    const logsToDelete = studyLogs.filter((l) => l.subject === subjectName);
    logsToDelete.forEach((l) => deleteStudyLog(l.id));
    setDeletingSubject(null);
  };

  // Calculations
  const totalStudyMinutes = studyLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

  // Group by Subject
  const subjectTotals = studyLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.subject] = (acc[log.subject] || 0) + log.durationMinutes;
    return acc;
  }, {});

  const sortedSubjectBreakdown = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div data-tour="study-section" className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 gap-1.5 py-1 px-3">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Independent Study Tracker
            </Badge>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Subject-Wise Study Log
          </h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Track actual time spent reading, practicing, and revising subjects. You can delete or manage any logged session at any time.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Study Time</span>
            <div className="text-2xl font-extrabold font-mono text-indigo-300 mt-0.5">
              {totalHours}h {remainingMins}m
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedSubject(availableSubjects[0]);
              setIsLogModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-indigo-950"
          >
            <Plus className="w-4 h-4" />
            Log Study Hours
          </Button>
        </div>
      </div>

      {/* Main Grid: Subject Breakdown & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Breakdown Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Subject Time Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {sortedSubjectBreakdown.length} Subject{sortedSubjectBreakdown.length !== 1 ? 's' : ''} Tracked
            </span>
          </div>

          {sortedSubjectBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedSubjectBreakdown.map(([subject, minutes]) => {
                const hrs = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const percentage = totalStudyMinutes > 0 ? Math.round((minutes / totalStudyMinutes) * 100) : 0;
                const logCount = studyLogs.filter((l) => l.subject === subject).length;

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
                          {logCount} log entry{logCount !== 1 ? 'ies' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-950/40 text-[10px]">
                          {percentage}%
                        </Badge>
                        <button
                          onClick={() => setDeletingSubject(subject)}
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

        {/* Recent Study Log Stream (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Log Stream
            </h3>
            <span className="text-[10px] text-slate-400">Click Trash to delete</span>
          </div>

          {studyLogs.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {studyLogs.map((log) => {
                const logHrs = Math.floor(log.durationMinutes / 60);
                const logMins = log.durationMinutes % 60;
                const formattedDuration = logHrs > 0 ? `${logHrs}h ${logMins}m` : `${logMins}m`;

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 relative group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between pr-6">
                      <span className="text-xs font-bold text-white">{log.subject}</span>
                      <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        +{formattedDuration}
                      </span>
                    </div>

                    {log.topic && (
                      <p className="text-xs text-slate-300 italic">
                        "{log.topic}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                      <span className="capitalize font-mono">
                        Source: {log.source === 'timer' ? '⏱️ Focus Sprint' : '✍️ Manual Entry'}
                      </span>
                      <span>
                        {new Date(log.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteStudyLog(log.id)}
                      className="absolute top-2.5 right-2 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-all"
                      title="Delete Study Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No recent study entries
            </p>
          )}
        </div>
      </div>

      {/* Manual Study Logging Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Log Independent Study Session
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitManualLog} className="space-y-4 my-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs text-white">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  {availableSubjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Add Custom Subject...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSubject === 'custom' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Custom Subject Name</label>
                <Input
                  placeholder="e.g. Psychology"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Hours Spent</label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Minutes Spent</label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Topic / Optional Notes</label>
              <Input
                placeholder="e.g. Chapter 4 Integration practice, or Organic reaction notes..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                Save Study Hours
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal to Clear Subject Logs */}
      <Dialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
        <DialogContent className="bg-slate-950 border-rose-500/40 text-white max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4" />
              Clear all {deletingSubject} study logs?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 my-2">
            This will remove all study session entries recorded for <strong>{deletingSubject}</strong>.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeletingSubject(null)} className="text-xs text-slate-400">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => deletingSubject && handleClearSubjectLogs(deletingSubject)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              Clear Logs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};