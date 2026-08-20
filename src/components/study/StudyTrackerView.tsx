import React, { useState } from 'react';
import { useRipple } from '@/context/RippleContext';
import { computeDailyStudySummaries } from '@/utils/studyDebtUtils';
import { TimerMode } from '@/types/ripple';
import { 
  BookOpen, 
  Clock, 
  Plus, 
  Sparkles, 
  Trash2, 
  BarChart3, 
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Calendar,
  AlertCircle,
  Target,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const TIMER_PRESETS = [15, 25, 30, 45, 60];

export const StudyTrackerView: React.FC = () => {
  const { 
    studyLogs, 
    slots, 
    addStudyLog, 
    deleteStudyLog, 
    settings, 
    updateSettings,
    activeTimer,
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerMinimized,
    stopAndLogTimer,
    cancelGlobalTimer
  } = useRipple();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Live Study Timer Control States
  const [timerSubject, setTimerSubject] = useState<string>('Mathematics');
  const [timerTopic, setTimerTopic] = useState<string>('');
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState<number>(25);

  // Manual Log Form states
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [topic, setTopic] = useState<string>('');
  
  const dailyTargetHours = settings.dailyStudyTargetHours || 3.0;
  const [targetInput, setTargetInput] = useState<number>(dailyTargetHours);

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

  // Format 00:00:00 for active live timer
  const isRunning = activeTimer?.isRunning ?? false;
  const isCurrentTimerActive = Boolean(activeTimer);

  const displaySeconds = activeTimer
    ? (activeTimer.mode === 'stopwatch' ? activeTimer.elapsedSeconds : activeTimer.secondsLeft)
    : (timerMode === 'countdown' ? countdownMinutes * 60 : 0);

  const timerHours = Math.floor(displaySeconds / 3600);
  const timerMins = Math.floor((displaySeconds % 3600) / 60);
  const timerSecs = displaySeconds % 60;
  const formattedLiveClock = `${String(timerHours).padStart(2, '0')}:${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;

  const handleStartLiveTimer = () => {
    startGlobalTimer({
      subject: timerSubject || 'General Self-Study',
      topic: timerTopic.trim() || undefined,
      taskTitle: timerTopic.trim() || `${timerSubject} Live Study`,
      mode: timerMode,
      durationMinutes: timerMode === 'countdown' ? countdownMinutes : undefined,
      isMinimized: false
    });
  };

  const handleSubmitManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = selectedSubject === 'custom' ? customSubject.trim() : (selectedSubject || availableSubjects[0]);
    if (!finalSubject) return;

    const totalMinutes = Math.round(durationHours * 60 + durationMinutes);
    if (totalMinutes <= 0) return;

    await addStudyLog({
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

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput > 0 && targetInput <= 16) {
      updateSettings({ dailyStudyTargetHours: Number(targetInput.toFixed(1)) });
      setIsTargetModalOpen(false);
    }
  };

  // Calculations
  const totalStudyMinutes = studyLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

  // Daily analysis for past 7 days
  const { summaries, totalWeekCompletedHours, totalWeekShortfall, recommendedNextDayTarget } = computeDailyStudySummaries(
    studyLogs,
    dailyTargetHours
  );

  // Today's summary
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySummary = summaries.find((s) => s.date === todayDateStr) || summaries[summaries.length - 1];
  const todayPercent = Math.min(100, Math.round(((todaySummary?.completedHours || 0) / dailyTargetHours) * 100));

  // Group by Subject
  const subjectTotals = studyLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.subject] = (acc[log.subject] || 0) + log.durationMinutes;
    return acc;
  }, {});

  const sortedSubjectBreakdown = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div data-tour="study-section" className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 gap-1.5 py-1 px-3">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Live Study & Focus Engine (Supabase Synced)
            </Badge>
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-950/40">
              Live Auto-Save
            </Badge>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Live Study Tracker & Target Shortfall Ledger
          </h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Track real study sessions with the live 00:00:00 timer or manual entries. Sessions auto-record start/end timestamps and sync permanently to your Supabase Study Log.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-950/90 px-5 py-3 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All-Time Study Logged</span>
            <div className="text-2xl font-extrabold font-mono text-indigo-300 mt-0.5">
              {totalHours}h {remainingMins}m
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetInput(dailyTargetHours);
                setIsTargetModalOpen(true);
              }}
              className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 h-9 px-3 gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target: {dailyTargetHours}h/day</span>
            </Button>

            <Button
              onClick={() => {
                setSelectedSubject(availableSubjects[0]);
                setIsLogModalOpen(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold gap-1.5 border border-slate-700 h-9 px-3.5"
            >
              <Plus className="w-4 h-4" />
              Manual Log
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Live Study Timer Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl space-y-5 relative overflow-hidden ring-1 ring-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Clock className={`w-5 h-5 ${isRunning ? 'animate-pulse text-emerald-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Live Study Timer</h3>
                {isRunning ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse text-[10px]">
                    ● Recording Study Session
                  </Badge>
                ) : isCurrentTimerActive ? (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 text-[10px]">
                    ⏸️ Timer Paused
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px]">
                    Ready to Start
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isCurrentTimerActive
                  ? `Focusing on ${activeTimer.subject}${activeTimer.topic ? ` (${activeTimer.topic})` : ''} • Started at ${new Date(activeTimer.startTimeISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Start a stopwatch or countdown block. Minimizing keeps the timer running seamlessly across tabs.'}
              </p>
            </div>
          </div>

          {/* Mode Selector & Minimize button */}
          <div className="flex items-center gap-2">
            {!isCurrentTimerActive && (
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTimerMode('stopwatch')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    timerMode === 'stopwatch'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⏱️ Live Stopwatch
                </button>
                <button
                  type="button"
                  onClick={() => setTimerMode('countdown')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    timerMode === 'countdown'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⏳ Countdown Block
                </button>
              </div>
            )}

            {isCurrentTimerActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimerMinimized(true)}
                className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs text-emerald-300 gap-1.5 h-8 px-3 rounded-xl"
                title="Minimize to floating widget"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </Button>
            )}
          </div>
        </div>

        {/* Configuration Row when not running */}
        {!isCurrentTimerActive && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Subject</label>
              <Select value={timerSubject} onValueChange={setTimerSubject}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  {availableSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Topic / Notes (Optional)</label>
              <Input
                placeholder="e.g. Chapter 5 Calculus Exercises..."
                value={timerTopic}
                onChange={(e) => setTimerTopic(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white h-9 rounded-xl"
              />
            </div>

            {timerMode === 'countdown' ? (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Target Duration (Minutes)</label>
                <div className="flex items-center gap-1.5">
                  {TIMER_PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCountdownMinutes(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        countdownMinutes === m
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-slate-500 pb-2">
                  Stopwatch records continuously until you click "Stop & Save".
                </span>
              </div>
            )}
          </div>
        )}

        {/* Big Digital 00:00:00 Clock Display */}
        <div className="py-6 px-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <div className="font-mono text-5xl sm:text-6xl font-black text-emerald-400 tracking-wider drop-shadow-md">
            {formattedLiveClock}
          </div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-2">
            {isCurrentTimerActive
              ? (isRunning ? `Recording ${activeTimer.subject}` : 'Session Paused')
              : (timerMode === 'stopwatch' ? 'Real-Time Stopwatch' : `${countdownMinutes}-Minute Countdown Block`)}
          </span>

          {/* Action Control Buttons */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {!isCurrentTimerActive ? (
              <Button
                onClick={handleStartLiveTimer}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-6 h-10 rounded-xl shadow-lg shadow-emerald-950/80"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Live Timer</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={isRunning ? pauseGlobalTimer : resumeGlobalTimer}
                  className={`${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white font-bold text-xs gap-2 px-5 h-10 rounded-xl shadow-lg`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isRunning ? 'Pause Timer' : 'Resume Timer'}</span>
                </Button>

                <Button
                  onClick={stopAndLogTimer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-5 h-10 rounded-xl shadow-lg shadow-emerald-950"
                  title="Save study session permanently to Supabase"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Stop & Save to Study Log</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => resetGlobalTimer()}
                  className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs h-10 px-3 rounded-xl"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={cancelGlobalTimer}
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 text-xs h-10 px-3 rounded-xl gap-1"
                  title="Discard Timer without saving"
                >
                  <X className="w-4 h-4" />
                  <span>Discard</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Daily Planned vs Completed Tracker & Adaptive Recovery Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Target Status Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Today's Goal Progress
            </span>
            <Badge className={todayPercent >= 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}>
              {todaySummary?.completedHours || 0} / {dailyTargetHours} hrs
            </Badge>
          </div>

          <div className="space-y-1">
            <Progress value={todayPercent} className="h-2.5 bg-slate-950 [&>div]:bg-emerald-500" />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>{todayPercent}% of target</span>
              <span>
                {todayPercent >= 100 
                  ? '🎯 Daily Target Met!' 
                  : `${(dailyTargetHours - (todaySummary?.completedHours || 0)).toFixed(1)}h remaining today`}
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Accumulated Study Shortfall Deficit */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            7-Day Accumulated Shortfall
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {totalWeekShortfall} hrs
            </span>
            <span className="text-xs text-slate-400">behind target</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Recorded in your Debt Ledger. When you study extra, this shortfall decreases automatically.
          </p>
        </div>

        {/* AI Next-Day Adaptive Goal Recommendation */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Ripple AI Adaptive Target
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-indigo-300">
              {recommendedNextDayTarget} hrs
            </span>
            <span className="text-xs text-slate-400">recommended tomorrow</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Intelligently spreads accumulated deficit so you recover pace without burning out.
          </p>
        </div>
      </div>

      {/* 7-Day Daily Planned vs. Actual Bar Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            7-Day Planned vs. Completed Study History
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {totalWeekCompletedHours}h completed this week
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {summaries.map((s, idx) => {
            const pct = Math.min(100, Math.round((s.completedHours / s.targetHours) * 100));
            const isMet = s.completedHours >= s.targetHours;

            return (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col items-center gap-2 text-center">
                <span className="text-xs font-bold text-slate-300 uppercase">{s.dayLabel}</span>
                <div className="w-full h-24 bg-slate-900 rounded-lg p-1 flex flex-col justify-end relative overflow-hidden">
                  <div
                    className={`w-full rounded transition-all duration-500 ${
                      isMet ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ height: `${Math.max(8, pct)}%` }}
                  />
                </div>
                <div className="space-y-0.5 font-mono text-[10px]">
                  <span className="font-bold text-white block">{s.completedHours}h</span>
                  <span className="text-slate-500 block">goal: {s.targetHours}h</span>
                  {s.shortfallHours > 0 ? (
                    <span className="text-rose-400 text-[9px] block">-{s.shortfallHours}h</span>
                  ) : (
                    <span className="text-emerald-400 text-[9px] block">✓ Met</span>
                  )}
                </div>
              </div>
            );
          })}
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

                return (
                  <div
                    key={subject}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{subject}</h4>
                        <span className="text-xs font-mono text-indigo-300 font-bold">
                          {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}
                        </span>
                      </div>
                      <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-950/40 text-[10px]">
                        {percentage}% of total
                      </Badge>
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
                Log study sessions manually or start a Focus Sprint to record subject hours permanently to Supabase.
              </p>
            </div>
          )}
        </div>

        {/* Recent Study Log Stream (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Supabase Persistent Stream
            </h3>
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
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between">
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
                        {log.source === 'timer' ? '⏱️ Live Study Timer' : '✍️ Manual Entry'}
                      </span>
                      <span>
                        {new Date(log.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteStudyLog(log.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 p-1"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No study entries recorded in Supabase yet.
            </p>
          )}
        </div>
      </div>

      {/* Target Hours Setting Modal */}
      <Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Set Daily Planned Study Target
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTarget} className="space-y-4 my-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Daily Goal (Hours/Day)</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="16"
                value={targetInput}
                onChange={(e) => setTargetInput(Number(e.target.value))}
                required
                className="bg-slate-900 border-slate-800 text-xs text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 block pt-1">
                If you study less than this on any given day, the shortfall will be recorded and Ripple AI will gently calibrate your next day goal.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsTargetModalOpen(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                Save Target
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                Save & Sync to Supabase
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};