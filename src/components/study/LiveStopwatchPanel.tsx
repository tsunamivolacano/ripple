import React from "react";
import { Clock, Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLiveStopwatch } from "@/hooks/useLiveStopwatch";

interface LiveStopwatchPanelProps {
  subjects: string[];
  onSave: (minutes: number, subject: string, topic?: string) => void;
}

export const LiveStopwatchPanel: React.FC<LiveStopwatchPanelProps> = ({ subjects, onSave }) => {
  const stopwatch = useLiveStopwatch({ onSave });

  const minutes = Math.floor(stopwatch.elapsedSeconds / 60);
  const seconds = stopwatch.elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Live Open-Ended Study Timer</h3>
            <p className="text-xs text-slate-400">Track real study hours live — click stop whenever you finish!</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={stopwatch.subject} onValueChange={stopwatch.setSubject} disabled={stopwatch.isRunning}>
            <SelectTrigger className="w-40 bg-slate-950 border-slate-800 text-xs text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              {subjects.map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Topic (e.g. Chapter 4 Integration)"
            value={stopwatch.topic}
            onChange={(e) => stopwatch.setTopic(e.target.value)}
            disabled={stopwatch.isRunning}
            className="bg-slate-950 border-slate-800 text-xs text-white h-9 min-w-[160px]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <span className="font-mono text-4xl font-extrabold text-emerald-400 tracking-wider">
            {formattedTime}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {stopwatch.isRunning ? "⚡ Tracking Live Study Hours..." : "Ready to start live session"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={stopwatch.isRunning ? stopwatch.pause : stopwatch.start}
            className={`${
              stopwatch.isRunning ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            } text-white font-bold text-xs gap-1.5 h-9 px-5`}
          >
            {stopwatch.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            {stopwatch.isRunning ? "Pause" : "Start Live Timer"}
          </Button>

          {stopwatch.elapsedSeconds > 0 && (
            <Button
              onClick={stopwatch.stopAndSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 h-9"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Stop & Save Log
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={stopwatch.reset}
            className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white h-9 w-9"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};