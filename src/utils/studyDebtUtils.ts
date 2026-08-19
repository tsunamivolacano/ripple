import { StudyLog, DailyStudySummary, ProcrastinationDebt, Task } from '@/types/ripple';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Computes daily summaries for the past 7 days from persistent study logs.
 */
export function computeDailyStudySummaries(
  studyLogs: StudyLog[],
  dailyTargetHours: number = 3.0
): {
  summaries: DailyStudySummary[];
  totalWeekCompletedHours: number;
  totalWeekTargetHours: number;
  totalWeekShortfall: number;
  recommendedNextDayTarget: number;
  accumulatedDeficit: number;
} {
  const summaries: DailyStudySummary[] = [];
  const now = new Date();

  let totalWeekCompletedMins = 0;
  let totalWeekTargetHours = 0;
  let totalShortfallHours = 0;

  // Compute for past 7 days (including today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = DAYS_SHORT[d.getDay()];

    // Find all study logs for this calendar date
    const dayLogs = studyLogs.filter((log) => {
      const logDate = new Date(log.loggedAt).toISOString().split('T')[0];
      return logDate === dateStr;
    });

    const dayMinutes = dayLogs.reduce((acc, l) => acc + (Number(l.durationMinutes) || 0), 0);
    const dayHours = Number((dayMinutes / 60).toFixed(1));
    const target = dailyTargetHours;

    // Shortfall: planned - actual (if studied less than target)
    const shortfall = Number(Math.max(0, target - dayHours).toFixed(1));

    totalWeekCompletedMins += dayMinutes;
    totalWeekTargetHours += target;
    totalShortfallHours += shortfall;

    summaries.push({
      date: dateStr,
      dayLabel,
      targetHours: target,
      completedHours: dayHours,
      shortfallHours: shortfall,
      sessionsCount: dayLogs.length
    });
  }

  const totalWeekCompletedHours = Number((totalWeekCompletedMins / 60).toFixed(1));
  const accumulatedDeficit = Number(totalShortfallHours.toFixed(1));

  // Intelligent adaptive recommendation:
  // Instead of demanding all deficit at once, distribute 25% of accumulated deficit across the next day
  // while capping at a realistic ceiling (e.g. max 5.5 hours/day) so student doesn't burn out.
  const deficitAddition = Math.min(2.0, accumulatedDeficit * 0.25);
  const recommendedNextDayTarget = Number(
    Math.min(5.5, dailyTargetHours + deficitAddition).toFixed(1)
  );

  return {
    summaries,
    totalWeekCompletedHours,
    totalWeekTargetHours,
    totalWeekShortfall: accumulatedDeficit,
    recommendedNextDayTarget,
    accumulatedDeficit
  };
}

/**
 * Calculates unified procrastination debt combining:
 * 1. Accumulated study hour shortfall (planned vs actual study hours deficit)
 * 2. Uncompleted / delayed task backlog
 * 3. Compounding procrastination score (0 - 100)
 */
export function calculateUnifiedDebt(
  studyLogs: StudyLog[],
  tasks: Task[],
  dailyTargetHours: number = 3.0,
  streakDays: number = 0
): ProcrastinationDebt {
  const { summaries, accumulatedDeficit, recommendedNextDayTarget } = computeDailyStudySummaries(
    studyLogs,
    dailyTargetHours
  );

  // Incomplete / overdue task backlog hours
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const overdueOrCriticalTasks = activeTasks.filter(
    (t) => t.status === 'critical' || t.status === 'too_late'
  );

  const taskBacklogHours = activeTasks.reduce((acc, t) => {
    const rem = t.estimatedHours * (1 - (t.completionPercentage || 0) / 100);
    return acc + rem;
  }, 0);

  const missedDeadlinesCount = overdueOrCriticalTasks.length;

  // Total hours behind combines study shortfall deficit and pending critical task backlog
  const totalHoursBehind = Number((accumulatedDeficit + taskBacklogHours * 0.5).toFixed(1));

  // Compounding score calculation (0 - 100 scale)
  // Higher deficit & missed deadlines raise score; active streaks reduce score
  const baseDeficitScore = Math.min(50, accumulatedDeficit * 8);
  const taskRiskScore = Math.min(35, missedDeadlinesCount * 12 + taskBacklogHours * 3);
  const streakReduction = Math.min(25, streakDays * 3);

  const compoundingScore = Math.max(
    0,
    Math.min(100, Math.round(baseDeficitScore + taskRiskScore - streakReduction))
  );

  const weeklyDebtTrend = summaries.map((s) => ({
    day: s.dayLabel,
    debtHours: s.shortfallHours
  }));

  return {
    totalHoursBehind,
    missedDeadlinesCount,
    streakDays,
    compoundingScore,
    weeklyDebtTrend,
    dailyTargetHours,
    recommendedNextDayTargetHours: recommendedNextDayTarget,
    studyDeficitHours: accumulatedDeficit
  };
}