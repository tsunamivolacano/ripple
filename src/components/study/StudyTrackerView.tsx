import React, { useMemo, useState } from "react";
import { useRipple } from "@/context/RippleContext";
import { StudyOverviewBanner } from "./StudyOverviewBanner";
import { LiveStopwatchPanel } from "./LiveStopwatchPanel";
import { SubjectBreakdownCards } from "./SubjectBreakdownCards";
import { RecentStudyLogs } from "./RecentStudyLogs";
import { ManualLogModal } from "./ManualLogModal";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DEFAULT_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Biology",
  "Computer Science",
  "Psychology",
  "History",
  "General Study"
];

export const StudyTrackerView: React.FC = () => {
  const { studyLogs, slots, addStudyLog, deleteStudyLog } = useRipple();

  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<string | null>(null);

  const availableSubjects = useMemo(
    () => Array.from(new Set([...slots.map((s) => s.subject), ...DEFAULT_SUBJECTS])),
    [slots]
  );

  const totalStudyMinutes = useMemo(
    () => studyLogs.reduce((acc, log) => acc + log.durationMinutes, 0),
    [studyLogs]
  );

  const subjectTotals = useMemo(() => {
    return studyLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.subject] = (acc[log.subject] || 0) + log.durationMinutes;
      return acc;
    }, {});
  }, [studyLogs]);

  const logCountBySubject = useMemo(() => {
    return studyLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.subject] = (acc[log.subject] || 0) + 1;
      return acc;
    }, {});
  }, [studyLogs]);

  const handleLiveSave = (minutes: number, subject: string, topic?: string) => {
    addStudyLog({ subject, durationMinutes: minutes, topic, source: "timer" });
  };

  const handleManualSave = (log: { subject: string; durationMinutes: number; topic?: string }) => {
    addStudyLog({ ...log, source: "manual" });
  };

  const handleClearSubject = (subject: string) => {
    studyLogs.filter((l) => l.subject === subject).forEach((l) => deleteStudyLog(l.id));
    setDeletingSubject(null);
  };

  return (
    <div data-tour="study-section" className="space-y-6">
      <StudyOverviewBanner
        totalHours={Math.floor(totalStudyMinutes / 60)}
        remainingMinutes={totalStudyMinutes % 60}
        subjectCount={Object.keys(subjectTotals).length}
        onOpenManualLog={() => setIsManualLogOpen(true)}
      />

      <LiveStopwatchPanel subjects={availableSubjects} onSave={handleLiveSave} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SubjectBreakdownCards
          subjectTotals={subjectTotals}
          totalStudyMinutes={totalStudyMinutes}
          logCountBySubject={logCountBySubject}
          onDeleteSubject={setDeletingSubject}
        />

        <RecentStudyLogs logs={studyLogs} onDelete={deleteStudyLog} />
      </div>

      <ManualLogModal
        isOpen={isManualLogOpen}
        onClose={() => setIsManualLogOpen(false)}
        subjects={availableSubjects}
        onSave={handleManualSave}
      />

      {/* Clear subject confirmation */}
      <Dialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
        <DialogContent className="bg-slate-950 border-rose-500/40 text-white max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4" />
              Clear all {deletingSubject} study logs?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 my-2">
            This will remove all study session entries recorded for{" "}
            <strong>{deletingSubject}</strong>.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeletingSubject(null)} className="text-xs text-slate-400">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => deletingSubject && handleClearSubject(deletingSubject)}
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