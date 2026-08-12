import React from "react";
import { BookOpen, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StudyOverviewBannerProps {
  totalHours: number;
  remainingMinutes: number;
  subjectCount: number;
  onOpenManualLog: () => void;
}

export const StudyOverviewBanner: React.FC<StudyOverviewBannerProps> = ({
  totalHours,
  remainingMinutes,
  subjectCount,
  onOpenManualLog
}) => {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 gap-1.5 py-1 px-3">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Independent Study Tracker
          </Badge>
        </div>
        <h2 className="text-xl font-extrabold text-white">
          Subject-Wise Study Log & Live Tracker
        </h2>
        <p className="text-xs text-slate-400 max-w-lg">
          Start a live open-ended study timer or manually log completed study hours. All sessions sync directly to your live Calendar.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Study Time</span>
          <div className="text-2xl font-extrabold font-mono text-indigo-300 mt-0.5">
            {totalHours}h {remainingMinutes}m
          </div>
          <p className="text-[10px] text-slate-500 font-mono">{subjectCount} subjects tracked</p>
        </div>
        <Button
          onClick={onOpenManualLog}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-indigo-950"
        >
          <Plus className="w-4 h-4" />
          Manual Log
        </Button>
      </div>
    </div>
  );
};